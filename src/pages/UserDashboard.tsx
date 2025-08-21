import { useAccount } from "@getpara/react-sdk";
import { useUserActivity } from "../hooks/useUserActivity";
import { formatEther } from "viem";

export default function UserDashboard() {
  const account = useAccount();
  const address = account.embedded.wallets?.[0]?.address;
  const { activity, loading, error } = useUserActivity(address || "");

  if (!address) {
    return (
      <div className="text-center py-8 xs:py-12">
        <h1 className="text-xl xs:text-2xl font-bold mb-3 xs:mb-4 text-[hsl(var(--gold))]">
          Connect Your Wallet
        </h1>
        <p className="text-sm xs:text-base text-muted-foreground">
          Please connect your wallet to view your dashboard
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-8 xs:py-12">
        <div className="text-sm xs:text-base text-muted-foreground">
          Loading your activity...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8 xs:py-12">
        <div className="text-sm xs:text-base text-red-600">
          Error loading activity: {error.message}
        </div>
      </div>
    );

  return (
    <div className="space-y-6 xs:space-y-8">
      <div className="text-center xs:text-left">
        <h1 className="text-2xl xs:text-3xl font-bold text-[hsl(var(--gold))]">
          Your Dashboard
        </h1>
        <p className="text-sm xs:text-base text-muted-foreground mt-1 xs:mt-2">
          Track your activity across all circles
        </p>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
        <div className="bg-white rounded-lg xs:rounded-xl shadow-sm border border-[hsl(var(--border))] p-4 xs:p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm xs:text-lg font-semibold mb-2 text-muted-foreground">
            Total Markets
          </h3>
          <p className="text-2xl xs:text-3xl font-bold text-[hsl(var(--gold))]">
            {new Set(activity.memberships.map((m) => m.marketId)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg xs:rounded-xl shadow-sm border border-[hsl(var(--border))] p-4 xs:p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm xs:text-lg font-semibold mb-2 text-muted-foreground">
            Total Deposits
          </h3>
          <p className="text-2xl xs:text-3xl font-bold text-blue-600">
            {activity.deposits.length}
          </p>
        </div>
        <div className="bg-white rounded-lg xs:rounded-xl shadow-sm border border-[hsl(var(--border))] p-4 xs:p-6 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm xs:text-lg font-semibold mb-2 text-muted-foreground">
            Total Claims
          </h3>
          <p className="text-2xl xs:text-3xl font-bold text-green-600">
            {activity.claims.length}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg xs:rounded-xl shadow-sm border border-[hsl(var(--border))] overflow-hidden">
        <div className="px-4 xs:px-6 py-4 xs:py-5 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg xs:text-xl font-semibold text-[hsl(var(--gold))]">
            Recent Activity
          </h3>
          <p className="text-xs xs:text-sm text-muted-foreground mt-1">
            Your latest deposits and claims
          </p>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {activity.deposits.length === 0 && activity.claims.length === 0 ? (
            <div className="px-4 xs:px-6 py-8 xs:py-12 text-center">
              <p className="text-sm xs:text-base text-muted-foreground">
                No activity yet
              </p>
              <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                Join a circle to start your savings journey
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]">
              {/* Deposits */}
              {activity.deposits.slice(0, 5).map((deposit, index) => (
                <li
                  key={`deposit-${index}`}
                  className="px-4 xs:px-6 py-3 xs:py-4 hover:bg-[hsl(var(--sand))/20] transition-colors"
                >
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4">
                    <div className="flex-1">
                      <p className="text-sm xs:text-base font-medium text-blue-600">
                        Deposit
                      </p>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        Market: {deposit.marketId.slice(0, 8)}...
                        {deposit.marketId.slice(-6)}
                      </p>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        Interval: {deposit.intervalIndex}
                      </p>
                    </div>
                    <div className="text-left xs:text-right flex-shrink-0">
                      <p className="text-sm xs:text-base font-medium text-gray-900">
                        {formatEther(BigInt(deposit.amount))} ETH
                      </p>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        {new Date(
                          parseInt(deposit.timestamp) * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}

              {/* Claims */}
              {activity.claims.slice(0, 5).map((claim, index) => (
                <li
                  key={`claim-${index}`}
                  className="px-4 xs:px-6 py-3 xs:py-4 hover:bg-[hsl(var(--sand))/20] transition-colors"
                >
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4">
                    <div className="flex-1">
                      <p className="text-sm xs:text-base font-medium text-green-600">
                        Claim
                      </p>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        Market: {claim.marketId.slice(0, 8)}...
                        {claim.marketId.slice(-6)}
                      </p>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        Interval: {claim.intervalIndex}
                      </p>
                    </div>
                    <div className="text-left xs:text-right flex-shrink-0">
                      <p className="text-sm xs:text-base font-medium text-gray-900">
                        {formatEther(BigInt(claim.amount))} ETH
                      </p>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        {new Date(
                          parseInt(claim.timestamp) * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
