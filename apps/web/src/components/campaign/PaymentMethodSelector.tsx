import { CreditCard, Building2, MonitorSmartphone, CreditCard as PaypalIcon } from "lucide-react";

export type PaymentMethodType = "stripe" | "paypal" | "offline" | "terminal";

interface Props {
  value: PaymentMethodType | null;
  onChange: (value: PaymentMethodType) => void;
}

const METHODS: {
  id: PaymentMethodType;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBorder: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "stripe",
    name: "Pay by Card",
    description: "Secure card payment powered by Stripe",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    icon: CreditCard,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Pay securely with your PayPal account",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    icon: PaypalIcon,
  },
  {
    id: "offline",
    name: "Offline Payment",
    description: "Pay by cheque or bank transfer",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverBorder: "hover:border-orange-400",
    icon: Building2,
  },
  {
    id: "terminal",
    name: "Pay at Terminal",
    description: "Pay at a participating business near you",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-400",
    icon: MonitorSmartphone,
  },
];

export function PaymentMethodSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
      <div className="grid grid-cols-2 gap-3">
        {METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                value === method.id
                  ? `${method.borderColor} ${method.bgColor} ${method.color}`
                  : `border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50`
              }`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                value === method.id ? method.bgColor : "bg-gray-100"
              }`}>
                <Icon className={`h-5 w-5 ${value === method.id ? method.color : "text-gray-500"}`} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900">{method.name}</div>
                <div className="text-[11px] text-gray-500 leading-tight">{method.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
