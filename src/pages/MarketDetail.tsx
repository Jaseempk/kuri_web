import { useParams } from "react-router-dom";
import { useKuriMarketDetail } from "../hooks/useKuriMarketDetail";
import { KuriState } from "../graphql/types";
import { formatEther } from "viem";

export default function MarketDetail() {
  const { address } = useParams<{ address: string }>();
  const { marketDetail, loading, error } = useKuriMarketDetail(address || "");

  if (loading) return <div>Loading market details...</div>;
  if (error) return <div>Error loading market: {error.message}</div>;
  if (!marketDetail) return <div>Market not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Market Overview */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Market Overview</h1>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600">Creator</label>
                <p className="font-medium">{marketDetail.creator}</p>
              </div>
              <div>
                <label className="text-gray-600">Kuri Amount</label>
                <p className="font-medium">
                  {formatEther(BigInt(marketDetail.kuriAmount))} ETH
                </p>
              </div>
              <div>
                <label className="text-gray-600">Participants</label>
                <p className="font-medium">
                  {marketDetail.activeParticipants}/
                  {marketDetail.totalParticipants}
                </p>
              </div>
              <div>
                <label className="text-gray-600">Status</label>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-sm ${
                    marketDetail.state === KuriState.ACTIVE
                      ? "bg-green-100 text-green-800"
                      : marketDetail.state === KuriState.FAILED
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {KuriState[marketDetail.state]}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Timeline</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600">Next Raffle</label>
                <p className="font-medium">
                  {new Date(
                    parseInt(marketDetail.nextRaffleTime) * 1000
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-gray-600">Next Deposit Due</label>
                <p className="font-medium">
                  {new Date(
                    parseInt(marketDetail.nextDepositTime) * 1000
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium">
                Deposits
              </button>
              <button className="text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-1 font-medium">
                Winners
              </button>
              <button className="text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-1 font-medium">
                Members
              </button>
            </nav>
          </div>

          {/* Deposits List */}
          <div className="mt-4">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {marketDetail.deposits.map((deposit, index) => (
                  <li key={index} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {deposit.user}
                        </p>
                        <p className="text-sm text-gray-500">
                          Interval #{deposit.intervalIndex}
                        </p>
                      </div>
                      <div>
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
