import React, { useState } from 'react';
import {
  CalendarDays,
  TrendingUp,
  LayoutDashboard,
  PieChart,
  Plus,
  X,
  FilePlus2,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Calculator,
  CreditCard,
  Database,
} from 'lucide-react';
import { CategoryScope, TransactionCategory, TransactionType } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingBillsCount: number;
  onOpenNewBill: () => void;
  onOpenNewTransaction: (scope?: CategoryScope, category?: TransactionCategory, type?: TransactionType) => void;
  onOpenAiAssistant?: () => void;
  onOpenCalculators?: () => void;
  onOpenCreditCards?: () => void;
  onOpenBackupModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingBillsCount,
  onOpenNewBill,
  onOpenNewTransaction,
  onOpenAiAssistant,
  onOpenCalculators,
  onOpenCreditCards,
  onOpenBackupModal,
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(12);
    }
    setActiveTab(tabId);
  };

  const navItems = [
    {
      id: 'contas',
      label: 'Contas',
      icon: CalendarDays,
      badge: pendingBillsCount > 0 ? pendingBillsCount : null,
    },
    {
      id: 'entradas',
      label: 'Entradas',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'resumo',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: PieChart,
      badge: null,
    },
  ];

  return (
    <>
      {/* Quick Action Sheet / Native Bottom Sheet */}
      {isActionSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setIsActionSheetOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-[#161618] border-t border-white/10 rounded-t-3xl p-5 space-y-4 shadow-2xl z-10 pb-[max(env(safe-area-inset-bottom),24px)] animate-in slide-in-from-bottom duration-200">
            {/* Header / Grabber */}
            <div className="flex flex-col items-center justify-center gap-1.5 pb-2 border-b border-white/5">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
              <div className="w-full flex items-center justify-between mt-1">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Ações Rápidas do App</span>
                </span>
                <button
                  onClick={() => setIsActionSheetOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Launch Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenNewBill();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-left transition active:scale-95"
              >
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Nova Conta</h4>
                  <p className="text-[10px] text-rose-300/80">Boleto / Despesa</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenNewTransaction('empresa', 'Salário/Renda', 'receita');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-left transition active:scale-95"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Nova Entrada</h4>
                  <p className="text-[10px] text-emerald-300/80">Receita / Ganho</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenNewTransaction('geral', 'Outros', 'despesa');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-left transition active:scale-95"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Lançar Gasto</h4>
                  <p className="text-[10px] text-amber-300/80">Extrato rápido</p>
                </div>
              </button>

              {onOpenAiAssistant && (
                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenAiAssistant();
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-left transition active:scale-95"
                >
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Assistente IA</h4>
                    <p className="text-[10px] text-cyan-300/80">Voz / Recibo / Chat</p>
                  </div>
                </button>
              )}

              {onOpenCalculators && (
                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenCalculators();
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-left transition active:scale-95"
                >
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Calculadoras</h4>
                    <p className="text-[10px] text-purple-300/80">Meta / Combustível</p>
                  </div>
                </button>
              )}

              {onOpenCreditCards && (
                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenCreditCards();
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-left transition active:scale-95"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Cartões</h4>
                    <p className="text-[10px] text-indigo-300/80">Limites & Faturas</p>
                  </div>
                </button>
              )}

              {onOpenBackupModal && (
                <button
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    onOpenBackupModal();
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-left transition active:scale-95"
                >
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Backup & Dados</h4>
                    <p className="text-[10px] text-blue-300/80">Exportar 100% dos Dados</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Native Bottom Bar for Mobile Ergonomics */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121214]/95 backdrop-blur-md border-t border-white/10 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),10px)] transition-all">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Left items: Contas & Entradas */}
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-95 ${
                  isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5px] scale-110' : ''} transition-transform`} />
                  {item.badge !== null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-[#121214]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
                {isSelected && (
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}

          {/* Center Floating Action Button (+) */}
          <button
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(18);
              }
              setIsActionSheetOpen(true);
            }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border-2 border-[#121214] -mt-5 active:scale-90 transition-transform cursor-pointer"
            title="Adicionar ou Ações Rápidas"
          >
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>

          {/* Right items: Visão Geral & Relatórios */}
          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id || (item.id === 'resumo' && activeTab === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-95 ${
                  isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5px] scale-110' : ''} transition-transform`} />
                </div>
                <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
                {isSelected && (
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
