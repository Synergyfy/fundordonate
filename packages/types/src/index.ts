// =============================================================================
// Enums
// =============================================================================

export type UserRole = "admin" | "fundraiser" | "collaborator" | "backer" | "donor";

export type CampaignStatus = "draft" | "pending_review" | "published" | "ended" | "archived";

export type CampaignMode = "donation" | "crowdfunding";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type TransactionAction = "credit" | "debit";

export type TransactionType =
  | "earning"
  | "platform_fee"
  | "withdrawal_request"
  | "withdrawal_approval"
  | "withdrawal_rejection";

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export type PayoutMethod = "paypal" | "bank" | "others";

export type CommentStatus = "approved" | "pending" | "spam";

export type RewardStatus = "active" | "inactive";

export type FundStatus = "active" | "inactive";

export type TributeType = "in_honor" | "in_memory";

// =============================================================================
// Core Models
// =============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: UserRole;
  emailVerified: boolean;
  notifications: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  slug: string;
  permalink?: string | null;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  goalAmount: number;
  raisedAmount: number;
  deadline: Date;
  status: CampaignStatus;
  mode: CampaignMode;
  featuredImage?: string | null;
  videoUrl?: string | null;
  platformFee?: number | null;
  settings: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: User;
  fundraiserId?: string | null;
  fundraiser?: User | null;
  categoryId?: string | null;
  category?: Category | null;
  fundId?: string | null;
  fund?: Fund | null;
  images?: CampaignImage[];
  tags?: CampaignTag[];
  collaborators?: CampaignCollaborator[];
  rewards?: Reward[];
  donations?: Donation[];
  pledges?: Pledge[];
  posts?: CampaignPost[];
  comments?: Comment[];
  bookmarks?: Bookmark[];
  activities?: Activity[];
  snapshots?: CampaignSnapshot[];
}

export interface CampaignImage {
  id: string;
  url: string;
  alt?: string | null;
  order: number;
  createdAt: Date;
  campaignId: string;
}

export interface CampaignCollaborator {
  campaignId: string;
  collaboratorId: string;
  createdAt: Date;
}

export interface CampaignSnapshot {
  id: string;
  snapshot: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
}

// =============================================================================
// Engagement
// =============================================================================

export interface CampaignPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
}

export interface Comment {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  userId: string;
  parentId?: string | null;
  user?: User;
  parent?: Comment | null;
  replies?: Comment[];
}

export interface Bookmark {
  campaignId: string;
  userId: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  data: string;
  createdAt: Date;
  campaignId?: string | null;
  pledgeId?: string | null;
  donationId?: string | null;
  userId?: string | null;
  createdById?: string | null;
}

// =============================================================================
// Categories & Tags
// =============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface CampaignTag {
  campaignId: string;
  tagId: string;
}

// =============================================================================
// Rewards (Crowdfunding Mode)
// =============================================================================

export interface Reward {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  deliveryDate?: Date | null;
  limit?: number | null;
  status: RewardStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  items?: RewardItem[];
}

export interface RewardItem {
  id: string;
  title: string;
  description?: string | null;
  quantity: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  rewardId: string;
  downloads?: RewardItemDownload[];
}

export interface RewardItemDownload {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
  rewardItemId: string;
  userId: string;
}

// =============================================================================
// Funds
// =============================================================================

export interface Fund {
  id: string;
  title: string;
  description?: string | null;
  isDefault: boolean;
  status: FundStatus;
  createdAt: Date;
  createdBy?: string | null;
  updatedAt: Date;
  updatedBy?: string | null;
}

// =============================================================================
// Donations
// =============================================================================

export interface Donation {
  id: string;
  uid: string;
  amount: number;
  recoveryFee: number;
  processingFee: number;
  tributeType?: TributeType | null;
  tributeSalutation?: string | null;
  tributeTo?: string | null;
  tributeNotificationEmail?: string | null;
  tributeNotificationMessage?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  isAnonymous: boolean;
  isManual: boolean;
  userInfo: string;
  createdAt: Date;
  createdBy?: string | null;
  updatedAt: Date;
  updatedBy?: string | null;
  campaignId: string;
  campaign?: Campaign;
  fundId?: string | null;
  fund?: Fund | null;
  userId?: string | null;
  user?: User | null;
}

// =============================================================================
// Pledges (Crowdfunding Mode)
// =============================================================================

export interface Pledge {
  id: string;
  uid: string;
  status: PaymentStatus;
  pledgeOption?: string | null;
  amount: number;
  bonusSupportAmount: number;
  shippingCost: number;
  recoveryFee: number;
  processingFee: number;
  notes?: string | null;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  isManual: boolean;
  rewardInfo: string;
  userInfo: string;
  createdAt: Date;
  createdBy?: string | null;
  updatedAt: Date;
  updatedBy?: string | null;
  campaignId: string;
  campaign?: Campaign;
  userId?: string | null;
  user?: User | null;
  rewardId?: string | null;
  reward?: Reward | null;
}

// =============================================================================
// Wallet & Transactions
// =============================================================================

export interface Wallet {
  id: string;
  balance: number;
  requestedAmount: number;
  withdrawAmount: number;
  platformFee: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
  transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  action: TransactionAction;
  type: TransactionType;
  status: "pending" | "completed";
  referenceId?: string | null;
  referenceType?: string | null;
  createdAt: Date;
  walletId: string;
  campaignId?: string | null;
  campaign?: Campaign | null;
  pledgeId?: string | null;
  pledge?: Pledge | null;
  donationId?: string | null;
  donation?: Donation | null;
}

// =============================================================================
// Withdrawals
// =============================================================================

export interface WithdrawalRequest {
  id: string;
  amount: number;
  method: PayoutMethod;
  status: WithdrawalStatus;
  note?: string | null;
  attachment?: string | null;
  payoutInfo: string;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt: Date;
  userId: string;
  user?: User;
  items?: WithdrawalItem[];
}

export interface WithdrawalItem {
  amount: number;
  withdrawalRequestId: string;
  campaignId: string;
  campaign?: Campaign;
}

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
