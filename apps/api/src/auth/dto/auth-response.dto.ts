import { ApiProperty } from "@nestjs/swagger";

export class LocalEntitlementDto {
  @ApiProperty({ nullable: true }) planId!: string | null;
  @ApiProperty({ nullable: true }) planName!: string | null;
  @ApiProperty({ nullable: true }) source!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty() isTrial!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() quotas!: unknown;
  @ApiProperty() limits!: unknown;
  @ApiProperty({ type: [String] }) features!: string[];
  @ApiProperty({
    description:
      "Effective capability map: { [featureKey]: { enabled, limit, unlimited } }",
  })
  capabilities!: unknown;
  @ApiProperty({ nullable: true, description: "membership | access_pass | null" })
  entitlementKind!: string | null;
  @ApiProperty() tasksToComplete!: unknown;
  @ApiProperty({ nullable: true }) membershipPlanName!: string | null;
  @ApiProperty({ nullable: true, type: String, format: "date-time" })
  expiresAt!: Date | null;
}

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true }) username!: string | null;
  @ApiProperty() role!: string;
  @ApiProperty({ description: "admin | business | consumer" }) userType!: string;
  @ApiProperty({
    nullable: true,
    description:
      "Central Hub role discriminator: BUSINESS | CUSTOMER | AGENT | CONSULTANT | ACCOUNT_MANAGER | PARTNER",
  })
  profileType!: string | null;
  @ApiProperty({
    description: "True for affiliate/partner-portal accounts",
  })
  isAffiliate!: boolean;
  @ApiProperty({ nullable: true }) firstName!: string | null;
  @ApiProperty({ nullable: true }) lastName!: string | null;
  @ApiProperty({ nullable: true }) fullName!: string | null;
  @ApiProperty({ nullable: true }) jobTitle!: string | null;
  @ApiProperty({ nullable: true }) avatar!: string | null;
  @ApiProperty({ nullable: true }) phone!: string | null;
  @ApiProperty({ nullable: true }) address!: string | null;
  @ApiProperty({ nullable: true }) postcode!: string | null;
  @ApiProperty({ nullable: true }) country!: string | null;
  @ApiProperty() emailVerified!: boolean;
  @ApiProperty({ nullable: true }) businessId!: string | null;
  @ApiProperty({ nullable: true }) membershipLevel!: string | null;
  @ApiProperty({ nullable: true }) membershipTier!: string | null;
  @ApiProperty({ nullable: true }) membershipPlanName!: string | null;
  @ApiProperty({ nullable: true }) membershipStatus!: string | null;
  @ApiProperty({
    type: Object,
    nullable: true,
    description:
      "Role-specific profile snapshot from Central Hub (customer/agent/consultant/account manager)",
  })
  profile!: Record<string, unknown> | null;
  @ApiProperty({ type: LocalEntitlementDto, nullable: true })
  subscription?: LocalEntitlementDto | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}
