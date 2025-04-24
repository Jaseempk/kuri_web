import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as BaseApolloProvider,
} from "@apollo/client";

const SUBGRAPH_URL =
  import.meta.env.VITE_SUBGRAPH_URL ||
  "https://api.thegraph.com/subgraphs/name/yourusername/kuri";

export const client = new ApolloClient({
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
});

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
