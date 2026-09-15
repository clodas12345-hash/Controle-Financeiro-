import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sliders, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Home, 
  Car, 
  CalendarDays, 
  PieChart, 
  Sparkles,
  Info,
  GripVertical,
  ArrowUp,
  ArrowDown,
  TrendingUp
} from 'lucide-react';
import { ModuleId, ModuleSetting } from '../types';

interface ModuleCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledModules: ModuleId[];
  setEnabledModules: React.Dispatch<React.SetStateAction<ModuleId[]>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ALL_AVAILABLE_MODULES: {
  id: ModuleId;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  isRequired?: boolean;
}[] = [
  {
    id: 'resumo',
    label: 'Visão Geral / Resumo',
    description: 'Indicadores principais, gráficos e saldos financeiros.',
    icon: LayoutDashboard,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    isRequired: true,
  },
  {
    id: 'contas',
    label: 'Contas & Faturas',
    description: 'Contas a pagar, calendário de vencimentos e pendências.',
    icon: CalendarDays,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 'entradas',
    label: 'Entradas',
    description: 'Acompanhamento e lançamento de receitas e entradas.',
    icon: TrendingUp,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'relatorios',
    label: 'Relatórios & Orçamentos',
    description: 'Metas por categoria, análises e relatórios consolidados.',
    icon: PieChart,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
];

export const ModuleCustomizerModal: React.FC<ModuleCustomizerModalProps> = ({
  isOpen,
  onClose,
  enabledModules,
  setEnabledModules,
  activeTab,
  setActiveTab,
}) => {
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(enabledModules);
  const [orderedModules, setOrderedModules] = useState<ModuleId[]>(() => {
    const active = enabledModules || [];
    const rest = ALL_AVAILABLE_MODULES.map(m => m.id).filter(id => !active.includes(id));
    return [...active, ...rest];
  });
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleToggle = (id: ModuleId, isRequired?: boolean) => {
    if (isRequired) return; // 'resumo' cannot be disabled

    if (selectedModules.includes(id)) {
      if (selectedModules.length <= 1) return;
      setSelectedModules(prev => prev.filter(m => m !== id));
    } else {
      setSelectedModules(prev => [...prev, id]);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const updated = [...orderedModules];
    const [movedItem] = updated.splice(draggedItemIndex, 1);
    updated.splice(index, 0, movedItem);
    setDraggedItemIndex(index);
    setOrderedModules(updated);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedModules.length) return;
    const updated = [...orderedModules];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    setOrderedModules(updated);
  };

  const handleSave = () => {
    const finalOrderedSelected = orderedModules.filter(id => selectedModules.includes(id));
    if (!finalOrderedSelected.includes('resumo')) {
      finalOrderedSelected.unshift('resumo');
    }
    setEnabledModules(finalOrderedSelected);

    if (!finalOrderedSelected.includes(activeTab as ModuleId)) {
      setActiveTab('resumo');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#161618] border border-white/10 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                Personalizar & Reorganizar Módulos
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique e arraste pelo ícone de alça, ou use as setas para ordenar do seu jeito.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tip Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Organização personalizada:</strong> Arraste os módulos para cima ou para baixo para definir a ordem de exibição no seu menu principal.
          </p>
        </div>

        {/* Modules List with Drag & Drop */}
        <div className="space-y-2.5">
          {orderedModules.map((id, index) => {
            const mod = ALL_AVAILABLE_MODULES.find(m => m.id === id);
            if (!mod) return null;
            const Icon = mod.icon;
            const isEnabled = selectedModules.includes(mod.id);

            return (
              <div
                key={mod.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isEnabled
                    ? 'bg-[#1A1A1E] border-emerald-500/40 shadow-md'
                    : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                } ${draggedItemIndex === index ? 'opacity-40 border-dashed border-emerald-400' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Drag Handle & Reorder buttons */}
                  <div className="flex items-center gap-1 text-slate-400 cursor-grab active:cursor-grabbing hover:text-white">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === orderedModules.length - 1}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${mod.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{mod.label}</h4>
                      {mod.badge && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {mod.badge}
                        </span>
                      )}
                      {mod.isRequired && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Obrigatório)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div 
                  className="shrink-0 ml-3 cursor-pointer"
                  onClick={() => handleToggle(mod.id, mod.isRequired)}
                >
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    } ${mod.isRequired ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedModules(ALL_AVAILABLE_MODULES.map(m => m.id))}
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Ativar Todos
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Ordem & Módulos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
