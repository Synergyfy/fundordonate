import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementService } from "../mcom/entitlement.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthUserDto } from "./dto/auth-response.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { JwtPayload } from "./types/jwt-payload";

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * General login for registered users (email + password).
   */
  async login(dto: LoginDto): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.password || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueSession(user);
  }

  /**
   * Local, admin-only login. Regular users authenticate through MCOM Central
   * Hub SSO (see SsoService).
   */
  async adminLogin(dto: AdminLoginDto): Promise<IssuedSession> {
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.password || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.role !== "admin" && user.userType !== "admin") {
      throw new ForbiddenException("Administrator access required");
    }
    // Keep userType aligned with the admin role so routing/permissions are correct.
    if (user.userType !== "admin") {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { userType: "admin" },
      });
    }
    return this.issueSession(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<IssuedSession> {
    if (!dto.refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }
    const token = dto.refreshToken;
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (
      !stored ||
      stored.used ||
      stored.userId !== payload.sub ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException("Refresh token is expired or has been revoked");
    }

    // Rotate: invalidate the presented token, then issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { used: true },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    return this.issueSession(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }
    const subscription = await this.entitlements.buildLocalEntitlement(userId);
    return this.toAuthUser(user, subscription);
  }

  /** Issue a local access/refresh token pair for a user. */
  async issueSession(user: User): Promise<IssuedSession> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>("jwt.accessSecret"),
      expiresIn: this.config.get<string>("jwt.accessExpiresIn") as JwtSignOptions["expiresIn"],
    });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.get<string>("jwt.refreshSecret"),
        expiresIn: this.config.get<string>("jwt.refreshExpiresIn") as JwtSignOptions["expiresIn"],
      },
    );

    const decoded = this.jwt.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(user),
    };
  }

  toAuthUser(
    user: User,
    subscription: AuthUserDto["subscription"] = null,
  ): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      businessId: user.mcomBusinessId,
      membershipLevel: user.membershipLevel,
      membershipPlanName: user.membershipPlanName,
      membershipStatus: user.membershipStatus,
      subscription,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
