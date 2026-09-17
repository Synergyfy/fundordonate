import { MonitorSmartphone } from "lucide-react";

export function TerminalPaymentInstructions() {
  return (
    <div className="rounded-xl bg-green-50 border border-green-200 p-5">
      <h3 className="font-bold text-green-900 text-sm mb-3 flex items-center gap-2">
        <MonitorSmartphone className="h-4 w-4" />
        Terminal Payment Instructions
      </h3>
      <div className="space-y-3 text-sm text-green-800">
        <div className="flex items-start gap-2">
          <span className="font-bold text-green-600">1.</span>
          <span>Terminal payments are made at <strong>participating businesses</strong> on your local high street.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-green-600">2.</span>
          <span>Look for businesses displaying the <strong>FundOrDonate Terminal</strong> sticker in their window.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-green-600">3.</span>
          <span>Visit the business and tell them you'd like to make a contribution via terminal payment.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-green-600">4.</span>
          <span>The business will process your payment on their terminal. You can pay by <strong>card</strong> or <strong>contactless</strong>.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-green-600">5.</span>
          <span>You'll receive a <strong>digital receipt</strong> via email confirming your contribution.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-green-600">6.</span>
          <span>Your status and rewards will be activated within <strong>24 hours</strong> of the terminal transaction being processed.</span>
        </div>
      </div>
    </div>
  );
}
