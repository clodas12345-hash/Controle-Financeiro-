import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Car,
  Home,
  CreditCard,
  Camera,
  FileSpreadsheet,
  Zap,
  TrendingUp,
  Cpu,
  ChevronRight,
  CheckCircle2,
  Lock,
  Smartphone,
  Layers,
  MessageCircle,
  HelpCircle,
  BarChart3,
  CalendarDays,
  PieChart,
  Maximize2,
  ZoomIn
} from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';
import { APP_LOGO_SRC } from '../lib/assets';

interface AppPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenHelp?: () => void;
}

export const AppPresentationModal: React.FC<AppPresentationModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenHelp,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'features' | 'privacy' | 'tips'>('overview');
  const [isLogoFullscreen, setIsLogoFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLogoFullscreen) {
          setIsLogoFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLogoFullscreen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      icon: CalendarDays,
      color: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
      title: 'Contas & Vencimentos',
      desc: 'Controle de contas a pagar, parceladas ou fixas recorrentes, com alertas de atraso, leitura por código de barras e confirmação rápida de pagamento.',
      tab: 'contas',
    },
    {
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      title: 'Entradas & Receitas',
      desc: 'Lançamentos de salários, rendas fixas, receitas de aplicativos ou diárias de veículos (Ônix, 208, D1) e histórico consolidado.',
      tab: 'entradas',
    },
    {
      icon: BarChart3,
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      title: 'Visão Geral & Dashboard',
      desc: 'Painel executivo com saldo geral, receitas vs despesas, cartões de crédito, tarefas da casa e indicadores de saúde financeira.',
      tab: 'resumo',
    },
    {
      icon: PieChart,
      color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
      title: 'Relatórios & Orçamentos',
      desc: 'Análise detalhada por categoria de despesas, metas orçamentárias mensais e comparativo de despesas x receitas.',
      tab: 'relatorios',
    },
    {
      icon: Car,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      title: 'Gestão de Veículos & Financiamento',
      desc: 'Acompanhamento de custos de manutenção, seguros, parcelas de financiamento e receitas individuais por carro.',
      tab: 'contas',
    },
    {
      icon: FileSpreadsheet,
      color: 'from-emerald-500/20 to-green-500/10 text-emerald-300 border-emerald-500/30',
      title: 'Exportação em Excel (.xlsx)',
      desc: 'Geração de planilhas formatadas completas com todas as abas e dados prontos para análise externa e contabilidade.',
      tab: 'resumo',
    },
  ];

  return (
    <div
      id="app-presentation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header with Visual Banner */}
        <div className="relative bg-gradient-to-br from-emerald-600/30 via-slate-900 to-[#121214] p-6 sm:p-7 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition cursor-pointer"
            aria-label="Fechar apresentação"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLogoFullscreen(true)}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 flex items-center justify-center shadow-xl border border-white/20 shrink-0 bg-[#0a0f1d] overflow-hidden group cursor-pointer transition-all hover:scale-105 active:scale-95 hover:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
              title="Clique para ver o logo em tela cheia"
              aria-label="Abrir logo em tela cheia"
            >
              <img
                src={APP_LOGO_SRC}
                alt="GKD Mobility Logo"
                className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <Maximize2 className="w-5 h-5 text-amber-300 drop-shadow-md" />
              </div>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  GKD MOBILITY
                </h2>
                <button
                  type="button"
                  onClick={() => setIsLogoFullscreen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition cursor-pointer"
                  title="Ver imagem do logo ampliada"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>Ver Logo</span>
                </button>
              </div>
              <p className="text-sm text-slate-300 font-medium mt-1">
                Controle Financeiro, Mobilidade & Gestão Completa
              </p>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex items-center gap-1.5 mt-5 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                activeSection === 'overview'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Visão Geral
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('features')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                activeSection === 'features'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Módulos
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('privacy')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                activeSection === 'privacy'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Local & Seguro
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('tips')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                activeSection === 'tips'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Dicas & Atalhos
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section: Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  O que é o GKD Controle Financeiro?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  O <strong>GKD Controle Financeiro</strong> é uma plataforma moderna e integrada criada para simplificar a vida de motoristas de aplicativo, entregadores, autônomos e famílias que buscam controle total de suas receitas, despesas e manutenções.
                </p>
              </div>

              {/* Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-b from-slate-900 to-slate-900/40 p-3.5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-white">Privacidade Absoluta</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Todos os dados ficam armazenados 100% no seu dispositivo sem acesso externo.
                  </p>
                </div>

                <div className="bg-gradient-to-b from-slate-900 to-slate-900/40 p-3.5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 border border-blue-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-white">Agilidade & IA</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leitor de boletos por câmera e assistente inteligente por texto e áudio.
                  </p>
                </div>

                <div className="bg-gradient-to-b from-slate-900 to-slate-900/40 p-3.5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 border border-amber-500/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-white">App & APK Ready</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Experiência nativa touch, sem recarregamentos acidentais e pronto para APK.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Features */}
          {activeSection === 'features' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/70 border border-white/5 p-4 rounded-2xl hover:border-white/20 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center border shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-white">{feat.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateTab(feat.tab);
                          onClose();
                        }}
                        className="mt-3 text-[11px] text-emerald-400 font-semibold flex items-center gap-1 hover:underline self-start"
                      >
                        Abrir módulo <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Section: Privacy & Security */}
          {activeSection === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-300">Arquitetura 100% Local (Offline-First)</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Diferente de sistemas que exigem cadastro ou enviam suas informações financeiras para a nuvem, o <strong>GKD Controle Financeiro</strong> grava tudo no armazenamento seguro do seu navegador/dispositivo (`localStorage`).
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Zero Risco de Vazamento:</strong> Sem servidores externos armazenando suas senhas, extratos ou contas.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Backups em 1 Clique:</strong> Você pode exportar e restaurar seu backup completo em arquivo JSON a qualquer momento.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Exportação Excel:</strong> Seus dados pertencem a você. Exporte planilhas completas com todos os históricos.</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Tips */}
          {activeSection === 'tips' && (
            <div className="space-y-3">
              <div className="bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl">
                <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5 mb-1">
                  💡 Scanner de Boletos Rápido
                </h4>
                <p className="text-xs text-slate-300">
                  Clique no botão <strong>Câmera</strong> ao cadastrar uma conta para ler automaticamente a data de vencimento, valor, código de barras e chave PIX.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl">
                <h4 className="font-bold text-xs text-blue-300 flex items-center gap-1.5 mb-1">
                  💡 Melhor Dia de Compra do Cartão
                </h4>
                <p className="text-xs text-slate-300">
                  O aplicativo calcula dinamicamente qual dos seus cartões de crédito oferece o maior prazo de pagamento para hoje.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-white/5 p-3.5 rounded-2xl">
                <h4 className="font-bold text-xs text-emerald-300 flex items-center gap-1.5 mb-1">
                  💡 Atalhos na Barra Inferior
                </h4>
                <p className="text-xs text-slate-300">
                  No celular, use os botões rápidos na base da tela para lançar faturamentos, pagar contas ou acionar a IA sem rolar a página.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#161618] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openWhatsApp()}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Suporte</span> WhatsApp
            </button>
            {onOpenHelp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Guia Completo
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md active:scale-95 cursor-pointer"
          >
            Entendido / Continuar
          </button>
        </div>
      </div>

      {/* Fullscreen Logo Lightbox Modal */}
      {isLogoFullscreen && (
        <div
          id="fullscreen-logo-modal"
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setIsLogoFullscreen(false)}
        >
          {/* Top Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  GKD MOBILITY & FINANCE
                </h3>
                <p className="text-[11px] text-white/50">Logo Oficial do Aplicativo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLogoFullscreen(false);
              }}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer active:scale-90 border border-white/10"
              title="Fechar tela cheia"
              aria-label="Fechar tela cheia"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Centered High-Res Logo Image */}
          <div
            className="flex-1 flex items-center justify-center my-auto max-w-lg w-full p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[9/10] max-h-[70vh] flex items-center justify-center rounded-3xl p-3 bg-gradient-to-b from-[#0a0f1d] to-[#04060c] border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.25)] overflow-hidden">
              <img
                src={APP_LOGO_SRC}
                alt="GKD Mobility Logo Fullscreen"
                className="w-full h-full object-contain rounded-2xl drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Bottom Action / Hint */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLogoFullscreen(false);
              }}
              className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Fechar Visualização</span>
            </button>
            <span className="text-[10px] text-white/40">Toque em qualquer lugar fora da imagem para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};
