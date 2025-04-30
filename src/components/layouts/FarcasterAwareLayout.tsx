import { useFarcaster } from "../../contexts/FarcasterContext";
import Layout from "../Layout";

export function FarcasterAwareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isInFarcaster } = useFarcaster();

  if (isInFarcaster) {
    // Simplified layout for Farcaster
    return <div className="farcaster-layout">{children}</div>;
  }

  // Regular website layout
  return <Layout>{children}</Layout>;
}
