-- Normalize legacy `CampaignTemplate.rewardsConfig` entries.
--
-- Older seeds/wizards authored rewards as `{ id, name, rule, category }` with
-- no machine-readable `conditions`, so the reward engine treated them as
-- unconditional and the public campaign page advertised a £0 minimum. This
-- migration backfills a `conditions: [{ mode: "minimum", minPence }]` array
-- parsed from the free-text `rule` copy (e.g. "… contributing £25 or more").
--
-- Idempotent: entries that already declare `conditions` are left untouched.

UPDATE "campaign_templates" AS t
SET "rewardsConfig" = normalized.value
FROM (
  SELECT
    t2.id,
    jsonb_agg(
      CASE
        WHEN jsonb_array_length(COALESCE(elem->'conditions', '[]'::jsonb)) = 0
             AND elem ? 'rule'
             AND (elem->>'rule') ~ '£\s?[0-9]'
        THEN elem || jsonb_build_object(
          'conditions',
          jsonb_build_array(
            jsonb_build_object(
              'id', 'cond-' || COALESCE(elem->>'id', 'rule'),
              'mode', 'minimum',
              'minPence', ROUND(
                (regexp_replace(
                  substring(elem->>'rule' from '£\s?([0-9,]+(\.[0-9]{1,2})?)'),
                  ',', '', 'g'
                ))::numeric * 100
              )::int,
              'maxPence', NULL,
              'exactPence', NULL
            )
          )
        )
        ELSE elem
      END
      ORDER BY ord
    ) AS value
  FROM "campaign_templates" t2
  CROSS JOIN LATERAL jsonb_array_elements(t2."rewardsConfig") WITH ORDINALITY AS e(elem, ord)
  GROUP BY t2.id
) AS normalized
WHERE t.id = normalized.id
  AND jsonb_typeof(t."rewardsConfig") = 'array';
