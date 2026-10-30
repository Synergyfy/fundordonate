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
      fullName?: string;
      name?: string;
      role?: string;
      profileType?: string;
      isAffiliate?: boolean;
      jobTitle?: string;
      phone?: string;
      address?: string;
      postcode?: string;
      country?: string;
      businessId?: string;
      businessName?: string;
      avatarUrl?: string;
    };
    try {
      payload = this.jwt.verify(token, { secret });
    } catch {
      throw new UnauthorizedException("Invalid or expired SSO token");
    }
    if (!payload.email) {
      throw new UnauthorizedException("SSO token is missing an email");
    }

    let mcomUser: McomUser = {
      id: payload.userId ?? payload.sub ?? payload.email,
      email: payload.email,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      fullName:
        payload.fullName ??
        ([payload.firstName, payload.lastName].filter(Boolean).join(" ").trim() ||
          null),
      name: payload.name ?? null,
      role: payload.role,
      profileType: payload.profileType,
      isAffiliate: payload.isAffiliate,
      jobTitle: payload.jobTitle ?? null,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      postcode: payload.postcode ?? null,
      country: payload.country ?? null,
      businessId: payload.businessId ?? null,
      businessName: payload.businessName ?? null,
      avatarUrl: payload.avatarUrl ?? null,
    };

    // Central's direct-handshake JWT only carries a display `name`, not the
    // person's first/last name. Fetch the full profile so those fields (and the
    // business profile) are persisted locally. Fall back to the handshake
    // claims when the lookup is unavailable so login never depends on it.
    let entitlement: PlatformEntitlement | null = null;
    try {
      const info = await this.mcom.getUserInfo(token);
      mcomUser = this.normalize(info);
      entitlement = info.entitlement ?? null;
    } catch (error) {
      this.logger.warn(
        `Direct SSO profile lookup failed; using handshake claims: ${(error as Error).message}`,
      );
    }

    return this.completeSso(mcomUser, entitlement, undefined, "/");
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

  /**
   * Force a re-read of the user's identity from Central Hub and return the
   * refreshed local session user. Used when the profile page is opened or the
   * browser tab regains focus after the user edited their Central profile.
   */
  async refreshProfile(userId: string): Promise<{ user: AuthUserDto }> {
    const accessToken = await this.entitlements.getFreshCentralToken(userId);
    if (!accessToken) {
      throw new UnauthorizedException("No linked MCOM session");
    }

    const info = await this.mcom.getUserInfo(accessToken, 4000).catch((error: Error) => {
      this.logger.error(`Profile refresh failed: ${error.message}`);
      throw new BadGatewayException("Unable to reach MCOM Central Hub. Please try again.");
    });

    const { user } = await this.entitlements.syncFromSso({
      mcomUser: this.normalize(info),
      entitlement: info.entitlement ?? null,
    });
    const entitlement = await this.entitlements.buildLocalEntitlement(user.id);
    return { user: this.auth.toAuthUser(user, entitlement) };
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
    const { user, isNewUser } = await this.entitlements.syncFromSso({
      mcomUser,
      entitlement,
      tokens,
    });
    const localEntitlement = await this.entitlements.buildLocalEntitlement(user.id);

    // A locally purchased plan/access pass is authoritative. Only treat the
    // Central entitlement as denied when the user has no active local access.
    const access = entitlement?.access;
    const deniedByCentral = access?.hasAccess === false && !localEntitlement?.isActive;
    if (deniedByCentral) {
      this.logger.warn(
        `No platform access for ${mcomUser.email}: ${access?.reason}. ` +
          "Signing in so they can buy a plan or access pass.",
      );
    }

    // Always establish the local session. Users without an active plan need to
    // be able to reach the in-dashboard purchase page instead of being stopped
    // on an upgrade wall. The `reason` tells the client where to send them and
    // the API/capability layer continues to gate the features themselves.
    const session = await this.auth.issueSession(user);

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
      reason: deniedByCentral ? access?.reason : undefined,
      upgradeUrl: deniedByCentral ? access?.upgradeUrl : undefined,
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
