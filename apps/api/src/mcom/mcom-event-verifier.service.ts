import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import {
  createPublicKey,
  verify as cryptoVerify,
  type JsonWebKey,
  type KeyObject,
} from "crypto";

interface Jwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

interface JwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface JwtPayload {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

const JWKS_TTL_MS = 10 * 60 * 1000;

/**
 * Verifies the RS256 **service tokens** MCOM Rewards presents when it pushes
 * lifecycle events to FundOrDonate (integration guide §3.4 / §6).
 *
 * Tokens are verified **offline** against MCOM Central's JWKS — there is no
 * HMAC / shared secret between the two apps. The key set is cached and
 * refreshed on rotation (unknown `kid`) or after the TTL.
 *
 * Implemented with Node's built-in `crypto` (JWK import + RSA-SHA256 verify),
 * so no extra JWT dependency is required.
 */
@Injectable()
export class McomEventVerifierService {
  private readonly logger = new Logger(McomEventVerifierService.name);
  private readonly jwksUrl: string;
  private readonly issuer: string;
  private readonly audience: string;

  private keys: Jwk[] | null = null;
  private fetchedAt = 0;

  constructor(private readonly config: ConfigService) {
    const base = this.config.get<string>("mcom.baseUrl") ?? "http://localhost:3010";
    this.jwksUrl =
      this.config.get<string>("mcom.jwksUrl") ??
      `${base.replace(/\/+$/, "")}/.well-known/jwks.json`;
    this.issuer = this.config.get<string>("mcom.eventIssuer") ?? "mcom-solutions";
    this.audience = this.config.get<string>("mcom.eventAudience") ?? "fundordonate";
  }

  /**
   * Verify a Bearer token and return its claims. Throws `UnauthorizedException`
   * when the token is malformed, mis-signed, expired, or has the wrong
   * issuer/audience.
   */
  async verify(token: string): Promise<JwtPayload> {
    const parts = (token ?? "").split(".");
    if (parts.length !== 3) throw this.unauthorized("malformed token");
    const [headerSeg, payloadSeg, signatureSeg] = parts;

    let header: JwtHeader;
    let payload: JwtPayload;
    try {
      header = JSON.parse(Buffer.from(headerSeg, "base64url").toString("utf8"));
      payload = JSON.parse(Buffer.from(payloadSeg, "base64url").toString("utf8"));
    } catch {
      throw this.unauthorized("undecodable token");
    }

    if (header.alg !== "RS256") {
      throw this.unauthorized(`unsupported alg ${header.alg ?? "none"}`);
    }

    const signature = Buffer.from(signatureSeg, "base64url");
    const signingInput = Buffer.from(`${headerSeg}.${payloadSeg}`, "utf8");
    const key = await this.resolveKey(header.kid);

    let valid = false;
    try {
      valid = cryptoVerify("RSA-SHA256", signingInput, key, signature);
    } catch (err) {
      throw this.unauthorized(`signature verification error: ${(err as Error).message}`);
    }
    if (!valid) throw this.unauthorized("bad signature");

    const now = Date.now() / 1000;
    if (payload.exp !== undefined && now >= payload.exp) {
      throw this.unauthorized("token expired");
    }
    if (payload.nbf !== undefined && now < payload.nbf) {
      throw this.unauthorized("token not yet valid");
    }
    if (payload.iss !== this.issuer) {
      throw this.unauthorized(`unexpected issuer ${payload.iss}`);
    }
    if (!this.audienceMatches(payload.aud)) {
      throw this.unauthorized("audience mismatch");
    }

    return payload;
  }

  private audienceMatches(aud?: string | string[]): boolean {
    if (!aud) return false;
    return Array.isArray(aud) ? aud.includes(this.audience) : aud === this.audience;
  }

  private async resolveKey(kid?: string): Promise<KeyObject> {
    let jwk = this.pick(await this.getKeys(false), kid);
    if (!jwk) {
      // Key rotation: refetch once before giving up.
      jwk = this.pick(await this.getKeys(true), kid);
    }
    if (!jwk) {
      throw this.unauthorized(`no matching JWKS key for kid ${kid ?? "(none)"}`);
    }
    try {
      return createPublicKey({ key: jwk, format: "jwk" });
    } catch (err) {
      throw this.unauthorized(`invalid JWK: ${(err as Error).message}`);
    }
  }

  private pick(keys: Jwk[], kid?: string): Jwk | undefined {
    if (kid) return keys.find((k) => k.kid === kid);
    return keys.find((k) => (k.alg ? k.alg === "RS256" : true));
  }

  private async getKeys(force: boolean): Promise<Jwk[]> {
    const fresh = this.keys && Date.now() - this.fetchedAt < JWKS_TTL_MS;
    if (!force && fresh) return this.keys!;

    try {
      const { data } = await axios.get<{ keys?: Jwk[] }>(this.jwksUrl, { timeout: 8000 });
      const keys = Array.isArray(data?.keys) ? data.keys : [];
      if (keys.length === 0) throw new Error("empty key set");
      this.keys = keys;
      this.fetchedAt = Date.now();
      return keys;
    } catch (err) {
      if (this.keys) {
        this.logger.warn(
          `JWKS refresh failed (${(err as Error).message}); using cached keys`,
        );
        return this.keys;
      }
      throw this.unauthorized(`could not load JWKS: ${(err as Error).message}`);
    }
  }

  private unauthorized(message: string): UnauthorizedException {
    return new UnauthorizedException(`Invalid MCOM event token: ${message}`);
  }
}
