import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatus = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-[60] shadow-md">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
        <span className="font-medium">
          ⚠️ You're offline. Some features may not be available.
        </span>
      </div>
    </div>
  );
};