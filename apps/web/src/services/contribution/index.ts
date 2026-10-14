import api from "../api";
import type {
  ContributionQueryDto,
  PaginatedContributions,
  SelfFundDto,
  SelfFundResult,
} from "./type";

export const contributionService = {
  /**
   * Fetch paginated contribution ledger and overall summary totals.
   */
  async getContributions(query?: ContributionQueryDto): Promise<PaginatedContributions> {
    return api.get("/business/contributions", { params: query });
  },

  /**
   * Execute self-funding payment into a business campaign.
   */
  async selfFund(campaignId: string, dto: SelfFundDto): Promise<SelfFundResult> {
    return api.post(`/business/campaigns/${campaignId}/self-fund`, dto);
  },
};

export default contributionService;
