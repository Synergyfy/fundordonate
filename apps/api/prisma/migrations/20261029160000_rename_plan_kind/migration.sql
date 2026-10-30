-- The platform sells "plans", not "memberships". Rename the stored enum values
-- so API responses and the admin UI use the product language consistently.

ALTER TYPE "PlanOrderKind" RENAME VALUE 'MEMBERSHIP' TO 'PLAN';
ALTER TYPE "PlanEntitlementKind" RENAME VALUE 'MEMBERSHIP' TO 'PLAN';
