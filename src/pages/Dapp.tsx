import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

export default function DApp() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">Kuri Finance</h1>
          <ConnectKitButton />
        </header>

        {/* Main Content */}
        <main>
          {isConnected ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Dashboard Cards */}
              <div className="p-6 rounded-xl border border-[hsl(var(--gold))/20] bg-card/50 backdrop-blur-[1px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-semibold mb-4">Your Balance</h2>
                <p className="text-2xl font-bold text-[hsl(var(--forest))]">
                  0.00 ETH
                </p>
              </div>

              <div className="p-6 rounded-xl border border-[hsl(var(--gold))/20] bg-card/50 backdrop-blur-[1px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-semibold mb-4">Active Positions</h2>
                <p className="text-2xl font-bold">0</p>
              </div>

              <div className="p-6 rounded-xl border border-[hsl(var(--gold))/20] bg-card/50 backdrop-blur-[1px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-semibold mb-4">
                  Total Value Locked
                </h2>
                <p className="text-2xl font-bold text-[hsl(var(--gold))]">
                  $0.00
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold mb-4">
                Welcome to Kuri Finance
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Connect your wallet to get started
              </p>
              <ConnectKitButton />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function Dapp() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="fixed w-full backdrop-blur-md bg-black/20 border-b border-white/10 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold flex items-center">
            <div className="relative">
              <div className="flex items-center">
                <span className="font-sans font-extrabold text-[hsl(var(--gold))] text-2xl tracking-wide">
                  K
                </span>
                <span className="font-sans font-extrabold text-white text-2xl tracking-wide">
                  URI
                </span>
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[hsl(var(--gold))] to-white"></div>
              </div>
            </div>
          </a>
          <ConnectKitButton />
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Welcome to Kuri dApp</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to get started
          </p>
        </div>
      </main>
    </div>
  );
}
