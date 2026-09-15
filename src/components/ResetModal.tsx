import React, { useState } from 'react';
import { X, Trash2, CheckSquare, Square, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ResetCategorySelection } from '../lib/storage';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (selection: ResetCategorySelection, mode: 'clear' | 'demo') => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirmReset }) => {
  const [selection, setSelection] = useState<ResetCategorySelection>({
    transactions: true,
    bills: true,
    dailyLogs: false,
    vehicles: false,
    homeReadings: false,
    homeTasks: false,
    budgets: true,
  });

  const [mode, setMode] = useState<'clear' | 'demo'>('clear');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    {
      key: 'transactions' as keyof ResetCategorySelection,
      title: '💸 Transações & Lançamentos',
      description: 'Todas as receitas, despesas pessoais e lançamentos financeiros.',
    },
    {
      key: 'bills' as keyof ResetCategorySelection,
      title: '📄 Contas & Faturas a Pagar',
      description: 'Boletos, faturas recorrentes e controle de vencimentos.',
    },
    {
      key: 'budgets' as keyof ResetCategorySelection,
      title: '🎯 Orçamentos Mensais',
      description: 'Limites de gastos alocados por categoria.',
    },
  ];

  const selectedCount = Object.values(selection).filter(Boolean).length;
  const allSelected = selectedCount === categories.length;

  const toggleAll = () => {
    const newValue = !allSelected;
    setSelection({
      transactions: newValue,
      bills: newValue,
      dailyLogs: newValue,
      vehicles: newValue,
      homeReadings: newValue,
      homeTasks: newValue,
      budgets: newValue,
    });
  };

  const toggleCategory = (key: keyof ResetCategorySelection) => {
    setSelection((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirm = () => {
    if (selectedCount === 0) return;
    onConfirmReset(selection, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#18181B] border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Reiniciar de Fábrica</h3>
              <p className="text-xs text-rose-400 font-medium">
                Escolha as caixas de dados que deseja apagar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Action Mode Toggle */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Ação ao reiniciar:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('clear')}
                className={`p-2.5 rounded-xl border text-left transition text-xs font-medium flex items-center gap-2 ${
                  mode === 'clear'
                    ? 'bg-rose-500/20 border-rose-500/50 text-white font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-rose-200 font-bold">Excluir Tudo</div>
                  <div className="text-[10px] text-slate-400">Deixar selecionados zerados</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`p-2.5 rounded-xl border text-left transition text-xs font-medium flex items-center gap-2 ${
                  mode === 'demo'
                    ? 'bg-amber-500/20 border-amber-500/50 text-white font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-amber-200 font-bold">Restaurar Demo</div>
                  <div className="text-[10px] text-slate-400">Voltar dados de exemplo</div>
                </div>
              </button>
            </div>
          </div>

          {/* Select All Toggle Bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-400 font-medium">
              Categorias selecionadas ({selectedCount} de {categories.length}):
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-4 h-4" /> Desmarcar Todos
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" /> Marcar Todos
                </>
              )}
            </button>
          </div>

          {/* Checkbox List */}
          <div className="space-y-2">
            {categories.map((cat) => {
              const isChecked = selection[cat.key];
              return (
                <div
                  key={cat.key}
                  onClick={() => toggleCategory(cat.key)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-rose-950/30 border-rose-500/40 text-white shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="mt-0.5 text-rose-400 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-rose-400 fill-rose-500/20" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100">{cat.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning notice */}
          <div className="p-3 bg-rose-950/40 border border-rose-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="leading-tight text-[11px]">
              {mode === 'clear' ? (
                <>
                  <strong className="text-rose-300">Atenção:</strong> As categorias marcadas acima serão{' '}
                  <span className="text-rose-400 font-bold">permanentemente apagadas</span>.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">Atenção:</strong> As categorias marcadas acima serão{' '}
                  <span className="text-amber-400 font-bold">substituídas pelos dados demonstrativos originais</span>.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleConfirm}
            className={`px-4 py-2.5 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center gap-2 ${
              selectedCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : mode === 'clear'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>
              {mode === 'clear'
                ? `Excluir ${selectedCount} Categoria(s)`
                : `Restaurar ${selectedCount} Categoria(s)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
