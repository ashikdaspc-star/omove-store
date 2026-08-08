import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-rose-600 text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md z-50 sticky top-0 animate-fadeIn">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>YOU ARE CURRENTLY OFFLINE — PURCHASES & CHECKOUT ARE DISABLED UNTIL YOU RECONNECT.</span>
    </div>
  );
};
