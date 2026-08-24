export type UserRole = "admin" | "fundraiser" | "collaborator" | "backer" | "donor";

export type CampaignStatus = "draft" | "pending_review" | "published" | "ended" | "archived";

export type CampaignMode = "donation" | "crowdfunding";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type TransactionAction = "credit" | "debit";

export type TransactionType = "earning" | "platform_fee" | "withdrawal_request" | "withdrawal_approval" | "withdrawal_rejection";

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export type PayoutMethod = "paypal" | "bank" | "others";

export interface User {
  id: string;
  email: string;
  username: string;
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
  rewards?: Reward[];
  donations?: Donation[];
  pledges?: Pledge[];
}

export interface CampaignImage {
  id: string;
  url: string;
  alt?: string | null;
  order: number;
  createdAt: Date;
  campaignId: string;
}

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

export interface Reward {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  deliveryDate?: Date | null;
  limit?: number | null;
  status: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
}

export interface Fund {
  id: string;
  title: string;
  description?: string | null;
  isDefault: boolean;
  status: string;
  createdAt: Date;
  createdBy?: string | null;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface Donation {
  id: string;
  uid: string;
  amount: number;
  recoveryFee: number;
  processingFee: number;
  tributeType?: string | null;
  tributeTo?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  transactionId?: string | null;
  paymentEngine?: string | null;
  paymentMethod?: string | null;
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

export interface Wallet {
  id: string;
  balance: number;
  requestedAmount: number;
  withdrawAmount: number;
  platformFee: number;
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
}

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
  id: string;
  amount: number;
  withdrawalRequestId: string;
  campaignId: string;
  campaign?: Campaign;
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
}

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
