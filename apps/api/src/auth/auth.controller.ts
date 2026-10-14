import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService, type IssuedSession } from "./auth.service";
import { EntitlementService } from "../mcom/entitlement.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthUserDto } from "./dto/auth-response.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from "./utils/auth-cookie";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly entitlements: EntitlementService,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login (email + password)",
  })
  @ApiOkResponse({ type: AuthUserDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IssuedSession> {
    const session = await this.authService.login(dto);
    setAuthCookies(res, session.accessToken, session.refreshToken);
    return session;
  }

  @Post("admin/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Administrator login (email + password). Admin accounts only.",
  })
  @ApiOkResponse({ type: AuthUserDto })
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IssuedSession> {
    const session = await this.authService.adminLogin(dto);
    setAuthCookies(res, session.accessToken, session.refreshToken);
    return session;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Exchange a refresh token for a new token pair" })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IssuedSession> {
    const refreshToken = dto.refreshToken || req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }
    const session = await this.authService.refresh({ refreshToken });
    setAuthCookies(res, session.accessToken, session.refreshToken);
    return session;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke a refresh token" })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = dto?.refreshToken || req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    clearAuthCookies(res);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the currently authenticated user" })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser("id") userId: string): Promise<AuthUserDto> {
    return this.authService.me(userId);
  }

  @Get("entitlement")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user's local subscription/entitlement" })
  entitlement(@CurrentUser("id") userId: string) {
    return this.entitlements.buildLocalEntitlement(userId);
  }
}
