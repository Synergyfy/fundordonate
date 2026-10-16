import { useState } from "react";
import { Coins, ExternalLink, RefreshCw } from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { walletApi } from "@/services/wallet";

export function WalletBalanceBadge() {
  const { data: wallet, isLoading, isError, refetch } = useWalletBalance();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 animate-pulse border border-amber-200">
        <Coins className="h-3.5 w-3.5 text-amber-500" />
        <span>Loading...</span>
      </div>
    );
  }

  if (isError || !wallet) {
    return null;
  }

  const topUpUrl = walletApi.getCentralTopUpUrl();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200/80 shadow-xs hover:border-amber-300 hover:from-amber-100 hover:to-orange-100 transition-all cursor-pointer"
        title="MCOM Wallet Balance"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
          🪙
        </span>
        <span>{wallet.balance.toFixed(2)} MCOM</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl z-50 text-left animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Coins className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    MCOM Central Wallet
                  </h4>
                  <span className="text-[10px] font-medium text-green-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {wallet.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh balance"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="py-3 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">Total Balance:</span>
                <span className="text-base font-bold text-gray-900">
                  {wallet.balance.toFixed(2)} <span className="text-xs text-amber-600 font-semibold">MCOM</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-gray-500">Available to spend:</span>
                <span className="font-semibold text-gray-700">
                  {wallet.availableBalance.toFixed(2)} MCOM
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <a
                href={topUpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition-colors"
              >
                <span>Top up at Central Hub</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="mt-2 text-[10px] text-gray-400 text-center leading-tight">
                Spendable across FundorDonate, MCOM Mall, and all partner platforms.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
