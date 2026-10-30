import { SetMetadata } from "@nestjs/common";
import type { FeatureKey } from "../plan.constants";

export const PLAN_FEATURE_KEY = "plan_feature";
export const RequirePlanFeature = (...features: FeatureKey[]) =>
  SetMetadata(PLAN_FEATURE_KEY, features);
