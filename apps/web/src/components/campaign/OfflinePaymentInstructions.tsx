import { Building2 } from "lucide-react";

export function OfflinePaymentInstructions() {
  return (
    <div className="rounded-xl bg-orange-50 border border-orange-200 p-5">
      <h3 className="font-bold text-orange-900 text-sm mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Offline Payment Instructions
      </h3>
      <div className="space-y-3 text-sm text-orange-800">
        <div className="flex items-start gap-2">
          <span className="font-bold text-orange-600">1.</span>
          <span>Offline donation is only payable by <strong>cheque</strong> or <strong>bank transfer</strong>.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-orange-600">2.</span>
          <span>Make cheques payable to: <strong>247 Global Business Solutions Ltd</strong></span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-orange-600">3.</span>
          <div>
            <span>Bank: <strong>Barclays Bank</strong></span>
            <br />
            <span>Sort Code: <strong>20-45-67</strong></span>
            <br />
            <span>Account No: <strong>73849251</strong></span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-orange-600">4.</span>
          <span>Reference: Use your name and campaign name as reference.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-orange-600">5.</span>
          <span>Post cheques to: <strong>247 Global Business Solutions Ltd, Unit 4, Imperial Business Centre, 151 Semaphore Road, London, SE15 3TR</strong></span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-orange-600">6.</span>
          <span>Payment must be received within <strong>14 days</strong> of your pledge. Your status will be confirmed once payment is received and verified.</span>
        </div>
      </div>
    </div>
  );
}
