import { useAuthenticationService } from "../../services/AuthenticationService";
import { useAuthContext } from "../../contexts/AuthContext";
import { Button } from "./button";

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function ConnectButton() {
  const authService = useAuthenticationService();
  const { smartAddress, account } = useAuthContext();

  const handleClick = () => {
    if (account?.isConnected) {
      authService.openAccountModal();
    } else {
      authService.openAuthModal();
    }
  };

  return (
    <Button
      variant="default"
      size="default"
      onClick={handleClick}
      disabled={account?.isLoading}
      className="hover:bg-white hover:text-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))]"
    >
      {account?.isConnected && smartAddress
        ? formatAddress(smartAddress)
        : account?.isLoading
        ? "Connecting..."
        : "Connect with Email"}
    </Button>
  );
}
