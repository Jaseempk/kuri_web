import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as BaseApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { useState } from "react";

const SUBGRAPH_URL =
  import.meta.env.VITE_SUBGRAPH_URL ||
  "https://indexer.dev.hyperindex.xyz/009fddc/v1/graphql"; // V1 GraphQL Endpoint

//https://youtu.be/VSVOQl-vFKk?si=-9Dd7_bHAK_TiAY8

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    const httpLink = createHttpLink({
      uri: SUBGRAPH_URL,
    });

    return new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              markets: {
                keyArgs: false,
                merge(existing = [], incoming) {
                  return [...existing, ...incoming];
                },
              },
            },
          },
        },
      }),
      // Reset cache on hot reload in development
      ...(import.meta.env.DEV && { defaultOptions: { watchQuery: { errorPolicy: 'all' } } }),
    });
  });

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
