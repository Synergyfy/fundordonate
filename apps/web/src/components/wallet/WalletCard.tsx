import { Coins, ExternalLink, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { walletApi } from "@/services/wallet";

interface WalletCardProps {
  title?: string;
  subtitle?: string;
  showQuickActions?: boolean;
}

export function WalletCard({
  title = "MCOM Central Wallet",
  subtitle = "Single prepaid credit balance across the entire ecosystem",
  showQuickActions = true,
}: WalletCardProps) {
  const { data: wallet, isLoading, isError, refetch } = useWalletBalance();
  const topUpUrl = walletApi.getCentralTopUpUrl();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="h-10 w-1/2 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>
    );
  }

  const currentWallet = wallet ?? {
    success: true,
    balance: 0,
    availableBalance: 0,
    status: "ACTIVE" as const,
    currency: "MCOM" as const,
  };

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 p-6 shadow-xs text-left relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-amber-400/10 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
              <Coins className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh balance"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Available Balance
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {currentWallet.availableBalance.toFixed(2)}
            </span>
            <span className="text-sm font-bold text-amber-600">MCOM Credits</span>
            {currentWallet.balance !== currentWallet.availableBalance && (
              <span className="text-xs text-gray-400">
                (Total: {currentWallet.balance.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {showQuickActions && (
          <div className="flex items-center gap-2">
            <a
              href={topUpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
            >
              <span>Top Up Credits</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-amber-100/80 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="font-medium">Status: {currentWallet.status}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Instant checkout on any campaign</span>
        </div>
      </div>
    </div>
  );
}
