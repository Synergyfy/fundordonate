import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../../redis/redis.constants";
import { McomClient } from "../../mcom/mcom.client";
import { EntitlementService, type LocalEntitlement } from "../../mcom/entitlement.service";
import type { McomUser, McomUserInfo, PlatformEntitlement } from "../../mcom/mcom.types";
import { AuthService } from "../auth.service";
import type { AuthUserDto } from "../dto/auth-response.dto";

export interface SsoCallbackResult {
  success: boolean;
  returnPath: string;
  isNewUser?: boolean;
  user?: AuthUserDto;
  tokens?: { accessToken: string; refreshToken: string };
  entitlement?: LocalEntitlement | null;
  reason?: string;
  upgradeUrl?: string;
}

const STATE_TTL_SECONDS = 600;

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(
    private readonly mcom: McomClient,
    private readonly entitlements: EntitlementService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  isEnabled(): boolean {
    return Boolean(
      this.config.get<string>("mcom.clientId") &&
        this.config.get<string>("mcom.clientSecret"),
    );
  }

  /** Store the CSRF state (server-side, in Redis) and return the authorize URL. */
  async createLogin(
    state: string,
    returnPath: string,
  ): Promise<{ authorizeUrl: string }> {
    if (!this.isEnabled()) {
      throw new UnauthorizedException("MCOM SSO is not configured");
    }
    if (!state) {
      throw new BadRequestException("state is required");
    }
    await this.redis.set(
      this.stateKey(state),
      returnPath || "/",
      "EX",
      STATE_TTL_SECONDS,
    );
    return { authorizeUrl: this.mcom.buildAuthorizeUrl(state) };
  }

  /** Validate state, exchange the code, provision the user, issue a local session. */
  async handleCallback(code: string, state: string): Promise<SsoCallbackResult> {
    const key = this.stateKey(state);
    const returnPath = await this.redis.get(key);
    if (!returnPath) {
      throw new UnauthorizedException("Invalid or expired OAuth state");
    }
    await this.redis.del(key);

    let tokenResponse;
    try {
      tokenResponse = await this.mcom.exchangeCode(code);
    } catch (error) {
      this.logger.error(`Code exchange with Central failed: ${(error as Error).message}`);
      throw new BadGatewayException(
        "Unable to complete sign-in with MCOM Central Hub. Please try again.",
      );
    }

    return this.completeSso(
      this.normalize(tokenResponse.user),
      tokenResponse.entitlement ?? null,
      {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresIn: tokenResponse.expiresIn,
      },
      returnPath,
    );
  }

  /** Flow B — verify a Central-issued handshake JWT and establish a session. */
  async handleDirectToken(token: string): Promise<SsoCallbackResult> {
    const secret = this.config.get<string>("mcom.ssoSecret");
    if (!secret) {
      throw new UnauthorizedException("Direct SSO handshake is not enabled");
    }

    let payload: {
      userId?: string;
      sub?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    };
    try {
      payload = this.jwt.verify(token, { secret });
    } catch {
      throw new UnauthorizedException("Invalid or expired SSO token");
    }
    if (!payload.email) {
      throw new UnauthorizedException("SSO token is missing an email");
    }

    const mcomUser: McomUser = {
      id: payload.userId ?? payload.sub ?? payload.email,
      email: payload.email,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      role: payload.role,
    };

    return this.completeSso(mcomUser, null, undefined, "/");
  }

  /** Re-introspect the user's entitlement from Central (Task 4). */
  async refreshEntitlement(
    userId: string,
  ): Promise<{ hasAccess: boolean; entitlement: LocalEntitlement | null }> {
    const accessToken = await this.entitlements.getStoredCentralToken(userId);
    if (!accessToken) {
      throw new UnauthorizedException("No linked MCOM session");
    }

    const info = await this.mcom.getUserInfo(accessToken).catch((error: Error) => {
      this.logger.error(`Entitlement refresh failed: ${error.message}`);
      throw new BadGatewayException("Unable to reach MCOM Central Hub. Please try again.");
    });
    await this.entitlements.syncFromSso({
      mcomUser: this.normalize(info),
      entitlement: info.entitlement ?? null,
    });

    const entitlement = await this.entitlements.buildLocalEntitlement(userId);
    return { hasAccess: entitlement?.isActive ?? false, entitlement };
  }

  async logout(refreshToken?: string): Promise<{ success: boolean; logoutUrl: string }> {
    if (refreshToken) {
      await this.auth.logout(refreshToken);
    }
    const origin = this.config.get<string>("cors.origin") ?? "http://localhost:5023";
    return {
      success: true,
      logoutUrl: this.mcom.buildLogoutUrl(`${origin}/auth/login`),
    };
  }

  private async completeSso(
    mcomUser: McomUser,
    entitlement: PlatformEntitlement | null,
    tokens: { accessToken: string; refreshToken: string; expiresIn?: number } | undefined,
    returnPath: string,
  ): Promise<SsoCallbackResult> {
    // Gate on entitlement when Central returns one.
    if (entitlement?.access && entitlement.access.hasAccess === false) {
      this.logger.warn(
        `Access denied for ${mcomUser.email}: ${entitlement.access.reason}`,
      );
      return {
        success: false,
        returnPath,
        reason: entitlement.access.reason,
        upgradeUrl: entitlement.access.upgradeUrl,
      };
    }

    const { user, isNewUser } = await this.entitlements.syncFromSso({
      mcomUser,
      entitlement,
      tokens,
    });
    const session = await this.auth.issueSession(user);
    const localEntitlement = await this.entitlements.buildLocalEntitlement(user.id);

    return {
      success: true,
      returnPath,
      isNewUser,
      user: session.user,
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
      entitlement: localEntitlement,
    };
  }

  private stateKey(state: string): string {
    return `mcom:oauth:state:${state}`;
  }

  /** MCOM returns `sub` on userinfo and `id` on the token response. */
  private normalize(raw: McomUserInfo & { sub?: string }): McomUser {
    return {
      ...raw,
      id: (raw.id ?? raw.sub ?? raw.email) as string,
      businessProfile: raw.businessProfile ?? null,
    };
  }
}
