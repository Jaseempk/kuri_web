import { useModal, useAccount } from "@getpara/react-sdk";
import { useSmartWallet } from "../../hooks/useSmartWallet";
import { Button } from "./button";

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function ConnectButton() {
  const { openModal } = useModal();
  const account = useAccount();
  const { smartAddress } = useSmartWallet();

  const handleClick = () => {
    if (account.isConnected) {
      openModal({ step: "ACCOUNT_MAIN" });
    } else {
      openModal({ step: "AUTH_MAIN" });
    }
  };

  return (
    <Button
      variant="default"
      size="default"
      onClick={handleClick}
      disabled={account.isLoading}
      className="hover:bg-white hover:text-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))]"
    >
      {account.isConnected && smartAddress
        ? formatAddress(smartAddress)
        : account.isLoading
        ? "Connecting..."
        : "Connect with Email"}
    </Button>
  );
}
