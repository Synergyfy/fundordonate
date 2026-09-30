// Demo funding store for the admin Funding workspace (frontend only — no API).
// Money amounts are stored in pence, consistent with the rest of the codebase.

export type FundStatus = "active" | "draft" | "closed";
export type PaymentStatus = "succeeded" | "pending" | "refunded" | "failed";
export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface AdminFund {
  id: string;
  name: string;
  type: "city" | "community" | "founding" | "strategic";
  citySlug: string | null; // null = national fund
  balance: number; // pence
  target: number; // pence
  status: FundStatus;
  description: string;
  createdAt: string; // ISO date
}

export interface AdminPayment {
  id: string;
  ref: string;
  donor: string;
  campaign: string;
  method: "card" | "bank_transfer" | "wallet";
  amount: number; // pence
  fee: number; // pence
  status: PaymentStatus;
  date: string; // ISO date
}

export interface AdminWithdrawal {
  id: string;
  recipient: string;
  campaign: string;
  amount: number; // pence
  method: string;
  status: WithdrawalStatus;
  requestedAt: string; // ISO date
  note: string;
}

const funds: AdminFund[] = [
  {
    id: "fund-london",
    name: "London City Fund",
    type: "city",
    citySlug: "london",
    balance: 48_250_000,
    target: 120_000_000,
    status: "active",
    description: "Season-wide fund pooling all London campaign contributions.",
    createdAt: "2026-07-01",
  },
  {
    id: "fund-manchester",
    name: "Manchester City Fund",
    type: "city",
    citySlug: "manchester",
    balance: 21_750_000,
    target: 60_000_000,
    status: "active",
    description: "Season-wide fund pooling all Manchester campaign contributions.",
    createdAt: "2026-07-01",
  },
  {
    id: "fund-birmingham",
    name: "Birmingham City Fund",
    type: "city",
    citySlug: "birmingham",
    balance: 14_900_000,
    target: 55_000_000,
    status: "active",
    description: "Season-wide fund pooling all Birmingham campaign contributions.",
    createdAt: "2026-07-04",
  },
  {
    id: "fund-community",
    name: "National Community Fund",
    type: "community",
    citySlug: null,
    balance: 33_400_000,
    target: 80_000_000,
    status: "active",
    description: "Cross-city community fund for national initiatives.",
    createdAt: "2026-06-15",
  },
  {
    id: "fund-founding",
    name: "Founding Members Programme",
    type: "founding",
    citySlug: null,
    balance: 9_600_000,
    target: 25_000_000,
    status: "draft",
    description: "Funds raised through the Founding Members programme, awaiting launch.",
    createdAt: "2026-09-10",
  },
];

const payments: AdminPayment[] = [
  { id: "pay-1", ref: "PAY-84120", donor: "Sarah Chen", campaign: "London Community Garden", method: "card", amount: 25_000, fee: 725, status: "succeeded", date: "2026-09-26" },
  { id: "pay-2", ref: "PAY-84119", donor: "James Wilson", campaign: "Manchester Tech Hub Launch", method: "bank_transfer", amount: 150_000, fee: 0, status: "succeeded", date: "2026-09-26" },
  { id: "pay-3", ref: "PAY-84118", donor: "Amelia Foster", campaign: "Birmingham Food Bank Network", method: "card", amount: 10_000, fee: 340, status: "pending", date: "2026-09-25" },
  { id: "pay-4", ref: "PAY-84117", donor: "Noah Patel", campaign: "London Community Garden", method: "wallet", amount: 5_000, fee: 175, status: "succeeded", date: "2026-09-25" },
  { id: "pay-5", ref: "PAY-84116", donor: "Grace Okoro", campaign: "Leeds Digital Skills Programme", method: "card", amount: 75_000, fee: 2_175, status: "refunded", date: "2026-09-24" },
  { id: "pay-6", ref: "PAY-84115", donor: "Oliver Smith", campaign: "Manchester Tech Hub Launch", method: "card", amount: 30_000, fee: 895, status: "succeeded", date: "2026-09-23" },
  { id: "pay-7", ref: "PAY-84114", donor: "Ava Thompson", campaign: "Bristol Arts Centre", method: "wallet", amount: 2_500, fee: 95, status: "failed", date: "2026-09-23" },
  { id: "pay-8", ref: "PAY-84113", donor: "Henry Lewis", campaign: "London Community Garden", method: "bank_transfer", amount: 500_000, fee: 0, status: "succeeded", date: "2026-09-22" },
];

const withdrawals: AdminWithdrawal[] = [
  { id: "wd-1", recipient: "London Community Garden (Ella Wright)", campaign: "London Community Garden", amount: 4_500_000, method: "Bank transfer ····4021", status: "pending", requestedAt: "2026-09-26", note: "Phase 2 materials purchase." },
  { id: "wd-2", recipient: "Manchester Tech Hub (James Wilson)", campaign: "Manchester Tech Hub Launch", amount: 2_800_000, method: "Bank transfer ····7712", status: "pending", requestedAt: "2026-09-25", note: "Equipment lease settlement." },
  { id: "wd-3", recipient: "Birmingham Food Bank (Ruth Adeyemi)", campaign: "Birmingham Food Bank Network", amount: 1_250_000, method: "Bank transfer ····3390", status: "pending", requestedAt: "2026-09-24", note: "Van running costs." },
  { id: "wd-4", recipient: "Leeds Digital Skills (Priya Nair)", campaign: "Leeds Digital Skills Programme", amount: 900_000, method: "Bank transfer ····8814", status: "approved", requestedAt: "2026-09-18", note: "Approved by finance team." },
  { id: "wd-5", recipient: "Bristol Arts Centre (Tom Hughes)", campaign: "Bristol Arts Centre", amount: 640_000, method: "Bank transfer ····2205", status: "rejected", requestedAt: "2026-09-12", note: "Missing receipts for Q3 spend." },
];

export function getAdminFunds(): AdminFund[] {
  return [...funds];
}

export function getAdminPayments(status?: PaymentStatus): AdminPayment[] {
  const list = [...payments];
  return status ? list.filter((p) => p.status === status) : list;
}

export function getAdminWithdrawals(status?: WithdrawalStatus): AdminWithdrawal[] {
  const list = [...withdrawals];
  return status ? list.filter((w) => w.status === status) : list;
}

export function getPendingWithdrawalCount(): number {
  return withdrawals.filter((w) => w.status === "pending").length;
}

/** Create a fund (fake async — frontend demo store). */
export function createAdminFund(
  input: Pick<AdminFund, "name" | "type" | "citySlug" | "target" | "description">
): Promise<AdminFund> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fund: AdminFund = {
        id: `fund-${Date.now()}`,
        balance: 0,
        status: "draft",
        createdAt: new Date().toISOString().split("T")[0] ?? "",
        ...input,
      };
      funds.unshift(fund);
      resolve(fund);
    }, 400);
  });
}

/** Update a fund's status (fake async — frontend demo store). */
export function setAdminFundStatus(id: string, status: FundStatus): Promise<AdminFund | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fund = funds.find((f) => f.id === id);
      if (fund) fund.status = status;
      resolve(fund);
    }, 300);
  });
}

/** Approve or reject a withdrawal request (fake async — frontend demo store). */
export function decideWithdrawal(
  id: string,
  decision: "approved" | "rejected"
): Promise<AdminWithdrawal | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const wd = withdrawals.find((w) => w.id === id);
      if (wd) {
        wd.status = decision;
        if (decision === "approved") {
          wd.note = `${wd.note} · Approved ${new Date().toISOString().split("T")[0] ?? ""}`;
        }
      }
      resolve(wd);
    }, 350);
  });
}
