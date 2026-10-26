import { useCallback, useEffect, useState } from "react";
import { campaignApi } from "@/services/campaign";
import type { PublicCampaign } from "./CampaignCard";

export type CampaignLoadStatus = "loading" | "success" | "error";

interface UsePublicCampaignsOptions {
  /** Optional campaign mode filter (e.g. "donation"). */
  mode?: string;
  /** Optional audience filter (business / consumer). */
  audience?: string;
  /** Maximum number of campaigns to return. */
  limit: number;
}

/**
 * Loads public campaigns from the live campaign API.
 */
export function usePublicCampaigns({ mode, audience, limit }: UsePublicCampaignsOptions) {
  const [status, setStatus] = useState<CampaignLoadStatus>("loading");
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await campaignApi.getFeatured(limit, audience, mode);
      const items = (Array.isArray(res) ? res : ((res as unknown as { items?: unknown[] })?.items || [])) as PublicCampaign[];
      let list = Array.isArray(items) ? items : [];
      if (mode) list = list.filter((c) => c.mode === mode);
      setCampaigns(list.slice(0, limit));
      setStatus("success");
    } catch {
      setCampaigns([]);
      setStatus("error");
    }
  }, [limit, mode, audience]);

  useEffect(() => {
    load();
  }, [load]);

  return { status, campaigns, load };
}
