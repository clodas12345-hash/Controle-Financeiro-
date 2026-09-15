import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Database,
  Sparkles,
  Share2,
  Layers,
  FileText,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  Share,
} from 'lucide-react';
import {
  exportFullBackupUniversal,
  restoreFullBackupFromJSON,
  copyTextToClipboard,
  generateFullBackupPayload,
  getAutomaticRestorePoints,
  saveAutomaticRestorePoint,
  restoreFromRestorePoint,
  RestorePoint,
} from '../lib/backupManager';
import { exportAppToExcel } from '../lib/excelExport';
import { loadAllAppData } from '../lib/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: ReturnType<typeof loadAllAppData>;
  onDataRestored: (newData: ReturnType<typeof loadAllAppData>) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  appData,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'restore_points'>('export');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setRestorePoints(getAutomaticRestorePoints());
      setStatus({ type: 'idle', message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const payload = generateFullBackupPayload(appData);
  const summary = payload.summary;

  // 1. Universal Export (Native Share on Android/APK + Download on Desktop)
  const handleUniversalBackup = async (mode: 'download' | 'share' = 'download') => {
    setIsExporting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await exportFullBackupUniversal(appData, mode);
      setStatus({
        type: 'success',
        message: res.message || `Backup gerado com sucesso (${res.totalRecords} itens).`,
      });
      // Also update restore points
      saveAutomaticRestorePoint(appData, 'Backup Manual Exportado');
      setRestorePoints(getAutomaticRestorePoints());
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Falha ao exportar backup: ${err?.message || 'Erro inesperado'}. Você também pode usar a opção "Copiar Código do Backup".`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Excel Spreadsheet
  const handleExcelExport = () => {
    try {
      exportAppToExcel(appData);
      setStatus({
        type: 'success',
        message: 'Planilha Excel gerada! Se estiver no celular, você pode salvá-la ou abri-la no WhatsApp ou Google Drive.',
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Erro ao exportar Excel: ${err?.message || 'Falha inesperada'}`,
      });
    }
  };

  // 3. Safe Copy to Clipboard
  const handleCopyBackup = async () => {
    try {
      const jsonStr = JSON.stringify(payload, null, 2);
      const ok = await copyTextToClipboard(jsonStr);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        setStatus({
          type: 'success',
          message: 'Código completo do backup copiado com sucesso para a área de transferência!',
        });
      } else {
        setShowRawJson(true);
        setStatus({
          type: 'error',
          message: 'Não foi possível copiar automaticamente. O código foi exibido abaixo para você selecionar e copiar.',
        });
      }
    } catch {
      setShowRawJson(true);
    }
  };

  // 4. File Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a safety restore point before replacing data
    saveAutomaticRestorePoint(appData, 'Antes da Restauração');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreFullBackupFromJSON(content);
      if (res.success && res.restoredData) {
        onDataRestored(res.restoredData);
        setRestorePoints(getAutomaticRestorePoints());
        setStatus({
          type: 'success',
          message: `Backup restaurado com sucesso! ${res.restoredSummary?.total || 0} registros foram restaurados.`,
        });
      } else {
        setStatus({
          type: 'error',
          message: res.error || 'Arquivo de backup inválido ou corrompido.',
        });
      }
    };
    reader.onerror = () => {
      setStatus({
        type: 'error',
        message: 'Erro ao ler o arquivo selecionado no seu dispositivo.',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 5. Restore by Pasting JSON text
  const handlePasteRestore = () => {
    if (!pasteInput.trim()) {
      setStatus({
        type: 'error',
        message: 'Por favor, cole o código do backup no campo antes de restaurar.',
      });
      return;
    }

    saveAutomaticRestorePoint(appData, 'Antes da Restauração Manual');

    const res = restoreFullBackupFromJSON(pasteInput.trim());
    if (res.success && res.restoredData) {
      onDataRestored(res.restoredData);
      setPasteInput('');
      setRestorePoints(getAutomaticRestorePoints());
      setStatus({
        type: 'success',
        message: `Backup restaurado com sucesso! ${res.restoredSummary?.total || 0} registros recuperados.`,
      });
    } else {
      setStatus({
        type: 'error',
        message: res.error || 'O texto colado não é um backup válido.',
      });
    }
  };

  // 6. Restore from an Automatic Restore Point
  const handleRestoreFromPoint = (pointId: string) => {
    if (!confirm('Deseja realmente restaurar os dados deste ponto de restauração? Os dados atuais serão substituídos pelos salvos nessa data.')) {
      return;
    }
    saveAutomaticRestorePoint(appData, 'Antes da Restauração Automática');
    const res = restoreFromRestorePoint(pointId);
    if (res.success && res.restoredData) {
      onDataRestored(res.restoredData);
      setRestorePoints(getAutomaticRestorePoints());
      setStatus({
        type: 'success',
        message: 'Ponto de restauração aplicado com sucesso!',
      });
    } else {
      setStatus({
        type: 'error',
        message: res.error || 'Erro ao aplicar ponto de restauração.',
      });
    }
  };

  // 7. Manual snapshot creation
  const handleCreateSnapshot = () => {
    saveAutomaticRestorePoint(appData, 'Ponto Manual Criado');
    setRestorePoints(getAutomaticRestorePoints());
    setStatus({
      type: 'success',
      message: 'Novo ponto de restauração salvo na memória com sucesso!',
    });
  };

  return (
    <div
      id="backup-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600/20 via-slate-900 to-[#121214] p-5 sm:p-6 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Backup & Restauração
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  100% Offline & Seguro
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Exporte, salve no WhatsApp/Drive ou restaure suas contas e lançamentos.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurar Dados</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('restore_points')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'restore_points'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pontos Salvos</span>
            </button>
          </div>
        </div>

        {/* Status Message Alert */}
        {status.type !== 'idle' && (
          <div
            className={`p-3.5 mx-5 sm:mx-6 mt-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
              status.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{status.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Primary Universal Export Button */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/30 via-slate-900 to-slate-900 border border-blue-500/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                    Compatível com Celular & PC
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-white">
                    Salvar / Compartilhar Backup Completo
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Gera o arquivo com 100% das suas contas, despesas, cartões e lançamentos. No celular, abre o menu para salvar no Google Drive, WhatsApp ou Meus Arquivos. No computador, faz o download imediato.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUniversalBackup('download')}
                    disabled={isExporting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Salvar no Celular</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUniversalBackup('share')}
                    disabled={isExporting}
                    className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Share className="w-4 h-4" />
                    <span>Compartilhar (WhatsApp)</span>
                  </button>
                </div>
              </div>

              {/* Secondary Export Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Excel Export */}
                <button
                  type="button"
                  onClick={handleExcelExport}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-950/20 transition cursor-pointer flex items-center gap-3 text-left group active:scale-98"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white group-hover:text-emerald-300">
                      Exportar Planilha Excel (.xlsx)
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Tabelas formatadas para contabilidade
                    </p>
                  </div>
                </button>

                {/* Copy JSON Code */}
                <button
                  type="button"
                  onClick={handleCopyBackup}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-950/20 transition cursor-pointer flex items-center gap-3 text-left group active:scale-98"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white group-hover:text-purple-300">
                      {copied ? 'Copiado para a Memória!' : 'Copiar Código do Backup'}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      Cole no WhatsApp ou bloco de notas
                    </p>
                  </div>
                </button>
              </div>

              {/* View Raw JSON Text Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showRawJson ? 'Ocultar código do backup' : 'Ver código do backup (texto bruto)'}</span>
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRawJson && (
                  <div className="mt-2 p-3 bg-black/50 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Texto JSON completo:</span>
                      <button
                        type="button"
                        onClick={handleCopyBackup}
                        className="text-blue-400 hover:text-blue-300 font-bold"
                      >
                        Copiar tudo
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={6}
                      value={JSON.stringify(payload, null, 2)}
                      className="w-full bg-black/70 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-slate-300 resize-none select-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Option A: Select File (.json) */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Opção 1: Selecionar Arquivo .JSON</h4>
                    <p className="text-[11px] text-slate-400">
                      Escolha o arquivo salvo no seu aparelho ou baixado do WhatsApp
                    </p>
                  </div>
                </div>

                <label className="w-full py-2.5 px-4 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98">
                  <Upload className="w-4 h-4" />
                  <span>Procurar Arquivo de Backup</span>
                  <input
                    type="file"
                    accept=".json,application/json,text/plain,text/*,*/*"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option B: Paste JSON Text */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Opção 2: Colar Código do Backup</h4>
                    <p className="text-[11px] text-slate-400">
                      Ideal para quem copiou o texto ou enviou pelo WhatsApp
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="Cole aqui o texto do backup que começa com { e termina com }..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={handlePasteRestore}
                  disabled={!pasteInput.trim()}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Dados a Partir do Texto</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE POINTS */}
          {activeTab === 'restore_points' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Pontos de Restauração Automáticos</h4>
                  <p className="text-[11px] text-slate-400">
                    Cópias de segurança salvas automaticamente na memória do seu dispositivo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-xl text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Criar Ponto Agora</span>
                </button>
              </div>

              {restorePoints.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/40 border border-white/5 rounded-2xl text-slate-400 text-xs">
                  Nenhum ponto de restauração gravado ainda. Clique em "Criar Ponto Agora" para registrar uma cópia de segurança instantânea.
                </div>
              ) : (
                <div className="space-y-2">
                  {restorePoints.map((point) => (
                    <div
                      key={point.id}
                      className="p-3 bg-slate-900/80 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-white truncate">{point.label}</h5>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(point.timestamp).toLocaleString('pt-BR')} • {point.totalRecords} registros
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreFromPoint(point.id)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Data Summary Breakdown */}
          <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Resumo dos Dados no Aplicativo
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                {summary.totalRecords} registros
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">Lançamentos</span>
                <strong className="text-white text-sm">{summary.transactionsCount}</strong>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">Contas & Faturas</span>
                <strong className="text-white text-sm">{summary.billsCount}</strong>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">Cartões Crédito</span>
                <strong className="text-white text-sm">{summary.creditCardsCount}</strong>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">Veículos & Casa</span>
                <strong className="text-white text-sm">{summary.vehiclesCount + summary.homeReadingsCount}</strong>
              </div>
            </div>
          </div>

          {/* Privacy and Security Badge */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <strong className="text-emerald-300 block">Segurança e Privacidade</strong>
              <span className="text-slate-300 text-[11px]">
                Seus dados ficam 100% gravados com você. Você pode salvar seus backups no seu Google Drive, WhatsApp ou onde desejar.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#161618] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleUniversalBackup('download')}
            disabled={isExporting}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Salvar Backup</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
