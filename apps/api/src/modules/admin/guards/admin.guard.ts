import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    const isAdmin =
      user.role === "admin" ||
      user.userType === "admin";

    if (!isAdmin) {
      throw new ForbiddenException("Administrative access required");
    }

    return true;
  }
}
