import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Authenticates MCOM Console's Generic Billing API connector.
 *
 * MCOM sends the per-app API key in `x-mcom-solution-api-key` (older clients
 * may use `x-api-key`). The key is the same value stored as `MCOM_API_KEY` in
 * this app's environment when the app was registered in Central Hub.
 */
@Injectable()
export class McomSolutionApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const header = request.headers["x-mcom-solution-api-key"] ?? request.headers["x-api-key"];
    const provided = Array.isArray(header) ? header[0] : header;
    const expected = this.config.get<string>("mcom.apiKey") ?? process.env.MCOM_SOLUTION_API_KEY;

    if (!expected) {
      throw new UnauthorizedException("MCOM billing integration is not configured on this app.");
    }
    if (!provided || provided !== expected) {
      throw new UnauthorizedException("Invalid MCOM API key.");
    }
    return true;
  }
}
