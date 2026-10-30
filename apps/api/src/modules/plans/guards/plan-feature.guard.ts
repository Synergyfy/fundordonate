import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CapabilityService } from "../services/capability.service";
import { PLAN_FEATURE_KEY } from "../decorators/require-plan-feature.decorator";

/**
 * Enforces `@RequirePlanFeature(...)` on a controller/handler. Admins bypass
 * feature gates (their endpoints are admin-scoped and separately guarded).
 */
@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly capabilities: CapabilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { id: string; role?: string; userType?: string };
    }>();
    const user = request.user;
    if (!user?.id) throw new UnauthorizedException("Authentication required");
    if (user.role === "admin" || user.userType === "admin") return true;

    for (const feature of required) {
      await this.capabilities.assertFeature(user.id, feature);
    }
    return true;
  }
}
