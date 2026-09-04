import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { DEFAULT_CURRENCY } from "@fundordonate/types";

// =============================================================================
// Receipt Service
// Generate PDF receipts and e-cards for donations/pledges
// =============================================================================

interface ReceiptData {
  uid: string;
  type: "donation" | "pledge";
  amount: number;
  currency: string;
  date: Date;
  status: string;
  campaign: {
    title: string;
    slug: string;
    author?: { firstName: string | null; lastName: string | null };
  };
  donor?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    companyName?: string | null;
  };
  reward?: {
    title: string;
    amount: number;
  };
  tribute?: {
    type: string;
    to: string;
  };
  paymentMethod?: string;
  processingFee?: number;
}

/**
 * Get receipt data for a donation
 */
export async function getDonationReceipt(uid: string): Promise<ReceiptData | null> {
  const donation = await prisma.donation.findUnique({
    where: { uid },
    include: {
      campaign: {
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!donation) return null;

  return {
    uid: donation.uid,
    type: "donation",
    amount: donation.amount,
    currency: donation.currency || DEFAULT_CURRENCY,
    date: donation.createdAt,
    status: donation.status,
    campaign: {
      title: donation.campaign.title,
      slug: donation.campaign.slug,
      author: donation.campaign.author,
    },
    donor: donation.user
      ? {
          firstName: donation.user.firstName,
          lastName: donation.user.lastName,
          email: donation.user.email,
        }
      : undefined,
    tribute: donation.tributeType
      ? {
          type: donation.tributeType,
          to: donation.tributeTo || "",
        }
      : undefined,
    paymentMethod: donation.paymentMethod || undefined,
  };
}

/**
 * Get receipt data for a pledge
 */
export async function getPledgeReceipt(uid: string): Promise<ReceiptData | null> {
  const pledge = await prisma.pledge.findUnique({
    where: { uid },
    include: {
      campaign: {
        include: {
          author: { select: { firstName: true, lastName: true } },
        },
      },
      user: { select: { firstName: true, lastName: true, email: true } },
      reward: { select: { title: true, amount: true } },
    },
  });

  if (!pledge) return null;

  return {
    uid: pledge.uid,
    type: "pledge",
    amount: pledge.amount,
    currency: DEFAULT_CURRENCY,
    date: pledge.createdAt,
    status: pledge.status,
    campaign: {
      title: pledge.campaign.title,
      slug: pledge.campaign.slug,
      author: pledge.campaign.author,
    },
    donor: pledge.user
      ? {
          firstName: pledge.user.firstName,
          lastName: pledge.user.lastName,
          email: pledge.user.email,
        }
      : undefined,
    reward: pledge.reward || undefined,
    paymentMethod: pledge.paymentMethod || undefined,
  };
}

/**
 * Generate HTML receipt content (can be converted to PDF)
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const donorName = data.donor
    ? `${data.donor.firstName || ""} ${data.donor.lastName || ""}`.trim()
    : "Anonymous";
  const campaignAuthor = data.campaign.author
    ? `${data.campaign.author.firstName || ""} ${data.campaign.author.lastName || ""}`.trim()
    : "FundorDonate";

  const currencySymbol = data.currency === "USD" ? "$" : data.currency === "GBP" ? "£" : data.currency === "EUR" ? "€" : data.currency + " ";
  const formattedAmount = `${currencySymbol}${(data.amount / 100).toFixed(2)}`;
  const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .amount { text-align: center; font-size: 36px; font-weight: 700; color: #059669; margin: 20px 0; }
    .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { font-weight: 500; color: #111827; font-size: 14px; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; font-size: 12px; color: #9ca3af; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .tribute { background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .tribute p { margin: 0; color: #92400e; font-size: 14px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Receipt</h1>
      <p>FundorDonate - Crowdfunding &amp; Donation Platform</p>
    </div>
    <div class="content">
      <div class="amount">${formattedAmount}</div>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value" style="font-family: monospace;">${data.uid}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">${data.type === "donation" ? "Donation" : "Pledge"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value"><span class="badge">${data.status.toUpperCase()}</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campaign</span>
          <span class="detail-value">${data.campaign.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campaign Organizer</span>
          <span class="detail-value">${campaignAuthor}</span>
        </div>
        ${data.paymentMethod ? `
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">${data.paymentMethod}</span>
        </div>` : ""}
        <div class="detail-row">
          <span class="detail-label">Donor</span>
          <span class="detail-value">${donorName}</span>
        </div>
      </div>

      ${data.tribute ? `
      <div class="tribute">
        <p><strong>${data.tribute.type === "in_honor" ? "In Honor Of" : "In Memory Of"}:</strong> ${data.tribute.to}</p>
      </div>` : ""}

      ${data.reward ? `
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Reward Tier</span>
          <span class="detail-value">${data.reward.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reward Value</span>
          <span class="detail-value">${currencySymbol}${(data.reward.amount / 100).toFixed(2)}</span>
        </div>
      </div>` : ""}

      <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">
        Thank you for your generous support! This receipt can be used for tax purposes.
      </p>
    </div>
    <div class="footer">
      <p>FundorDonate &copy; ${new Date().getFullYear()}</p>
      <p>This is an automated receipt. No signature required.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate e-card HTML for donations
 */
export function generateECardHTML(data: ReceiptData, message?: string): string {
  const donorName = data.donor
    ? `${data.donor.firstName || ""} ${data.donor.lastName || ""}`.trim()
    : "Anonymous";

  const recipientName = data.tribute?.to || "Someone Special";
  const tributeType = data.tribute?.type === "in_memory" ? "In Memory Of" : "In Honor Of";
  const currencySymbol = data.currency === "USD" ? "$" : data.currency === "GBP" ? "£" : data.currency === "EUR" ? "€" : data.currency + " ";
  const formattedAmount = `${currencySymbol}${(data.amount / 100).toFixed(2)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .card { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .card-header { background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 40px 30px; text-align: center; }
    .card-header h1 { margin: 0; font-size: 28px; color: #92400e; }
    .card-body { padding: 30px; text-align: center; }
    .heart { font-size: 48px; margin: 16px 0; }
    .recipient { font-size: 22px; font-weight: 600; color: #111827; margin: 16px 0 8px; }
    .tribute-type { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .message { font-style: italic; color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0; padding: 20px; background: #fefce8; border-radius: 8px; }
    .donor-info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .donor-name { font-size: 16px; font-weight: 600; color: #111827; }
    .amount-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 16px 0; }
    .campaign { color: #6b7280; font-size: 13px; margin-top: 12px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h1>FundorDonate</h1>
    </div>
    <div class="card-body">
      <div class="heart">&#10084;&#65039;</div>
      <div class="recipient">${recipientName}</div>
      <div class="tribute-type">${tributeType}</div>

      ${message ? `<div class="message">"${message}"</div>` : ""}

      <div class="amount-badge">${formattedAmount} Donation</div>

      <div class="donor-info">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">With love from</p>
        <div class="donor-name">${donorName}</div>
      </div>

      <div class="campaign">
        Donation made to <strong>${data.campaign.title}</strong>
      </div>
    </div>
    <div class="footer">
      <p>A donation has been made in ${recipientName}'s name.</p>
      <p>FundorDonate &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate receipt PDF buffer (using html-pdf or puppeteer in production)
 * For now, returns HTML that can be printed/saved as PDF
 */
export async function generateReceiptPDF(uid: string, type: "donation" | "pledge"): Promise<Buffer | null> {
  try {
    const data = type === "donation"
      ? await getDonationReceipt(uid)
      : await getPledgeReceipt(uid);

    if (!data) return null;

    const html = generateReceiptHTML(data);

    // In production, use puppeteer or html-pdf to generate PDF:
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm' } });
    // await browser.close();
    // return pdf;

    // For now, return HTML as buffer
    return Buffer.from(html, "utf-8");
  } catch (error) {
    logger.error("Failed to generate receipt PDF", { error: String(error) });
    return null;
  }
}

/**
 * Generate e-card HTML
 */
export async function generateECard(
  uid: string,
  message?: string
): Promise<string | null> {
  try {
    const data = await getDonationReceipt(uid);
    if (!data) return null;
    return generateECardHTML(data, message);
  } catch (error) {
    logger.error("Failed to generate e-card", { error: String(error) });
    return null;
  }
}
