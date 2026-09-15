import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  Calculator, 
  CalendarDays, 
  AlertTriangle, 
  FileSpreadsheet, 
  Pencil, 
  CheckCircle2, 
  Car, 
  Home, 
  Info,
  Calendar as CalendarIcon,
  MousePointerClick,
  FileText,
  Dog,
  Sliders,
  Building2,
  MessageCircle,
} from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData?: () => void;
  onExportExcel?: () => void;
  onExportData?: () => void;
  onImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onExportExcel,
  onExportData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'calendar' | 'bills' | 'modules' | 'backup' | 'tools'>('all');

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

  return (
    <div id="help-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div 
        id="help-modal-container"
        className="bg-[#161618] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div id="help-modal-header" className="p-5 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-[#161618] z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <span>Central de Ajuda & Guia de Uso</span>
              </h3>
              <p className="text-xs text-slate-400">Guia passo a passo de todas as funcionalidades e atalhos do sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition self-end sm:self-auto"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-[#161618] border-b border-white/5 sticky top-[77px] z-10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendário Interativo</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bills'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Contas & Observações</span>
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'modules'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Módulos & Pet 🐾</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup & Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IA & Ferramentas</span>
          </button>
        </div>

        {/* Content */}
        <div id="help-modal-content" className="p-5 sm:p-6 space-y-6">

          {/* SECTION 1: CALENDAR & DAY SELECTION */}
          {(activeTab === 'all' || activeTab === 'calendar') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 border-b border-white/5 pb-2">
                <CalendarDays className="w-5 h-5" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                  Calendário de Contas & Duplo Clique
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Square Coloring */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                      <span>Quadrado do Dia Colorido por Status</span>
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                      Visual Destacado
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cada quadrado de dia do calendário é contornado e colorido por inteiro de acordo com as pendências financeiras do dia:
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-400"></span>
                      <span><strong className="text-rose-300">Vermelho:</strong> Conta ou boleto com vencimento em atraso.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500 border border-amber-400"></span>
                      <span><strong className="text-amber-300">Amarelo:</strong> Conta que vence no dia de hoje ou próxima.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400"></span>
                      <span><strong className="text-emerald-300">Verde:</strong> Todas as contas do dia já foram marcadas como pagas.</span>
                    </div>
                  </div>
                </div>

                {/* Double Click Shortcut */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-amber-400" />
                      <span>Duplo Clique no Dia para Abrir a Conta</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                      Atalho Rápido
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dê um <strong>duplo clique rápido</strong> sobre qualquer quadrado de dia no calendário para <strong>abrir diretamente a conta/boleto cadastrada para aquele dia</strong> para ver os detalhes ou dar baixa.
                  </p>
                  <p className="text-xs text-slate-400 bg-white/5 p-2 rounded-xl">
                    💡 <em>Se o dia tiver mais de um item, o primeiro boleto será aberto ou você poderá editar os itens pelo ícone de Lápis que aparece na lista selecionada abaixo do calendário.</em>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: BILLS, NOTES & OBSERVAÇÕES */}
          {(activeTab === 'all' || activeTab === 'bills') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 border-b border-white/5 pb-2">
                <FileText className="w-5 h-5" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                  Cadastro de Contas & Campo Observação
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-amber-400" />
                    <span>Observação do que se refere a conta</span>
                  </h5>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                    Novo Campo
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ao criar ou editar uma conta a pagar, você encontrará o campo de <strong>Observação (Do que se refere esta conta)</strong>. Utilize este campo para especificar detalhes importantes, como por exemplo:
                </p>
                <div className="bg-[#1A1A1E] p-3 rounded-xl border border-white/5 text-xs text-amber-200/90 italic space-y-1">
                  <p>• "Referente a reparo da bomba d'água da residência"</p>
                  <p>• "Parcela 2 de 5 do seguro do carro"</p>
                  <p>• "Manutenção periódica de peças e óleo"</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta observação é exibida em destaque com etiqueta amarela nos cards da lista de contas e também no detalhamento por dia no calendário.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Baixa Automática no Extrato</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ao marcar uma conta como "Paga", o sistema cria automaticamente uma transação no seu extrato de gastos do mês.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span>Ocultar Contas Pagas (Filtro)</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A aba de Contas inicia filtrada por "Ativas" (ocultando as pagas). Clique no filtro "Pagas" para ver o histórico.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <span>Ignorar nos Totais Gerais</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Use o ícone da Calculadora para que determinado boleto não altere os totais do resumo financeiro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PERSONALIZAÇÃO DE MÓDULOS & MÓDULO PET */}
          {(activeTab === 'all' || activeTab === 'modules') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-2">
                <Dog className="w-5 h-5" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                  Personalização de Módulos & Cuidados Pet 🐾
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Escolha os Módulos Ativos no Menu</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Novo Recurso
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Personalize a barra de navegação superior deixando visível os módulos que você realmente utiliza!
                </p>
                <div className="bg-[#1A1A1E] p-3 rounded-xl border border-white/5 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-emerald-300">Como Personalizar:</p>
                  <p>1. Clique no botão <strong>"Personalizar Módulos"</strong> no topo da tela.</p>
                  <p>2. Ative ou desative as opções de módulos principais.</p>
                  <p>3. Salve as preferências. O menu se adapta instantaneamente!</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-purple-400" />
                    <span>Reordenar Guias (Clique Longo)</span>
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Novo Recurso
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Clique e segure (por 0.5s) sobre qualquer aba na barra de navegação para abrir as opções de reorganização.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p>• <strong>Mover para Esquerda / Direita:</strong> Desloca o módulo.</p>
                  <p>• <strong>Fixar no Início:</strong> Coloca o módulo como a primeira aba.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: BACKUP, RESTORE & EXCEL */}
          {(activeTab === 'all' || activeTab === 'backup') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-2">
                <Download className="w-5 h-5" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                  Controle de Dados: Backup, Restauração & Excel
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Backup - Save to Phone/PC Folder */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex gap-3">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0 h-11 w-11 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-white flex items-center gap-2">
                        <span>Fazer Backup (Salvar na Pasta do Celular)</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Baixa um arquivo completo <code className="text-[11px] font-mono bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">.json</code> na sua pasta <strong>Downloads</strong>. Guarde esse arquivo para garantir segurança total dos seus lançamentos.
                      </p>
                    </div>
                  </div>

                  {onExportData && (
                    <button
                      type="button"
                      onClick={onExportData}
                      className="shrink-0 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Salvar Backup (.json)</span>
                    </button>
                  )}
                </div>

                {/* Restore - Load Backup File */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex gap-3">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 shrink-0 h-11 w-11 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-white flex items-center gap-2">
                        <span>Restaurar Backup do Dispositivo</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Escolha o arquivo <code className="text-[11px] font-mono bg-slate-800 text-purple-300 px-1 py-0.5 rounded">.json</code> guardado na pasta do celular ou PC. Todos os dados serão restaurados na mesma hora.
                      </p>
                    </div>
                  </div>

                  {onImportData && (
                    <label className="shrink-0 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Restaurar Backup</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          onImportData(e);
                          onClose();
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Excel Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex gap-3">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 h-11 w-11 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-white flex items-center gap-2">
                        <span>Exportar Planilha Excel (.xlsx)</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Gera uma planilha Excel estruturada em abas: <strong>Transações, Contas, Diário EV, Veículo, Casa e Orçamentos</strong>.
                      </p>
                    </div>
                  </div>

                  {onExportExcel && (
                    <button
                      type="button"
                      onClick={onExportExcel}
                      className="shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Baixar Excel (.xlsx)</span>
                    </button>
                  )}
                </div>

                {/* Reset */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex gap-3">
                    <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0 h-11 w-11 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-white flex items-center gap-2">
                        <span>Reiniciar de Fábrica (Seleção Personalizada)</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Abre um painel de confirmação para você marcar e apagar apenas o módulo que deseja resetar (ex: limpar só contas ou só veículo).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onResetData) {
                        onResetData();
                        onClose();
                      }
                    }}
                    className="shrink-0 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reiniciar de Fábrica</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: AI & SPECIALIZED MODULES */}
          {(activeTab === 'all' || activeTab === 'tools') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400 border-b border-white/5 pb-2">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                  Assistente IA & Módulos Especializados
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entradas & Renda */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Home className="w-4 h-4" />
                    <span className="font-bold text-xs">Entradas Manuais & Carro</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dentro da guia "Entradas", clique em <strong>"Entrada Manual"</strong> para exibir os campos de lançamento manual e revelar o botão extra para cadastrar um novo <strong>"Carro (Fonte Fixa)"</strong>.
                  </p>
                </div>

                {/* Assistente IA */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="font-bold text-xs">Assistente por Voz e Texto IA</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Fale ou digite naturalmente em texto corrido (ex: <em>"Gastei R$ 45 no mercado hoje via PIX"</em>). A IA extrai o valor, a categoria e a forma de pagamento e insere no seu histórico.
                  </p>
                </div>

                {/* Diário de Motoristas */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span className="font-bold text-xs">Diário EV / Motoristas de App</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Módulo sob medida para quem roda com Uber, 99 ou entregas. Lance a KM inicial e final, faturamento bruto total e gastos com recargas ou combustível para calcular seu lucro líquido exato por KM.
                  </p>
                </div>

                {/* Veículo & Garagem */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Car className="w-4 h-4" />
                    <span className="font-bold text-xs">Garagem & Veículo</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cadastre suas despesas fixas (IPVA, Seguro, Licenciamento) e acompanhe o histórico de revisões periódicas por quilometragem (troca de óleo, pneus, freios).
                  </p>
                </div>

                {/* Gestão Residencial */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Home className="w-4 h-4" />
                    <span className="font-bold text-xs">Gestão Residencial (Casa)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Registre a leitura diária dos relógios de energia elétrica, água e gás para monitorar picos de consumo e estimar o valor final da conta antes do vencimento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CANAL DE SUGESTÕES VIA WHATSAPP */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Canal Direto de Feedback</span>
                </div>
                <h4 className="font-extrabold text-sm text-white">
                  Tem sugestões de melhorias ou ideias para o sistema?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Envie sua mensagem diretamente pelo WhatsApp <strong>(+55 11 95329-2570)</strong>. Ficaremos muito felizes em receber sua opinião!
                </p>
              </div>

              <button
                type="button"
                onClick={() => openWhatsApp()}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-slate-950" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Fale Conosco (WhatsApp)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div id="help-modal-footer" className="p-5 sm:p-6 border-t border-white/5 flex items-center justify-between bg-[#161618] sticky bottom-0 z-20">
          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>GKD Mobility • 100% Local & Seguro no Dispositivo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.2)] ml-auto"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

