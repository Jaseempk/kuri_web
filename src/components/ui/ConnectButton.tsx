import { ConnectKitButton } from "connectkit";
import { Button } from "./button";
import { useAccount } from "wagmi";
import { cn } from "../../lib/utils";

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function ConnectButton() {
  const { address } = useAccount();

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show }) => {
        return (
          <Button
            variant="default"
            size="default"
            onClick={show}
            disabled={isConnecting}
            className="hover:bg-white hover:text-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))]"
          >
            {isConnected && address
              ? formatAddress(address)
              : isConnecting
              ? "Connecting..."
              : "Connect Wallet"}
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
