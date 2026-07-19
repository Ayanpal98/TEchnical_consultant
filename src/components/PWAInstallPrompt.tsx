import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, Sparkles, Monitor, Tablet, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // 1. Connectivity detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Install prompt interception
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      // Show prompt highlight 2.5s after load for premium experience
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detect if already running in standalone mode (installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // 4. Listen for successful install event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowNotification(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show native prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clean up
    setDeferredPrompt(null);
    setIsInstallable(false);
    setShowNotification(false);
  };

  return (
    <>
      {/* 1. Offline Mode Banner */}
      {isOffline && (
        <div 
          id="pwa-offline-banner"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-red-600 text-white rounded-2xl shadow-2xl shadow-red-900/40 border border-red-500/30 animate-bounce font-sans text-sm max-w-sm md:max-w-md w-[90%]"
        >
          <div className="p-1.5 bg-white/25 rounded-lg shrink-0">
            <WifiOff className="w-5 h-5 animate-pulse text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs uppercase tracking-wider">Offline Mode Active</p>
            <p className="text-[11px] text-red-100 font-semibold leading-snug">
              Patient logs and Local Storage sandbox are fully functional. No data will be lost!
            </p>
          </div>
        </div>
      )}

      {/* 2. Custom Premium Install Invitation Modal/Banner */}
      {isInstallable && showNotification && !isInstalled && (
        <div 
          id="pwa-install-banner"
          className="fixed bottom-6 right-6 z-50 max-w-md w-[92vw] sm:w-[420px] bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-blue-900/10 p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-12 fade-in duration-500 font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0D47A1] to-[#00BFA6] rounded-2xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 tracking-tight">Clinova</span>
                  <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">
                    <Sparkles className="w-2.5 h-2.5" /> PWA
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  Install the app to run as a secure standalone application with full offline local storage consultation capabilities.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl">
            <div className="flex flex-col items-center text-center p-1.5">
              <Smartphone className="w-4 h-4 text-[#0D47A1] mb-1" />
              <span className="text-[9px] font-black text-slate-700">Native Look</span>
            </div>
            <div className="flex flex-col items-center text-center p-1.5 border-x border-slate-200">
              <WifiOff className="w-4 h-4 text-[#00BFA6] mb-1" />
              <span className="text-[9px] font-black text-slate-700">Offline Care</span>
            </div>
            <div className="flex flex-col items-center text-center p-1.5">
              <Monitor className="w-4 h-4 text-[#0D47A1] mb-1" />
              <span className="text-[9px] font-black text-slate-700">Multi-Device</span>
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowNotification(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-[#00BFA6] hover:from-blue-700 hover:to-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Floating persistent "Install" tab if notification was dismissed but is installable */}
      {isInstallable && !showNotification && !isInstalled && (
        <button
          onClick={() => setShowNotification(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-full shadow-2xl shadow-blue-900/20 border border-blue-400/20 transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer font-sans text-xs font-black"
        >
          <Download className="w-4 h-4" />
          <span>Install Web App</span>
        </button>
      )}
    </>
  );
};
