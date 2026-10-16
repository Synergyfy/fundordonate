import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Business } from "@prisma/client";

/**
 * Injects the authenticated user's active Business into the route handler.
 * Usage: `@CurrentBusiness() business: Business` or `@CurrentBusiness('id') businessId: string`
 */
export const CurrentBusiness = createParamDecorator(
  (data: keyof Business | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ business?: Business }>();
    const business = request.business;
    return data && business ? business[data] : business;
  },
);
