import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKuriMarketDetail } from "../hooks/useKuriMarketDetail";
import { KuriState } from "../graphql/types";
import { formatEther } from "viem";
import { Button } from "../components/ui/button";
import { MarketSEO } from "../components/seo/MarketSEO";
import {
  validateContractAddress,
  handleInvalidAddress,
} from "../utils/validation";
import { generateMarketShareUrl } from "../utils/urlGenerator";
import { MarketDetail as MarketDetailType } from "../hooks/useKuriMarketDetail";

// Helper function to map MarketDetail to KuriMarket interface for SEO
const mapToKuriMarket = (marketDetail: MarketDetailType, address: string) => {
  return {
    address,
    creator: marketDetail.creator,
    totalParticipants: marketDetail.totalParticipants,
    activeParticipants: marketDetail.activeParticipants,
    kuriAmount: marketDetail.kuriAmount,
    intervalType: 0, // Default to weekly, this can be enhanced later
    state: marketDetail.state,
  };
};

export default function MarketDetail() {
  const { address } = useParams<{ address: string }>();
  const [activeTab, setActiveTab] = useState<
    "deposits" | "winners" | "members"
  >("deposits");
  const navigate = useNavigate();

  // Validate contract address on mount
  useEffect(() => {
    if (handleInvalidAddress(address, navigate)) {
      return;
    }
  }, [address, navigate]);

  const { marketDetail, loading, error, refetch } = useKuriMarketDetail(
    address || ""
  );

  // Generate shareable URL for this market
  const shareableUrl = address ? generateMarketShareUrl(address) : "";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !marketDetail) {
    return (
      <>
        <MarketSEO
          market={{
            address: address || "",
            creator: "",
            totalParticipants: 0,
            activeParticipants: 0,
            kuriAmount: "0",
            intervalType: 0,
            state: 0,
          }}
          metadata={{
            id: 0,
            market_address: address || "",
            created_at: "",
            short_description: error
              ? "Error Loading Market"
              : "Market Not Found",
            long_description: error
              ? "There was an error loading the market details. Please try again."
              : "The requested market could not be found or does not exist.",
            image_url: "",
          }}
        />
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? "Error Loading Market" : "Market Not Found"}
          </h2>
          <p className="text-gray-600 mb-4">
            {error
              ? "There was an error loading the market details. Please try again."
              : "The requested market could not be found or does not exist."}
          </p>
          <Button onClick={() => navigate("/markets")} className="mr-4">
            Back to Markets
          </Button>
          {error && (
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <MarketSEO
        market={mapToKuriMarket(marketDetail, address || "")}
        metadata={null}
      />
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
                <button
                  className={`border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium ${
                    activeTab === "deposits" ? "border-b-2" : ""
                  }`}
                  onClick={() => setActiveTab("deposits")}
                >
                  Deposits
                </button>
                <button
                  className={`text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-1 font-medium ${
                    activeTab === "winners" ? "border-b-2 border-gray-200" : ""
                  }`}
                  onClick={() => setActiveTab("winners")}
                >
                  Winners
                </button>
                <button
                  className={`text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-1 font-medium ${
                    activeTab === "members" ? "border-b-2 border-gray-200" : ""
                  }`}
                  onClick={() => setActiveTab("members")}
                >
                  Members
                </button>
              </nav>
            </div>

            {/* Deposits List */}
            {activeTab === "deposits" && (
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
            )}

            {/* Winners List */}
            {activeTab === "winners" && (
              <div className="mt-4">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {marketDetail.winners.length > 0 ? (
                      marketDetail.winners.map((winner, index) => (
                        <li key={index} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {winner.winner}
                              </p>
                              <p className="text-sm text-gray-500">
                                Interval #{winner.intervalIndex}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-600">
                                Winner 🏆
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  parseInt(winner.timestamp) * 1000
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-8 text-center text-gray-500">
                        No winners yet. The first raffle will happen once the
                        circle is active.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Members List */}
            {activeTab === "members" && (
              <div className="mt-4">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {marketDetail.members.length > 0 ? (
                      marketDetail.members.map((member, index) => (
                        <li key={index} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.address}
                              </p>
                              <p className="text-sm text-gray-500">
                                Joined{" "}
                                {new Date(
                                  parseInt(member.timestamp) * 1000
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  member.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {member.status === "accepted"
                                  ? "Active"
                                  : "Pending"}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-8 text-center text-gray-500">
                        No members have joined this circle yet.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
