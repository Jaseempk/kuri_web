import { useModal, useAccount } from "@getpara/react-sdk";

// Debug: Test if the imports are working
console.log("Para SDK imports:", { useModal, useAccount });
import { Button } from "./button";

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function ConnectButton() {
  const { isOpen, openModal, closeModal } = useModal();
  const account = useAccount();

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
      {account.isConnected && account.embedded.wallets?.length
        ? formatAddress(account.embedded.wallets[0].address)
        : account.isLoading
        ? "Connecting..."
        : "Connect with Email"}
    </Button>
  );
}
