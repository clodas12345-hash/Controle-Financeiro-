import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  Bell,
  Check,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Music,
} from 'lucide-react';
import { Bill, Transaction } from '../types';
import { formatBRL, formatDateBR, getTodayStr } from '../lib/storage';

interface DueBillsAlertModalProps {
  bills: Bill[];
  transactions?: Transaction[];
  onPayBill: (billId: string) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
}

const SUPPRESS_KEY = 'fin_control_suppress_due_alert_date';
const SOUND_PREF_KEY = 'fin_control_preferred_sound';
const SOUND_ENABLED_KEY = 'fin_control_sound_enabled';

export type SoundOptionKey = 'chime' | 'crystal' | 'marimba' | 'modern';

export const SOUND_OPTIONS: { id: SoundOptionKey; label: string; description: string }[] = [
  { id: 'modern', label: 'Opção 4 - Duplo Ding-Dong (Selecionado)', description: 'Notificação moderna de duas notas harmônicas' },
  { id: 'chime', label: 'Opção 1 - Chime Suave', description: 'Acorde suave de 4 notas em ascendência' },
  { id: 'crystal', label: 'Opção 2 - Sino de Cristal', description: 'Tom límpido e brilhante tipo taça de cristal' },
  { id: 'marimba', label: 'Opção 3 - Marimba Quente', description: 'Notas aconchegantes em timbre de madeira' },
];

export const playNotificationSound = (type: SoundOptionKey = 'modern') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === 'chime') {
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'crystal') {
      const freqs = [880, 1108.73, 1318.51, 1760];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.65);
      });
    } else if (type === 'marimba') {
      const freqs = [329.63, 440, 554.37, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } else if (type === 'modern') {
      const freqs = [587.33, 880];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.55);
      });
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
};

export const DueBillsAlertModal: React.FC<DueBillsAlertModalProps> = ({
  bills = [],
  transactions = [],
  onPayBill,
  onUpdateTransaction,
}) => {
  const todayStr = getTodayStr();

  // Filter unpaid bills due today or overdue
  const dueBills = bills.filter(
    (b) => (b.status === 'pendente' || b.status === 'atrasado') && b.dueDate <= todayStr && b.paymentMethod !== 'SEM PAGAMENTO'
  );

  // Filter unpaid transactions due today or overdue
  const dueTransactions = transactions.filter(
    (t) => t.type === 'despesa' && !t.paid && t.date <= todayStr && !t.id.startsWith('tx_auto_bill_')
  );

  const totalDueItems = dueBills.length + dueTransactions.length;

  const [isOpen, setIsOpen] = useState(false);
  const [suppressToday, setSuppressToday] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundOptionKey>('modern');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  useEffect(() => {
    // Load sound settings from localStorage
    let currentSound: SoundOptionKey = 'modern';
    const savedSound = localStorage.getItem(SOUND_PREF_KEY) as SoundOptionKey;
    if (savedSound && SOUND_OPTIONS.some((opt) => opt.id === savedSound)) {
      currentSound = savedSound;
      setSelectedSound(savedSound);
    } else {
      localStorage.setItem(SOUND_PREF_KEY, 'modern');
    }

    let isAudioOn = true;
    const savedEnabled = localStorage.getItem(SOUND_ENABLED_KEY);
    if (savedEnabled !== null) {
      isAudioOn = savedEnabled === 'true';
      setSoundEnabled(isAudioOn);
    }

    // Check if user checked "Não lembrar mais hoje"
    const savedSuppressDate = localStorage.getItem(SUPPRESS_KEY);
    const isSuppressed = savedSuppressDate === todayStr;
    setSuppressToday(isSuppressed);

    // If not suppressed and there are items due today/overdue, open modal automatically on launch
    if (!isSuppressed && totalDueItems > 0) {
      setIsOpen(true);
      if (isAudioOn) {
        setTimeout(() => {
          playNotificationSound(currentSound);
        }, 300);
      }
    }
  }, [todayStr, totalDueItems]);

  const handleSelectSound = (soundKey: SoundOptionKey) => {
    setSelectedSound(soundKey);
    localStorage.setItem(SOUND_PREF_KEY, soundKey);
    playNotificationSound(soundKey);
  };

  const handleToggleSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    if (enabled) {
      playNotificationSound(selectedSound);
    }
  };

  const handleToggleSuppress = (checked: boolean) => {
    setSuppressToday(checked);
    if (checked) {
      localStorage.setItem(SUPPRESS_KEY, todayStr);
    } else {
      localStorage.removeItem(SUPPRESS_KEY);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || totalDueItems === 0) return null;

  const totalAmountDue =
    dueBills.reduce((sum, b) => sum + b.amount, 0) +
    dueTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#161618] border border-amber-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(245,158,11,0.25)] relative overflow-hidden animate-scaleUp">
        {/* Glow Header Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 w-full" />

        {/* Modal Top Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-white flex items-center gap-2">
                Contas Vencendo Hoje!
              </h3>
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                Você possui <strong className="text-amber-300 font-extrabold">{totalDueItems}</strong> conta(s) pendente(s) com vencimento para hoje ou atrasada(s).
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Banner & Test Bar */}
        <div className="px-5 py-3 bg-slate-900 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-medium">
              Sinal Sonoro de Alerta:
            </span>
            <button
              onClick={() => handleToggleSoundEnabled(!soundEnabled)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {soundEnabled ? 'Ativado' : 'Mudo'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playNotificationSound(selectedSound)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Testar som do alerta"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ouvir Som</span>
            </button>

            <button
              onClick={() => setShowSoundSettings(!showSoundSettings)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Opções de Som</span>
            </button>
          </div>
        </div>

        {/* Sound Selection Options Drawer */}
        {showSoundSettings && (
          <div className="p-4 bg-slate-900/95 border-b border-amber-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                Escolha o Tom da Notificação:
              </h4>
              <p className="text-[10px] text-slate-400">
                O som é tocado instantaneamente ao clicar
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOUND_OPTIONS.map((opt) => {
                const isSelected = selectedSound === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectSound(opt.id)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {opt.description}
                      </p>
                    </div>

                    <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Total Summary Banner */}
        <div className="px-5 py-3 bg-rose-950/20 border-b border-rose-500/20 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Total a Liquidar:
          </span>
          <span className="text-base font-extrabold text-rose-400">
            {formatBRL(totalAmountDue)}
          </span>
        </div>

        {/* List of Due Items */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {dueBills.map((b) => {
            const isToday = b.dueDate === todayStr;
            return (
              <div
                key={b.id}
                className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400/50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-white">{b.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {b.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${
                        isToday
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isToday ? 'Vence Hoje' : 'Atrasada'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Vencimento: <strong className="text-slate-200">{formatDateBR(b.dueDate)}</strong></span>
                    {b.recipient && <span>• {b.recipient}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                  <span className="text-sm font-extrabold text-amber-400">
                    {formatBRL(b.amount)}
                  </span>
                  <button
                    onClick={() => onPayBill(b.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>Marcar como Pago</span>
                  </button>
                </div>
              </div>
            );
          })}

          {dueTransactions.map((t) => {
            const isToday = t.date === todayStr;
            return (
              <div
                key={t.id}
                className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400/50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-white">{t.description}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      {t.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${
                        isToday
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isToday ? 'Vence Hoje' : 'Atrasada'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Lançamento Diário • Data: <strong className="text-slate-200">{formatDateBR(t.date)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                  <span className="text-sm font-extrabold text-amber-400">
                    {formatBRL(t.amount)}
                  </span>
                  {onUpdateTransaction && (
                    <button
                      onClick={() =>
                        onUpdateTransaction({
                          ...t,
                          paid: true,
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      <span>Marcar como Pago</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls: Checkbox & OK Button */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold cursor-pointer select-none hover:text-white transition">
            <input
              type="checkbox"
              checked={suppressToday}
              onChange={(e) => handleToggleSuppress(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500/40 cursor-pointer"
            />
            <span>Não me lembrar mais hoje</span>
          </label>

          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer self-end sm:self-auto"
          >
            OK / Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

