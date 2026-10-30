-- Variant names are generated, never edited. Normalise existing rows to
-- "<Plan name> Standard | Pro | Pro+".
UPDATE "membership_plan_variants" v
SET "name" = p."name" || ' ' || CASE v."accessLevel"
  WHEN 'STANDARD' THEN 'Standard'
  WHEN 'PRO' THEN 'Pro'
  WHEN 'PRO_PLUS' THEN 'Pro+'
  ELSE v."accessLevel"::text
END
FROM "membership_plans" p
WHERE p."id" = v."planId";
