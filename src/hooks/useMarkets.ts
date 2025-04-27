import { useQuery } from "@apollo/client";
import { MARKETS_QUERY } from "../graphql/queries";
import {
  MarketQueryResult,
  MarketQueryVariables,
  MarketStatus,
} from "../graphql/types";
import { useState } from "react";

const ITEMS_PER_PAGE = 12;

export const useMarkets = (initialStatus?: MarketStatus) => {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<MarketStatus | undefined>(initialStatus);

  const { data, loading, error, fetchMore, refetch } = useQuery<
    MarketQueryResult,
    MarketQueryVariables
  >(MARKETS_QUERY, {
    variables: {
      first: ITEMS_PER_PAGE,
      skip: page * ITEMS_PER_PAGE,
      orderBy: "createdAt",
      orderDirection: "desc",
      where: status ? { status } : undefined,
    },
    notifyOnNetworkStatusChange: true,
  });
  console.log("Markets data:", data);

  const loadMore = async () => {
    if (!data || loading) return;

    await fetchMore({
      variables: {
        skip: data.markets.length,
      },
    });
    setPage((prev) => prev + 1);
  };

  const filterByStatus = (newStatus?: MarketStatus) => {
    setStatus(newStatus);
    setPage(0);
    refetch({
      first: ITEMS_PER_PAGE,
      skip: 0,
      where: newStatus ? { status: newStatus } : undefined,
    });
  };

  return {
    markets: data?.markets || [],
    loading,
    error,
    loadMore,
    hasMore: data?.markets.length === ITEMS_PER_PAGE,
    filterByStatus,
    currentStatus: status,
  };
};
