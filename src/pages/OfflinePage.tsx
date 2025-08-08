import { Button } from '../components/ui/button';
import { Logo } from '../components/ui/Logo';

export const OfflinePage = () => {
  const handleTryAgain = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Logo className="mx-auto mb-6 w-16 h-16" />
        
        <div className="text-6xl mb-4">📡</div>
        
        <h1 className="text-2xl font-bold text-[#8B6F47] mb-4 font-display">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-4 leading-relaxed">
          Don't worry! You can still access your saved markets and profile information while offline.
        </p>
        
        <p className="text-gray-500 text-sm mb-6">
          Please check your internet connection to access live market data and create new circles.
        </p>
        
        <Button 
          onClick={handleTryAgain}
          className="bg-[#8B6F47] hover:bg-[#725A3A] text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Try Again
        </Button>
        
        <div className="mt-8 text-xs text-gray-400">
          Some features may be available from cache
        </div>
      </div>
    </div>
  );
};