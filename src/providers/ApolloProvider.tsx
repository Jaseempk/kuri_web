import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as BaseApolloProvider,
} from "@apollo/client";
import { useState } from "react";

const SUBGRAPH_URL =
  import.meta.env.VITE_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/107901/kuri_v1/version/latest";

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
