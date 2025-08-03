import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as BaseApolloProvider,
} from "@apollo/client";
import { useState } from "react";

const SUBGRAPH_URL =
  import.meta.env.VITE_SUBGRAPH_URL ||
  "https://indexer.dev.hyperindex.xyz/009fddc/v1/graphql"; // V1 GraphQL Endpoint

//https://youtu.be/VSVOQl-vFKk?si=-9Dd7_bHAK_TiAY8

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new ApolloClient({
        uri: SUBGRAPH_URL,
        cache: new InMemoryCache({
          typePolicies: {
            Query: {
              fields: {
                markets: {
                  // Merge function for pagination
                  keyArgs: false,
                  merge(existing = [], incoming) {
                    return [...existing, ...incoming];
                  },
                },
              },
            },
          },
        }),
      })
  );

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
