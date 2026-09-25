import React, { useState } from 'react';
import { Wifi, WifiOff, Download, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showCacheInfo, setShowCacheInfo] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Network Status Dot / Minimalist indicator */}
        <button
          onClick={() => setShowCacheInfo(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          title="Click to view offline readiness info"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              !isOnline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span className="hidden sm:inline">
            {!isOnline ? 'Offline Mode' : 'Offline Ready'}
          </span>
        </button>

        {/* Minimal Install Button */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[11px] font-medium border border-white/[0.08] transition-all"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>Install</span>
          </button>
        )}

        {/* Minimal iOS Guide Button */}
        {!isInstalled && isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-white text-[11px] transition-colors"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>Install</span>
          </button>
        )}
      </div>

      {/* Modal: Offline Cache Information */}
      {showCacheInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-slate-900/90 border border-white/[0.08] rounded-3xl p-5 shadow-2xl text-white space-y-3.5 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Offline Capability</h4>
                <p className="text-xs text-slate-400">
                  {isOnline ? 'Connected · Protocols Cached' : 'Standalone Offline Mode Active'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-amber-300 block mb-0.5 font-medium">Local Rule Engine</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Evaluates START/SALT emergency protocols completely offline when cell signal drops.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-blue-300 block mb-0.5 font-medium">Device Storage</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Triage logs, patient records, and history remain saved locally on device.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCacheInfo(false)}
              className="w-full py-2 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-xl text-xs font-medium transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: iOS Install Instructions */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-slate-900/90 border border-white/[0.08] rounded-3xl p-5 shadow-2xl text-white space-y-3 backdrop-blur-2xl">
            <h4 className="text-sm font-semibold text-white">Install on Home Screen</h4>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>1. Tap the <strong>Share</strong> button <span className="text-blue-400">[↑]</span> in Safari.</p>
              <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
              <p>3. Tap <strong>Add</strong> to launch without browser bars.</p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-xl text-xs font-medium transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
