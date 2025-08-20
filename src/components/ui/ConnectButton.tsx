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
  
  console.log("ConnectButton account:", account);
  console.log("ConnectButton modal functions:", { isOpen, openModal, closeModal });
  console.log("ConnectButton openModal type:", typeof openModal);

  const handleClick = () => {
    console.log("ConnectButton clicked!");
    console.log("account.isConnected:", account.isConnected);
    
    if (account.isConnected) {
      console.log("Opening account modal for connected user");
      openModal({ step: 'ACCOUNT_MAIN' });
    } else {
      console.log("Opening auth modal for new user");
      openModal({ step: 'AUTH_MAIN' });
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
