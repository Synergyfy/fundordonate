import type { DonationDetails } from "./DonationDetailsStep";
import type { DonorInfo } from "./DonationPersonalInfoStep";
import type { PaymentGateway } from "./DonationPaymentStep";

interface Props {
  campaignTitle: string;
  amount: number;
  details: DonationDetails;
  donorInfo: DonorInfo;
  gateway: PaymentGateway;
}

const FEE_RATE = 0.029;
const FEE_FIXED = 30;

export function DonationOrderSummary({ campaignTitle, amount, details, donorInfo, gateway }: Props) {
  const processingFee = details.coverFees ? Math.round(amount * FEE_RATE + FEE_FIXED) : 0;
  const total = amount + processingFee;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Summary</h3>

      <div className="border-b border-gray-100 pb-3">
        <p className="text-xs text-gray-400">Campaign</p>
        <p className="text-sm font-medium text-gray-900 truncate">{campaignTitle}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Donation</span>
          <span className="font-medium text-gray-900">${(amount / 100).toFixed(2)}</span>
        </div>
        {processingFee > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Processing fee</span>
            <span className="font-medium text-gray-900">${(processingFee / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-2">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">${(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
        {donorInfo.firstName && (
          <div className="flex justify-between">
            <span>Donor</span>
            <span className="text-gray-700">
              {details.isAnonymous ? "Anonymous" : `${donorInfo.firstName} ${donorInfo.lastName}`}
            </span>
          </div>
        )}
        {donorInfo.email && (
          <div className="flex justify-between">
            <span>Email</span>
            <span className="text-gray-700 truncate ml-2">{donorInfo.email}</span>
          </div>
        )}
        {details.companyName && (
          <div className="flex justify-between">
            <span>Company</span>
            <span className="text-gray-700">{details.companyName}</span>
          </div>
        )}
        {details.tributeTo && (
          <div className="flex justify-between">
            <span>Tribute</span>
            <span className="text-gray-700 truncate ml-2">
              {details.tributeTo}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Payment</span>
          <span className="text-gray-700 capitalize">
            {gateway === "native" ? "Bank Transfer" : gateway}
          </span>
        </div>
      </div>
    </div>
  );
}
