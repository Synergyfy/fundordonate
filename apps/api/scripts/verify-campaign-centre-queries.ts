/**
 * Guards the Campaign Centre against N+1 queries.
 *
 * `BusinessCampaignService.getTemplates()` must issue a fixed number of
 * database statements no matter how many templates exist, because every
 * per-template eligibility check is pure in-memory work.
 *
 * Run:
 *   pnpm --filter @fundordonate/api verify:campaign-centre
 */

import { BusinessCampaignService } from "../src/modules/business/services/business-campaign.service";
import { TemplateEligibilityService } from "../src/modules/eligibility/template-eligibility.service";

const EXPECTED_QUERIES = 4;

function makeTemplate(index: number) {
  return {
    id: `template-${index}`,
    name: `Template ${index}`,
    tagline: "Test template",
    seasonId: null,
    origin: "DIRECT",
    approvalMode: "AUTOMATIC",
    isActive: true,
    config: {
      access: {
        type: index % 3 === 0 ? "admin_assigned" : "automatic",
        eligibility:
          index % 3 === 0
            ? ["business_account", "admin_assigned"]
            : ["business_account"],
        assignedBusinessIds: index % 3 === 0 ? ["business-1"] : [],
      },
    },
    minEligibilityTier: "BRONZE",
    minContributionAmount: 0,
    selfFundingEnabled: false,
    selfFundingMode: "optional",
    selfFundingAmount: 0,
    selfFundingRewardName: null,
    businessRewardsMode: "disabled",
    fieldsConfig: [],
    rewardsConfig: [],
    mcomAssetsConfig: [],
  } as any;
}

async function loadFor(businessId: string, templateCount: number) {
  const calls: string[] = [];

  const prisma = {
    business: {
      findUnique: async () => {
        calls.push("business.findUnique");
        return {
          id: businessId,
          status: "ACTIVE",
          membershipTier: "BRONZE",
          membershipExpiry: null,
        };
      },
    },
    campaignTemplate: {
      findMany: async () => {
        calls.push("campaignTemplate.findMany");
        return Array.from({ length: templateCount }, (_, i) => makeTemplate(i));
      },
    },
    contribution: {
      aggregate: async () => {
        calls.push("contribution.aggregate");
        return { _sum: { amount: 0 } };
      },
    },
  } as any;

  const auditData = {
    refreshIfStale: async () => {
      calls.push("audit.refreshIfStale");
      return { linkStatus: "AVAILABLE" };
    },
  } as any;

  const service = new BusinessCampaignService(
    prisma,
    auditData,
    new TemplateEligibilityService(),
    { assertShallowSafeValue: () => undefined } as any,
  );

  const templates = await service.getTemplates(businessId);

  if (templates.length !== templateCount) {
    throw new Error(
      `Expected ${templateCount} templates, received ${templates.length}`,
    );
  }

  return { templates, queries: calls.length };
}

async function main() {
  const small = await loadFor("business-1", 1);
  const large = await loadFor("business-1", 60);

  console.log(`1 template   → ${small.queries} queries`);
  console.log(`60 templates → ${large.queries} queries`);

  if (small.queries !== EXPECTED_QUERIES || large.queries !== EXPECTED_QUERIES) {
    throw new Error(
      `N+1 regression: expected a flat ${EXPECTED_QUERIES} queries, got ${small.queries} and ${large.queries}.`,
    );
  }

  // The same rule set the claim endpoint enforces must decide the card state.
  const unassigned = await loadFor("business-2", 3);
  const gated = unassigned.templates.filter((t) => t.id === "template-0");
  const open = unassigned.templates.filter((t) => t.id !== "template-0");

  if (open.some((t) => t.status !== "available")) {
    throw new Error("Open templates should be available to every business.");
  }
  if (gated[0]?.status !== "locked") {
    throw new Error("Admin-assigned template should be locked for businesses not on the list.");
  }
  const adminReq = gated[0]?.requirements.find((r) => r.id === "admin_assigned");
  if (!adminReq || adminReq.met) {
    throw new Error("Admin-assigned template should report an unmet 'Assigned by an Admin' requirement.");
  }

  const assignedAgain = await loadFor("business-1", 3);
  const gatedForAssigned = assignedAgain.templates.find((t) => t.id === "template-0");
  if (gatedForAssigned?.status !== "available") {
    throw new Error("Admin-assigned template should be available to a listed business.");
  }

  // Step 14 — self-funding obligations must be evaluated with the same helpers
  // the submit flow uses.
  const elig = new TemplateEligibilityService();
  const base = {
    config: {},
    minEligibilityTier: "BRONZE" as const,
    minContributionAmount: 0,
  };
  const required = {
    ...base,
    selfFundingEnabled: true,
    selfFundingMode: "required",
    selfFundingAmount: 10_000,
  };
  const optional = { ...base, selfFundingEnabled: true, selfFundingMode: "optional" };
  const notAllowed = { ...base, selfFundingEnabled: false, selfFundingMode: "optional" };

  if (elig.selfFundingMet(required as any, 0)) {
    throw new Error("Required self-funding must not be met at £0.");
  }
  if (!elig.selfFundingMet(required as any, 10_000)) {
    throw new Error("Required self-funding must be met at the configured amount.");
  }
  if (!elig.selfFundingMet(optional as any, 0)) {
    throw new Error("Optional self-funding must never block submission.");
  }
  if (elig.selfFundingMode(notAllowed as any) !== "not_allowed") {
    throw new Error("Disabled self-funding must resolve to 'not_allowed'.");
  }
  if (elig.selfFundingMet(notAllowed as any, 0) !== true) {
    throw new Error("'not_allowed' must not block submission.");
  }

  console.log("OK — required seed funding blocks submission until paid.");
  console.log(`OK — query count stays flat at ${EXPECTED_QUERIES}.`);
  console.log("OK — admin-assigned rule decides available vs locked on the Campaign Centre.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
