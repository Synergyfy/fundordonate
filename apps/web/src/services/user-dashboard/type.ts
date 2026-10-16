export interface UserDashboardStats {
  totalDonated?: number;
  totalPledged?: number;
  campaignsSupported?: number;
  activeBookmarks?: number;
  [key: string]: any;
}

export interface UserDashboardProfile {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  [key: string]: any;
}
