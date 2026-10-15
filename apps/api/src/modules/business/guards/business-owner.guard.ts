import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { AuthenticatedUser } from "@/auth/types/jwt-payload";

@Injectable()
export class BusinessOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    // Retrieve active business for the authenticated user
    let business = await this.prisma.business.findFirst({
      where: {
        ownerId: user.id,
      },
      include: {
        settings: true,
      },
    });

    if (!business) {
      throw new ForbiddenException(
        "Business profile not found. Please complete business onboarding to access this resource.",
      );
    }

    request.business = business;
    return true;
  }
}
