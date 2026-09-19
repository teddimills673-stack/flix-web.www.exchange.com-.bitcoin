'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, ShieldAlert, Signal } from 'lucide-react';

interface InternetGuardProps {
  children: React.ReactNode;
}

export const InternetGuard: React.FC<InternetGuardProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof window !== 'undefined' ? navigator.onLine : true));
  const [isChecking, setIsChecking] = useState<boolean>(false);

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

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
    }, 800);
  };

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#070a14] flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">

          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/10">
            <WifiOff className="w-8 h-8 text-rose-400 animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">No Internet Connection</h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-8 px-2">
            An active internet connection is required to use this application. Please connect to Wi-Fi or mobile data and try again.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3.5 px-6 rounded-2xl font-semibold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Verifying connection...' : 'Retry Connection'}</span>
            </button>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-rose-400" />
                <span>Status: Disconnected</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
