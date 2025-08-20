import { ParaWeb3Provider } from "./providers/ParaWeb3Provider";
import { ConnectButton } from "./components/ui/ConnectButton";
import { ProfileButton } from "./components/ui/ProfileButton";
import { useAccount } from "@getpara/react-sdk";

function ParaTestContent() {
  const account = useAccount();
  
  return (
    <div className="min-h-screen bg-[#F9F5F1] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#8B6F47] mb-8">
          Para Integration Test
        </h1>
        
        {/* Test email verification requirement */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          {account.isConnected ? (
            <div>
              <p className="text-green-600 mb-2">✓ Connected with Para</p>
              <p className="mb-2">Email: {account.user?.email}</p>
              <p className="mb-4">Address: {account.embedded.wallets?.[0]?.address}</p>
              <ProfileButton />
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Not connected</p>
              <ConnectButton />
            </div>
          )}
        </div>
        
        {/* Test profile creation flow */}
        {account.isConnected && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile Testing</h2>
            <p className="text-sm text-gray-600 mb-4">
              Test profile creation and API integration here
            </p>
            
            <div className="space-y-2 text-sm">
              <p><strong>Email Verified:</strong> {account.user?.email ? '✓' : '✗'}</p>
              <p><strong>Wallet Address:</strong> {account.embedded.wallets?.[0]?.address}</p>
              <p><strong>Wallet ID:</strong> {account.embedded.wallets?.[0]?.id}</p>
            </div>
          </div>
        )}

        {/* Test API compatibility */}
        {account.isConnected && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">API Compatibility Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tests for backend integration will be added here
            </p>
            
            <div className="space-y-2">
              <button 
                className="px-4 py-2 bg-[#8B6F47] text-white rounded hover:bg-[#725A3A] transition-colors"
                onClick={() => console.log('Test message signing')}
              >
                Test Message Signing
              </button>
              
              <button 
                className="px-4 py-2 bg-[#8B6F47] text-white rounded hover:bg-[#725A3A] transition-colors ml-2"
                onClick={() => console.log('Test profile creation')}
              >
                Test Profile Creation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ParaTestApp() {
  return (
    <ParaWeb3Provider>
      <ParaTestContent />
    </ParaWeb3Provider>
  );
}