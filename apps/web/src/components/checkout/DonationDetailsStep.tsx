import { useState } from "react";

export interface DonationDetails {
  isAnonymous: boolean;
  companyName: string;
  companyWebsite: string;
  tributeType: "" | "in_honor" | "in_memory";
  tributeTo: string;
  tributeSalutation: string;
  tributeNotificationEmail: string;
  tributeNotificationMessage: string;
  coverFees: boolean;
  notes: string;
}

interface Props {
  details: DonationDetails;
  onChange: (details: DonationDetails) => void;
  donationAmount: number;
}

export function DonationDetailsStep({ details, onChange, donationAmount }: Props) {
  const [showCompany, setShowCompany] = useState(!!details.companyName);
  const [showTribute, setShowTribute] = useState(!!details.tributeType);

  const processingFee = Math.round(donationAmount * 0.029 + 30);
  const totalWithFees = details.coverFees ? donationAmount + processingFee : donationAmount;

  const update = (field: keyof DonationDetails, value: unknown) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>
        <p className="mt-1 text-sm text-gray-500">Personalize your donation (all optional)</p>
      </div>

      {/* Anonymous */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3.5">
        <input
          type="checkbox"
          checked={details.isAnonymous}
          onChange={(e) => update("isAnonymous", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Make this donation anonymous</span>
          <p className="text-xs text-gray-500">Your name will not be displayed publicly</p>
        </div>
      </label>

      {/* Company */}
      <div className="rounded-lg border border-gray-200 p-3.5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={showCompany}
            onChange={(e) => {
              setShowCompany(e.target.checked);
              if (!e.target.checked) {
                update("companyName", "");
                update("companyWebsite", "");
              }
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Company donation</span>
            <p className="text-xs text-gray-500">Add your company name</p>
          </div>
        </label>
        {showCompany && (
          <div className="mt-3 space-y-3 pl-7">
            <input
              type="text"
              value={details.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="Company name"
              className="input-field"
            />
            <input
              type="url"
              value={details.companyWebsite}
              onChange={(e) => update("companyWebsite", e.target.value)}
              placeholder="https://example.com"
              className="input-field"
            />
          </div>
        )}
      </div>

      {/* Tribute */}
      <div className="rounded-lg border border-gray-200 p-3.5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={showTribute}
            onChange={(e) => {
              setShowTribute(e.target.checked);
              if (!e.target.checked) {
                update("tributeType", "");
                update("tributeTo", "");
                update("tributeSalutation", "");
                update("tributeNotificationEmail", "");
                update("tributeNotificationMessage", "");
              }
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Tribute donation</span>
            <p className="text-xs text-gray-500">Dedicate in honor or memory of someone</p>
          </div>
        </label>
        {showTribute && (
          <div className="mt-3 space-y-3 pl-7">
            <select
              value={details.tributeType}
              onChange={(e) => update("tributeType", e.target.value)}
              className="input-field"
            >
              <option value="">Select type...</option>
              <option value="in_honor">In Honor Of</option>
              <option value="in_memory">In Memory Of</option>
            </select>
            <input
              type="text"
              value={details.tributeTo}
              onChange={(e) => update("tributeTo", e.target.value)}
              placeholder="Honoree name"
              className="input-field"
            />
            <input
              type="email"
              value={details.tributeNotificationEmail}
              onChange={(e) => update("tributeNotificationEmail", e.target.value)}
              placeholder="Notify recipient (email)"
              className="input-field"
            />
            <textarea
              value={details.tributeNotificationMessage}
              onChange={(e) => update("tributeNotificationMessage", e.target.value)}
              rows={2}
              placeholder="Personal message (optional)"
              className="input-field resize-none"
            />
          </div>
        )}
      </div>

      {/* Cover Fees */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3.5">
        <input
          type="checkbox"
          checked={details.coverFees}
          onChange={(e) => update("coverFees", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Cover processing fees</span>
          <p className="text-xs text-gray-500">
            Add ${(processingFee / 100).toFixed(2)} so 100% goes to the cause
          </p>
        </div>
      </label>
      {details.coverFees && (
        <div className="rounded-lg bg-green-50 px-3.5 py-2.5 pl-10">
          <p className="text-xs text-green-700">
            Total: <span className="font-semibold">${(totalWithFees / 100).toFixed(2)}</span>
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Note (optional)</label>
        <textarea
          value={details.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
          placeholder="Message for the fundraiser..."
          className="input-field resize-none"
        />
      </div>
    </div>
  );
}
