import { Module } from "@nestjs/common";
import { TemplateEligibilityService } from "./template-eligibility.service";

/**
 * Shared template-eligibility rules engine. Imported by the business campaign
 * module (claim flow) and the admin campaign module (assignment flow) so both
 * enforce exactly the same rules — including the 247GBS Audit `pre_audit` gate.
 */
@Module({
  providers: [TemplateEligibilityService],
  exports: [TemplateEligibilityService],
})
export class EligibilityModule {}
