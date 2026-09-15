const fs = require('fs');
let code = fs.readFileSync('src/components/BackupModal.tsx', 'utf8');

// Replace handleUniversalBackup
const searchStr = `  // 1. Export Universal Native / Web Backup
  const handleUniversalBackup = async () => {
    setIsExporting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await exportFullBackupUniversal(appData);
      setStatus({
        type: 'success',
        message: res.message || \`Backup gerado com sucesso (\${res.totalRecords} itens).\`,
      });
      // Also update restore points
      saveAutomaticRestorePoint(appData, 'Backup Manual Exportado');
      setRestorePoints(getAutomaticRestorePoints());
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: \`Falha ao exportar backup: \${err?.message || 'Erro inesperado'}. Você também pode usar a opção "Copiar Código do Backup".\`,
      });
    } finally {
      setIsExporting(false);
    }
  };`;

const replaceStr = `  // 1. Export Universal Native / Web Backup
  const handleUniversalBackup = async (mode: 'download' | 'share' = 'download') => {
    setIsExporting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await exportFullBackupUniversal(appData, mode);
      setStatus({
        type: 'success',
        message: res.message || \`Backup gerado com sucesso (\${res.totalRecords} itens).\`,
      });
      // Also update restore points
      saveAutomaticRestorePoint(appData, 'Backup Manual Exportado');
      setRestorePoints(getAutomaticRestorePoints());
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: \`Falha ao exportar backup: \${err?.message || 'Erro inesperado'}. Você também pode usar a opção "Copiar Código do Backup".\`,
      });
    } finally {
      setIsExporting(false);
    }
  };`;

code = code.replace(searchStr, replaceStr);

// Now the UI for the main button
const uiSearch = `                <button
                  type="button"
                  onClick={handleUniversalBackup}
                  disabled={isExporting}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Processando Backup...' : 'Exportar / Compartilhar Backup (.JSON)'}</span>
                </button>`;

const uiReplace = `                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>`;

code = code.replace(uiSearch, uiReplace);

// Also update the footer button
const footerSearch = `          <button
            type="button"
            onClick={handleUniversalBackup}
            disabled={isExporting}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Salvar Backup</span>
          </button>`;

const footerReplace = `          <button
            type="button"
            onClick={() => handleUniversalBackup('download')}
            disabled={isExporting}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Salvar Backup</span>
          </button>`;

code = code.replace(footerSearch, footerReplace);

// add Share icon to lucide imports if missing
if (!code.includes('Share,')) {
  code = code.replace(/} from 'lucide-react';/, '  Share,\n} from \'lucide-react\';');
}

fs.writeFileSync('src/components/BackupModal.tsx', code);
console.log('updated BackupModal.tsx');
