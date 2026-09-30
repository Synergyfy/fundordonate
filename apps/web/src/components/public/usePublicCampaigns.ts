import { useCallback, useEffect, useState } from "react";
import { campaignApi } from "@/services/campaign.service";
import { DEMO_CAMPAIGNS, getDemoFeatured } from "@/data/demo";
import type { PublicCampaign } from "./CampaignCard";

export type CampaignLoadStatus = "loading" | "success" | "error";

interface UsePublicCampaignsOptions {
  /** Optional campaign mode filter (e.g. "donation"). */
  mode?: string;
  /** Maximum number of campaigns to return. */
  limit: number;
  /** Use the full demo campaign list (not just the curated featured set). */
  demoAll?: boolean;
}

/**
 * Loads public campaigns: API first, demo fallback if the backend is
 * unavailable so a section is never left blank.
 */
export function usePublicCampaigns({ mode, limit, demoAll = false }: UsePublicCampaignsOptions) {
  const [status, setStatus] = useState<CampaignLoadStatus>("loading");
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await campaignApi.getFeatured(30);
      const items = (Array.isArray(res) ? res : ((res as unknown as { items?: unknown[] })?.items || [])) as PublicCampaign[];
      let list = Array.isArray(items) ? items : [];
      if (mode) list = list.filter((c) => c.mode === mode);
      if (list.length === 0) {
        // API reachable but nothing published — show the empty state.
        setCampaigns([]);
        setStatus("success");
        return;
      }
      setCampaigns(list.slice(0, limit));
      setStatus("success");
    } catch {
      // Backend unavailable — fall back to demo campaigns so the section is never blank.
      const source = mode
        ? DEMO_CAMPAIGNS.filter((c) => c.mode === mode)
        : demoAll
          ? DEMO_CAMPAIGNS
          : getDemoFeatured();
      const fallback = source as unknown as PublicCampaign[];
      if (fallback.length > 0) {
        setCampaigns(fallback.slice(0, limit));
        setStatus("success");
      } else if (mode) {
        // Filter has no matching campaigns — empty state, not an error.
        setCampaigns([]);
        setStatus("success");
      } else {
        setCampaigns([]);
        setStatus("error");
      }
    }
  }, [limit, mode, demoAll]);

  useEffect(() => {
    load();
  }, [load]);

  return { status, campaigns, load };
}
