import React, { useState } from 'react';
import { Wifi, WifiOff, Download, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showCacheInfo, setShowCacheInfo] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Network Status Badge */}
        {!isOnline ? (
          <div
            onClick={() => setShowCacheInfo(true)}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-medium shadow-md shadow-amber-950/40 hover:bg-amber-500/30 transition"
            title="Click to view offline capabilities"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Offline (Remote Mode)</span>
          </div>
        ) : (
          <div
            onClick={() => setShowCacheInfo(true)}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-mono font-medium hover:bg-emerald-950/70 transition"
            title="Core protocols & last session cached locally"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Offline Cache Active</span>
            <span className="sm:hidden">Cached</span>
          </div>
        )}

        {/* PWA Install Button (Android / Chromium) */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950/60 border border-blue-400 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* PWA iOS Guide Button */}
        {!isInstalled && isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Install on iOS</span>
          </button>
        )}
      </div>

      {/* Modal: Offline Cache Information */}
      {showCacheInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Remote & Offline Readiness</h4>
                <p className="text-xs text-slate-400">
                  {isOnline ? 'Online with Local Storage Active' : 'Operating in Standalone Offline Mode'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 font-sans">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <strong className="text-amber-400 font-mono block">1. Local Triage Engine (No Internet Needed)</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  If cell reception drops in rural areas, the app automatically switches to its built-in rule engine (START/SALT protocols, snakebite ASV, CPR, tourniquet, shock protocols).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <strong className="text-blue-400 font-mono block">2. Session State Persistence (LocalStorage)</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Your chat conversation, victim tags, patient context, and Multi-Casualty Incident board are saved automatically to your device. Closing or reloading the app will not erase active triage data.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <strong className="text-emerald-400 font-mono block">3. Service Worker Asset Pre-caching</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  All app scripts, styles, sounds, and icons are cached via Service Worker so the page opens instantly even with zero signal.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCacheInfo(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              Close Info
            </button>
          </div>
        </div>
      )}

      {/* Modal: iOS Install Instructions */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-white space-y-4">
            <h4 className="text-base font-bold text-white">Install on iPhone / iPad</h4>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                1. Tap the <strong>Share</strong> button <span className="text-blue-400 font-mono">[↑]</span> at the bottom of Safari.
              </p>
              <p>
                2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.
              </p>
              <p>
                3. Tap <strong>Add</strong> in the top-right corner. The app will launch like a native emergency tool without browser bars.
              </p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
