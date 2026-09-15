import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  FileSpreadsheet,
  GripVertical,
  CalendarDays,
  Receipt,
  PieChart,
  ChevronDown,
  ChevronUp,
  Calculator,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Sliders,
  MessageCircle,
  Bell,
  ShieldCheck,
  CreditCard as CardIcon,
  PlusCircle,
  Grid,
  X,
  CheckCircle2,
  Lock,
  Menu,
  Settings,
  Info,
  Briefcase,
  UserCheck,
  TrendingUp,
  Car,
  ArrowLeft,
  ArrowRight,
  Pin,
  Database,
} from 'lucide-react';
import { ModuleId, CategoryScope, TransactionCategory, TransactionType } from '../types';
import { getIncomeProfile, setIncomeProfile, IncomeProfile } from '../lib/storage';
import { openWhatsApp } from '../utils/whatsapp';
import { AppPresentationModal } from './AppPresentationModal';
import { APP_LOGO_SRC } from '../lib/assets';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewBill: (scope?: CategoryScope) => void;
  onOpenCalculators: () => void;
  onOpenCreditCards?: () => void;
  onOpenNewTransaction?: (scope?: CategoryScope, category?: TransactionCategory, type?: TransactionType) => void;
  onOpenAiAssistant?: () => void;
  onOpenHelp?: () => void;
  onOpenModuleCustomizer?: () => void;
  onOpenNotificationsAuth?: () => void;
  onOpenBackupModal?: () => void;
  onExportData: () => void;
  onExportExcel?: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  pendingBillsCount: number;
  enabledModules?: ModuleId[];
  setEnabledModules?: (modules: ModuleId[]) => void;
  onConsolidateData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewBill,
  onOpenCalculators,
  onOpenCreditCards,
  onOpenNewTransaction,
  onOpenAiAssistant,
  onOpenHelp,
  onOpenModuleCustomizer,
  onOpenNotificationsAuth,
  onOpenBackupModal,
  onExportData,
  onExportExcel,
  onImportData,
  onResetData,
  pendingBillsCount,
  enabledModules = ['contas', 'entradas', 'resumo', 'relatorios'],
  setEnabledModules,
  onConsolidateData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);
  const [isGearModalOpen, setIsGearModalOpen] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [incomeProfile, setIncomeProfileState] = useState<IncomeProfile>(getIncomeProfile);

  useEffect(() => {
    if (isGearModalOpen) {
      setIncomeProfileState(getIncomeProfile());
    }
  }, [isGearModalOpen]);

  const handleSelectIncomeProfile = (profile: IncomeProfile) => {
    setIncomeProfileState(profile);
    setIncomeProfile(profile);
    window.dispatchEvent(new Event('incomeProfileChanged'));
  };

  const allMenuItems = [
    {
      id: 'contas',
      label: 'Contas',
      icon: CalendarDays,
      desc: 'Contas a pagar, vencimentos e pendências',
      badge: pendingBillsCount > 0 ? pendingBillsCount : null,
    },
    {
      id: 'entradas',
      label: 'Entradas',
      icon: TrendingUp,
      desc: 'Lançamento e consulta de entradas e receitas',
    },
    {
      id: 'resumo',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      desc: 'Indicadores principais, gráficos e saldos',
    },
    {
      id: 'relatorios',
      label: 'Relatórios & Orçamentos',
      icon: PieChart,
      desc: 'Metas por categoria e análise financeira',
    },
  ];

  // Filter and order menu items by enabledModules order
  const menuItems = enabledModules
    .map((id) => allMenuItems.find((item) => item.id === id))
    .filter((item): item is typeof allMenuItems[0] => Boolean(item));

  const currentItem = menuItems.find((item) => item.id === activeTab) || menuItems[0];

  const [touchDraggingId, setTouchDraggingId] = useState<ModuleId | null>(null);
  const [touchOverId, setTouchOverId] = useState<ModuleId | null>(null);

  const handleTouchStart = (id: ModuleId) => {
    setTouchDraggingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDraggingId) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const buttonEl = targetElement?.closest('[data-module-id]');
    if (buttonEl) {
      const overId = buttonEl.getAttribute('data-module-id') as ModuleId;
      if (overId && overId !== touchOverId) {
        setTouchOverId(overId);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDraggingId && touchOverId && touchDraggingId !== touchOverId) {
      const currentModules = [...enabledModules];
      const fromIndex = currentModules.indexOf(touchDraggingId);
      const toIndex = currentModules.indexOf(touchOverId);
      if (fromIndex !== -1 && toIndex !== -1) {
        currentModules.splice(fromIndex, 1);
        currentModules.splice(toIndex, 0, touchDraggingId);
        if (setEnabledModules) {
          setEnabledModules(currentModules);
        }
      }
    }
    setTouchDraggingId(null);
    setTouchOverId(null);
  };

  const [selectedModuleOptions, setSelectedModuleOptions] = useState<ModuleId | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const startPress = (id: ModuleId) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setSelectedModuleOptions(id);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <header className="bg-[#161618] text-white border-b border-white/5 z-30 shadow-md safe-top">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 space-y-2.5">
        {/* Top Header Bar: Logo, Title & Utility Gear */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none self-start sm:self-auto group"
            onClick={() => {
              setIsPresentationModalOpen(true);
            }}
            title="Apresentação do Aplicativo GKD Mobility"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsPresentationModalOpen(true);
              }
            }}
          >
            <div className="w-11 h-11 rounded-2xl p-0.5 flex items-center justify-center shadow-lg border border-white/10 transition-transform group-hover:scale-105 group-active:scale-95 overflow-hidden bg-[#0a0f1d]">
              <img
                src={APP_LOGO_SRC}
                alt="GKD Mobility Logo"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-2">
                GKD MOBILITY
              </h1>
              <p className="text-[11px] text-white/50 font-medium">Controle Financeiro & Mobilidade</p>
            </div>
          </div>

          {/* Clean Top Action Group */}
          <div className="flex items-center gap-2">
            {/* Gear Button for Help, Settings & Tools */}
            <button
              onClick={() => setIsGearModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl transition border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
              title="Configurações, Backup e Ferramentas"
            >
              <Settings className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline">Configurações & Ajuda</span>
            </button>
          </div>
        </div>



        {/* Navigation Tabs - Desktop / Tablet View */}
        <nav className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-t border-white/5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            const isTouchDragging = touchDraggingId === item.id;
            const isTouchOver = touchOverId === item.id;
            return (
              <button
                key={item.id}
                data-module-id={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain') as ModuleId;
                  if (!draggedId || draggedId === item.id) return;
                  const currentModules = [...enabledModules];
                  const fromIndex = currentModules.indexOf(draggedId);
                  const toIndex = currentModules.indexOf(item.id as ModuleId);
                  if (fromIndex !== -1 && toIndex !== -1) {
                    currentModules.splice(fromIndex, 1);
                    currentModules.splice(toIndex, 0, draggedId);
                    if (setEnabledModules) {
                      setEnabledModules(currentModules);
                    }
                  }
                }}
                onMouseDown={() => startPress(item.id as ModuleId)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={() => {
                  startPress(item.id as ModuleId);
                  handleTouchStart(item.id as ModuleId);
                }}
                onTouchMove={(e) => {
                  cancelPress();
                  handleTouchMove(e);
                }}
                onTouchEnd={() => {
                  cancelPress();
                  handleTouchEnd();
                }}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition text-center cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-white shadow-md'
                    : 'hover:bg-white/5 text-slate-300'
                } ${isTouchDragging ? 'opacity-50 scale-95 ring-2 ring-emerald-500' : ''} ${
                  isTouchOver ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : ''
                }`}
                title="Segure e arraste para reorganizar (como no celular)"
              >
                <div className="absolute top-1 right-1 text-slate-500 opacity-60">
                  <GripVertical className="w-3 h-3" />
                </div>
                <Icon className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold truncate w-full">{item.label.split(' /')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Full Feature & Help Central Overlay Modal */}
      {isFullMenuOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-[#161618] border border-amber-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden text-white">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Central de Funções & Ajudas do Sistema</h3>
                  <p className="text-xs text-amber-300/80">Acesso direto a todos os recursos, ferramentas e suporte</p>
                </div>
              </div>
              <button
                onClick={() => setIsFullMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Grid of all features */}
            <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar">
              {/* Section 1: Navigation & Views */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Módulos Principais do Aplicativo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('resumo');
                      setIsFullMenuOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      activeTab === 'resumo'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-900/80 border-white/10 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Visão Geral</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Dashboard, indicadores e resumo executivo.</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('contas');
                      setIsFullMenuOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      activeTab === 'contas'
                        ? 'bg-rose-500/20 border-rose-500 text-white'
                        : 'bg-slate-900/80 border-white/10 hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                        <CalendarDays className="w-4 h-4" />
                        <span>Contas & Vencimentos</span>
                      </div>
                      {pendingBillsCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {pendingBillsCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">Contas a pagar, pagas e calendário de vencimentos.</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('relatorios');
                      setIsFullMenuOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      activeTab === 'relatorios'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-slate-900/80 border-white/10 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                      <PieChart className="w-4 h-4" />
                      <span>Relatórios & Orçamentos</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Metas por categoria, análises e relatórios.</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Quick Operations */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Operações & Lançamentos Rápidos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      onOpenNewBill();
                      setIsFullMenuOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
                      <CalendarDays className="w-4 h-4" />
                      <span>Nova Conta a Pagar</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Cadastre boletos, contas recorrentes ou pagamentos.</span>
                  </button>

                  {onOpenNewTransaction && (
                    <>
                      <button
                        onClick={() => {
                          onOpenNewTransaction('geral', 'Salário/Renda', 'receita');
                          setIsFullMenuOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                          <PlusCircle className="w-4 h-4" />
                          <span>Lançar Receita</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Adicione salário, rendimentos ou ganhos.</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenNewTransaction('geral', 'Outros', 'despesa');
                          setIsFullMenuOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-rose-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                          <Receipt className="w-4 h-4" />
                          <span>Lançar Despesa</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Registre compras do dia a dia ou gastos avulsos.</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: AI & Tools */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Inteligência Artificial & Ferramentas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {onOpenAiAssistant && (
                    <button
                      onClick={() => {
                        onOpenAiAssistant();
                        setIsFullMenuOpen(false);
                      }}
                      className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Assistente IA (Voz & Texto)</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Lançamentos inteligentes ditando por voz ou digitando.</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenCalculators();
                      setIsFullMenuOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-amber-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span>Calculadoras Financeiras</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Autonomia de combustível, viagem e reserva emergencial.</span>
                  </button>

                  {onOpenCreditCards && (
                    <button
                      onClick={() => {
                        onOpenCreditCards();
                        setIsFullMenuOpen(false);
                      }}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-purple-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                        <CardIcon className="w-4 h-4 text-purple-400" />
                        <span>Gerenciar Cartões</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Configure faturas, limites e melhor dia para compra.</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 4: Customization & Notifications */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Personalização & Permissões
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {onOpenModuleCustomizer && (
                    <button
                      onClick={() => {
                        onOpenModuleCustomizer();
                        setIsFullMenuOpen(false);
                      }}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        <span>Personalizar & Reordenar Módulos</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Ative/desative módulos e reordene do seu jeito.</span>
                    </button>
                  )}

                  {onOpenNotificationsAuth && (
                    <button
                      onClick={() => {
                        onOpenNotificationsAuth();
                        setIsFullMenuOpen(false);
                      }}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-blue-500/40 text-left transition flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-blue-300">
                        <Bell className="w-4 h-4 text-blue-400" />
                        <span>Notificações & Permissões</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Ajuste melodia de alertas, push do navegador e permissões.</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 5: Data Backup & Excel */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Dados, Exportação & Backup
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {onExportExcel && (
                    <button
                      onClick={() => {
                        onExportExcel();
                        setIsFullMenuOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onOpenBackupModal) {
                        onOpenBackupModal();
                      } else {
                        onExportData();
                      }
                      setIsFullMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-white/10 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Backup JSON</span>
                  </button>

                  <label
                    className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-white/10 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Importar Backup</span>
                    <input
                      type="file"
                      onChange={(e) => {
                        onImportData(e);
                        setIsFullMenuOpen(false);
                      }}
                      accept=".json,application/json,text/plain,text/*,*/*"
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      onResetData();
                      setIsFullMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 hover:bg-rose-900/40 text-rose-300 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Resetar Dados</span>
                  </button>
                </div>
              </div>

              {/* Section 6: Help & Support */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Suporte & Central de Ajuda
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullMenuOpen(false);
                      openWhatsApp();
                    }}
                    className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Fale Conosco no WhatsApp</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">(11) 95329-2570 - Envie sugestões e suporte</div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  </button>

                  {onOpenHelp && (
                    <button
                      onClick={() => {
                        onOpenHelp();
                        setIsFullMenuOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Manual & Central de Ajuda</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Tutoriais, dicas financeiras e dúvidas frequentes</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">GKD Controle Financeiro</span>
              <button
                type="button"
                onClick={() => setIsFullMenuOpen(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg cursor-pointer"
              >
                Fechar Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engrenagem de Ajuda, Opções & Explicações dos Botões */}
      {isGearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#1A1D24] border border-amber-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Settings className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                    Engrenagem de Ferramentas & Ajuda
                  </h3>
                  <p className="text-xs text-slate-400">Guia e acesso rápido às funções do sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGearModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - List of Tools & Explanations */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Seletor de Regime de Entradas e Receitas (CLT vs MEU) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <span>Regime de Entradas e Receitas</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    incomeProfile === 'clt' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {incomeProfile === 'clt' ? 'Modo CLT Ativo' : 'Modo MEU (MEI / Flexível) Ativo'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Defina o comportamento das suas receitas no sistema:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Botão CLT */}
                  <button
                    type="button"
                    onClick={() => handleSelectIncomeProfile('clt')}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                      incomeProfile === 'clt'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className={`w-4 h-4 ${incomeProfile === 'clt' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        CLT
                      </span>
                      {incomeProfile === 'clt' && (
                        <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md uppercase">
                          SELECIONADO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-300 leading-relaxed">
                      Permite cadastrar e adicionar **múltiplas rendas** (vários salários, pensão alimentícia, vale refeição, 13º e rendas fixas).
                    </span>
                  </button>

                  {/* Botão MEU */}
                  <button
                    type="button"
                    onClick={() => handleSelectIncomeProfile('mei')}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                      incomeProfile === 'mei'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg ring-2 ring-amber-500/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black flex items-center gap-1.5 text-amber-300">
                        <UserCheck className={`w-4 h-4 ${incomeProfile === 'mei' ? 'text-amber-400' : 'text-slate-500'}`} />
                        MEU (MEI / Flexível)
                      </span>
                      {incomeProfile === 'mei' && (
                        <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md uppercase">
                          SELECIONADO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-300 leading-relaxed">
                      Entradas variáveis/flexíveis. Permite **deixar a receita em branco / zerada** ou registrar pagamentos avulsos conforme ocorrem.
                    </span>
                  </button>
                </div>
              </div>

              {/* Seção de Financiamentos & Veículos (Ônix, 208, D1) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>Financiamentos & Veículos (Ônix • 208 • D1)</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Gestão Automotiva
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Lançamento e controle de parcelas de financiamento, seguro, manutenção e receitas dos seus veículos:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGearModalOpen(false);
                      setActiveTab('contas');
                      if (onOpenNewBill) onOpenNewBill('pagamentos');
                    }}
                    className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      Financiamento
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">Lançar parcela em Contas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGearModalOpen(false);
                      if (onOpenNewTransaction) onOpenNewTransaction('carro', 'Manutenção Carro', 'despesa');
                    }}
                    className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-rose-400" />
                      Despesa Veículo
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">Manutenção / Seguro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGearModalOpen(false);
                      if (onOpenNewTransaction) onOpenNewTransaction('geral', 'Salário/Renda', 'receita');
                    }}
                    className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Entradas Veículos
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">Ônix, 208 ou D1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGearModalOpen(false);
                      setActiveTab('contas');
                    }}
                    className="p-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-200 text-left transition flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                      Ver em Contas
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">Lista de parcelas</span>
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Para manter a tela principal mais limpa e organizada, os botões secundários foram centralizados abaixo:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Assistente IA */}
                {onOpenAiAssistant && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-cyan-500/30 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Ajuda da IA (Flutuante & Configurações)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Interaja por comando de voz ou digitação para lançar despesas, tirar dúvidas e analisar relatórios. Disponível no botão flutuante e aqui.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGearModalOpen(false);
                        onOpenAiAssistant();
                      }}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl border border-cyan-500/40 w-fit cursor-pointer transition shadow-md flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Abrir Ajuda da IA</span>
                    </button>
                  </div>
                )}

                {/* Meus Cartões */}
                {onOpenCreditCards && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-purple-500/20 hover:border-purple-500/40 transition flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                        <CardIcon className="w-4 h-4 text-purple-400" />
                        <span>Meus Cartões</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Gerencie cartões de crédito, limites disponíveis e acompanhe faturas com fecho automático.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGearModalOpen(false);
                        onOpenCreditCards();
                      }}
                      className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold rounded-xl border border-purple-500/40 w-fit cursor-pointer transition"
                    >
                      Abrir Cartões
                    </button>
                  </div>
                )}

                {/* Personalizar Módulos */}
                {onOpenModuleCustomizer && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-500/20 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        <span>Personalizar Módulos</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Ative, desative ou reordene as seções da sua tela inicial conforme sua necessidade de uso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGearModalOpen(false);
                        onOpenModuleCustomizer();
                      }}
                      className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-semibold rounded-xl border border-emerald-500/40 w-fit cursor-pointer transition"
                    >
                      Personalizar
                    </button>
                  </div>
                )}

                {/* Notificações e Permissões */}
                {onOpenNotificationsAuth && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-blue-500/20 hover:border-blue-500/40 transition flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                        <Bell className="w-4 h-4 text-blue-400" />
                        <span>Notificações & Permissões</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Verifique autorizações de notificações do navegador, alertas sonoros e avisos de contas a vencer.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGearModalOpen(false);
                        onOpenNotificationsAuth();
                      }}
                      className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-semibold rounded-xl border border-blue-500/40 w-fit cursor-pointer transition"
                    >
                      Abrir Notificações
                    </button>
                  </div>
                )}

                {/* Calculadoras Financeiras */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-700 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      <span>Calculadoras Financeiras</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ferramentas para simular juros compostos, metas financeiras e planejamento de reserva de emergência.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGearModalOpen(false);
                      onOpenCalculators();
                    }}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-semibold rounded-xl border border-emerald-500/40 w-fit cursor-pointer transition"
                  >
                    Abrir Calculadoras
                  </button>
                </div>

                {/* Armazenamento 100% Local & Privacidade */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-700 hover:border-white/30 transition flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Armazenamento & Privacidade</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Seus dados ficam 100% gravados localmente no seu dispositivo com total privacidade e velocidade instantânea offline.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-white/50">
                      Modo: <strong className="text-emerald-400">100% Local & Offline</strong>
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      Ativo
                    </span>
                  </div>
                </div>

                {/* Importar / Exportar Dados */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-700 hover:border-white/30 transition flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Backup, Importar e Exportar Dados</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Exporte todos os seus dados em formato JSON ou planilha Excel, ou restaure um arquivo de backup previamente salvo.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenBackupModal) {
                          setIsGearModalOpen(false);
                          onOpenBackupModal();
                        } else {
                          onExportData();
                        }
                      }}
                      className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[11px] font-bold rounded-lg border border-blue-500/30 cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar JSON
                    </button>

                    <label
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Importar Backup
                      <input
                        type="file"
                        onChange={(e) => {
                          onImportData(e);
                          setIsGearModalOpen(false);
                        }}
                        accept=".json,application/json,text/plain,text/*,*/*"
                        className="hidden"
                      />
                    </label>

                    {onExportExcel && (
                      <button
                        type="button"
                        onClick={() => {
                          onExportExcel();
                        }}
                        className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-500/30 cursor-pointer flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Excel (.xlsx)
                      </button>
                    )}

                    {onOpenBackupModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGearModalOpen(false);
                          onOpenBackupModal();
                        }}
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold rounded-lg border border-white/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <Database className="w-3.5 h-3.5 text-purple-400" />
                        Central Completa
                      </button>
                    )}
                  </div>
                </div>

                {/* Fale Conosco WhatsApp */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Fale Conosco (WhatsApp)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Envie sugestões ou tire dúvidas pelo número (11) 95329-2570 com o nome do app automático.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGearModalOpen(false);
                      openWhatsApp();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl w-fit cursor-pointer transition shadow-md"
                  >
                    Enviar Mensagem
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between rounded-b-3xl">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Salvamento Automático Ativo</span>
              </div>
              <button
                type="button"
                onClick={() => setIsGearModalOpen(false)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Contextual do Módulo (Long Press) */}
      {selectedModuleOptions && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedModuleOptions(null)}
        >
          <div 
            className="bg-[#161618] border border-white/10 rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                Opções da Guia
              </h3>
              <button onClick={() => setSelectedModuleOptions(null)} className="p-2 -mr-2 text-white/40 hover:text-white transition rounded-lg hover:bg-white/5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              Reorganize a guia <strong className="text-white">{allMenuItems.find(i => i.id === selectedModuleOptions)?.label}</strong> na sua barra de navegação.
            </p>

            <div className="space-y-2 flex flex-col">
              <button
                onClick={() => {
                  if (!setEnabledModules) return;
                  const currentModules = [...enabledModules];
                  const idx = currentModules.indexOf(selectedModuleOptions);
                  if (idx > 0) {
                    const temp = currentModules[idx];
                    currentModules[idx] = currentModules[idx - 1];
                    currentModules[idx - 1] = temp;
                    setEnabledModules(currentModules);
                  }
                  setSelectedModuleOptions(null);
                }}
                disabled={enabledModules.indexOf(selectedModuleOptions) === 0}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 text-white/80 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Mover para Esquerda</span>
              </button>

              <button
                onClick={() => {
                  if (!setEnabledModules) return;
                  const currentModules = [...enabledModules];
                  const idx = currentModules.indexOf(selectedModuleOptions);
                  if (idx !== -1 && idx < currentModules.length - 1) {
                    const temp = currentModules[idx];
                    currentModules[idx] = currentModules[idx + 1];
                    currentModules[idx + 1] = temp;
                    setEnabledModules(currentModules);
                  }
                  setSelectedModuleOptions(null);
                }}
                disabled={enabledModules.indexOf(selectedModuleOptions) === enabledModules.length - 1}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 text-white/80 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs font-semibold">Mover para Direita</span>
              </button>

              <button
                onClick={() => {
                  if (!setEnabledModules) return;
                  const currentModules = [...enabledModules];
                  const idx = currentModules.indexOf(selectedModuleOptions);
                  if (idx > 0) {
                    currentModules.splice(idx, 1);
                    currentModules.unshift(selectedModuleOptions);
                    setEnabledModules(currentModules);
                  }
                  setSelectedModuleOptions(null);
                }}
                disabled={enabledModules.indexOf(selectedModuleOptions) === 0}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300 text-white/80 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Pin className="w-4 h-4" />
                <span className="text-xs font-semibold">Fixar no Início</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* App Presentation Modal */}
      <AppPresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
        onNavigateTab={setActiveTab}
        onOpenHelp={onOpenHelp}
      />
    </header>
  );
};

