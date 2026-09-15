import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, ChevronRight, Share2, PlusSquare } from 'lucide-react';
import { APP_LOGO_SRC } from '../lib/assets';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    window.addEventListener('resize', checkStandalone);

    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent)) {
      setIsAndroid(true);
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setIsIos(true);
    }

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', checkStandalone);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowTutorialModal(true);
    }
  };

  // If already running in Standalone (App) mode, or dismissed, don't show prompt
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Top Banner inside app */}
      <div className="bg-[#1a1b1e] border-b border-emerald-500/30 text-white px-4 py-2.5 shadow-lg relative z-40">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl p-0.5 shrink-0 border border-white/10 shadow overflow-hidden flex items-center justify-center bg-[#0a0f1d]">
              <img src={APP_LOGO_SRC} alt="GKD Mobility Logo" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white">
                GKD Mobility
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                  App Nativo
                </span>
              </p>
              <p className="text-[11px] text-slate-300">
                Instale no seu celular para usar em tela cheia com ícone oficial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
              Instalar App
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Modal if browser automatic prompt isn't supported */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161618] border border-white/10 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />
            
            <button
              onClick={() => setShowTutorialModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl p-1 shrink-0 shadow-md bg-[#0a0f1d] border border-white/10 overflow-hidden">
                <img src={APP_LOGO_SRC} alt="GKD Mobility Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Instalar GKD Mobility</h3>
                <p className="text-xs text-slate-400">Tenha o aplicativo na tela do seu celular</p>
              </div>
            </div>

            <div className="space-y-3.5 my-5">
              {isIos ? (
                <>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      No navegador Safari, toque no ícone <strong className="text-white inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-blue-400" /> Compartilhar</strong> na barra inferior do iPhone.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Role o menu e selecione <strong className="text-emerald-400 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5" /> Adicionar à Tela de Início</strong>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      No Google Chrome, toque nos <strong className="text-white">3 Pontinhos (⋮)</strong> no canto superior direito.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Toque em <strong className="text-emerald-400">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                </>
              )}

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>O ícone do GKD Mobility ficará disponível como aplicativo nativo e abrirá em tela inteira sem barra de endereço!</span>
              </div>
            </div>

            <button
              onClick={() => setShowTutorialModal(false)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition shadow-md active:scale-95 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
