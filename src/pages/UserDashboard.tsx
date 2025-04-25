import { useAccount } from "wagmi";
import { useUserActivity } from "../hooks/useUserActivity";
import { formatEther } from "viem";

export default function UserDashboard() {
  const { address } = useAccount();
  const { activity, loading, error } = useUserActivity(address || "");

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading your activity...</div>;
  if (error) return <div>Error loading activity: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Markets</h3>
          <p className="text-3xl font-bold">
            {new Set(activity.memberships.map((m) => m.marketId)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Deposits</h3>
          <p className="text-3xl font-bold">{activity.deposits.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Claims</h3>
          <p className="text-3xl font-bold">{activity.claims.length}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {/* Deposits */}
            {activity.deposits.slice(0, 5).map((deposit, index) => (
              <li key={`deposit-${index}`} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Deposit</p>
                    <p className="text-sm text-gray-500">
                      Market: {deposit.marketId}
                    </p>
                    <p className="text-sm text-gray-500">
                      Interval: {deposit.intervalIndex}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatEther(BigInt(deposit.amount))} ETH
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(
                        parseInt(deposit.timestamp) * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}

            {/* Claims */}
            {activity.claims.slice(0, 5).map((claim, index) => (
              <li key={`claim-${index}`} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Claim</p>
                    <p className="text-sm text-gray-500">
                      Market: {claim.marketId}
                    </p>
                    <p className="text-sm text-gray-500">
                      Interval: {claim.intervalIndex}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatEther(BigInt(claim.amount))} ETH
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(
                        parseInt(claim.timestamp) * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
