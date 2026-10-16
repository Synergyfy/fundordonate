import api from "../api";
import type {
  ContributorProfile,
  FoundingMembership,
  FoundingProgramme,
  JoinProgrammeInput,
} from "./type";

export const foundingService = {
  /**
   * Get all founding programmes for a location.
   */
  async getProgrammes(locationId: string): Promise<FoundingProgramme[]> {
    try {
      const res = await api.get("/founding/programmes", { params: { locationId } });
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Get a single founding programme by ID.
   */
  async getProgramme(programmeId: string): Promise<FoundingProgramme | null> {
    try {
      const res = await api.get(`/founding/programmes/${programmeId}`);
      return res || null;
    } catch {
      return null;
    }
  },

  /**
   * Join a founding programme (one-time or monthly).
   * Creates a FoundingMembership and processes payment.
   */
  async joinProgramme(input: JoinProgrammeInput): Promise<FoundingMembership | null> {
    try {
      const res = await api.post(`/founding/programmes/${input.programmeId}/join`, input);
      return res || null;
    } catch {
      return null;
    }
  },

  /**
   * Get the current user's founding memberships.
   */
  async getMyMemberships(): Promise<FoundingMembership[]> {
    try {
      const res = await api.get("/founding/my-memberships");
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Get founding members for a programme (leaderboard).
   */
  async getProgrammeMembers(programmeId: string): Promise<FoundingMembership[]> {
    try {
      const res = await api.get(`/founding/programmes/${programmeId}/members`);
      return res || [];
    } catch {
      return [];
    }
  },

  /**
   * Get the user's complete contributor profile.
   */
  async getContributorProfile(userId: string): Promise<ContributorProfile | null> {
    try {
      const res = await api.get(`/founding/contributor-profile/${userId}`);
      return res || null;
    } catch {
      return null;
    }
  },

  /**
   * Check if a user is an Original Founding Member for a location.
   */
  async checkOriginalStatus(userId: string, locationId: string): Promise<boolean> {
    try {
      const res: any = await api.get("/founding/check-original", { params: { userId, locationId } });
      return res?.isOriginal || false;
    } catch {
      return false;
    }
  },
};

export const foundingApi = foundingService;
export default foundingService;
export type * from "./type";
