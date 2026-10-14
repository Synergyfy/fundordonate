import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SsoController } from "./sso/sso.controller";
import { SsoService } from "./sso/sso.service";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    // Secrets/expiry are supplied per-signature call in AuthService.
    JwtModule.register({}),
  ],
  controllers: [AuthController, SsoController],
  providers: [AuthService, JwtStrategy, SsoService],
  exports: [AuthService],
})
export class AuthModule {}
