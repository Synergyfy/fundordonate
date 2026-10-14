// =============================================================================
// FAQ Content & Help Topics
// Standard platform help items for consumer and business portals.
// =============================================================================

export interface FaqEntry {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  questions: FaqEntry[];
}

export const FAQ_LIST: FaqEntry[] = [
  {
    q: "What is FundOrDonate?",
    a: "FundOrDonate is a platform that supports Hyper Local National Reward and Loyalty Fund or Donate Hubs on UK High Streets. Business Owners and Local Residents can Fund or Donate to their Local Hub, with support for donation and fund modes.",
  },
  {
    q: "How do I start a Local Hub campaign?",
    a: "Click 'Start a Campaign' and follow the guided setup. You'll choose a campaign mode, set a goal, add a description, and publish when ready. It takes just a few minutes. Local Hubs are established across London with co-branded business partners.",
  },
  {
    q: "What are the fees?",
    a: "FundOrDonate charges a platform fee on successful campaigns. The exact fee depends on your membership plan — Business Contributors receive Backer Status, and Consumer Founding Members receive MCOM reward points.",
  },
  {
    q: "How do I receive funds?",
    a: "Funds are collected in your FundOrDonate wallet. You can request a withdrawal to your bank account through the dashboard. Withdrawals are processed within a few business days.",
  },
  {
    q: "What is a Founding Membership?",
    a: "Consumer Founding Members receive a free Gift or MCOM Reward point when they Fund or Donate. Members can share, exchange and redeem nationally — Gift Cards, Vouchers, Coupons, and Deals across the MCOM community network.",
  },
  {
    q: "How does cost-neutral community funding work?",
    a: "Join MCOM community's cost-neutral funding — Local Business Owners and Local Residents fund and donate to their local communities. Business Contributors receive Backer Status and national reward exchange benefits.",
  },
  {
    q: "What is the Mobile VCard integration?",
    a: "FundOrDonate integrates with Mobile VCard, allowing you to share Local Hub campaign details via digital business cards and QR codes for easy mobile discovery. Share, exchange and redeem across London and the UK.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach our support team through the contact form on this page or by emailing support@fundordonate.com. We aim to respond within 24 hours.",
  },
];

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    label: "General",
    questions: [
      FAQ_LIST[0],
      FAQ_LIST[5],
      FAQ_LIST[6],
    ],
  },
  {
    id: "campaigns",
    label: "Campaigns",
    questions: [
      FAQ_LIST[1],
      FAQ_LIST[3],
    ],
  },
  {
    id: "payments",
    label: "Contributions & Payments",
    questions: [
      FAQ_LIST[2],
    ],
  },
  {
    id: "rewards",
    label: "Rewards",
    questions: [
      FAQ_LIST[4],
    ],
  },
  {
    id: "account",
    label: "Account",
    questions: [
      FAQ_LIST[7],
    ],
  },
];
