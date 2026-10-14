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

    // Auto-provision initial business profile & settings for newly authenticated users
    if (!business) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      const userEmailPrefix = user.email ? user.email.split("@")[0] : "business";
      const businessName = dbUser?.firstName
        ? `${dbUser.firstName}'s Business`
        : `${userEmailPrefix.charAt(0).toUpperCase() + userEmailPrefix.slice(1)} Business`;
      const baseSlug = userEmailPrefix.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      business = await this.prisma.business.create({
        data: {
          name: businessName,
          slug,
          ownerId: user.id,
          businessType: "Independent Merchant",
          category: "Retail & Commerce",
          status: "ACTIVE",
          membershipTier: "BRONZE",
          email: user.email,
          city: "Manchester",
          localArea: "Northern Quarter",
          highStreet: "Oldham Street",
          postcode: "M1 1JG",
          settings: {
            create: {},
          },
        },
        include: {
          settings: true,
        },
      });
    }

    request.business = business;
    return true;
  }
}
