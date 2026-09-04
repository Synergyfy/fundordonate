interface Reward {
  id: string;
  title: string;
  amount: number;
}

import type { PledgeDetails } from "./PledgeDetailsStep";
import type { PaymentGateway } from "./DonationPaymentStep";

interface Props {
  campaignTitle: string;
  selectedReward: Reward | null;
  details: PledgeDetails;
  gateway: PaymentGateway;
}

const FEE_RATE = 0.029;
const FEE_FIXED = 30;

export function PledgeOrderSummary({ campaignTitle, selectedReward, details, gateway }: Props) {
  const processingFee = details.coverFees ? Math.round(details.amount * FEE_RATE + FEE_FIXED) : 0;
  const total = details.amount + details.bonusSupport + processingFee;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Summary</h3>

      <div className="border-b border-gray-100 pb-3">
        <p className="text-xs text-gray-400">Campaign</p>
        <p className="text-sm font-medium text-gray-900 truncate">{campaignTitle}</p>
      </div>

      {selectedReward && (
        <div className="rounded-lg bg-primary-50 px-3 py-2">
          <p className="text-xs font-medium text-primary-800">{selectedReward.title}</p>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Pledge</span>
          <span className="font-medium text-gray-900">${(details.amount / 100).toFixed(2)}</span>
        </div>
        {details.bonusSupport > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Bonus</span>
            <span className="font-medium text-gray-900">+${(details.bonusSupport / 100).toFixed(2)}</span>
          </div>
        )}
        {processingFee > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Fee</span>
            <span className="font-medium text-gray-900">${(processingFee / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-2">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">${(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
        {details.shippingRequired && (
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-gray-700">{details.shippingFirstName} {details.shippingLastName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Payment</span>
          <span className="text-gray-700 capitalize">{gateway === "native" ? "Bank Transfer" : gateway}</span>
        </div>
      </div>
    </div>
  );
}
