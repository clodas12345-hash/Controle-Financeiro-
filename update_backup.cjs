const fs = require('fs');
let code = fs.readFileSync('src/lib/backupManager.ts', 'utf8');

code = `import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
` + code;

const searchStr1 = `  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  // 1. On Android / iOS, try native Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {`;

const replaceStr1 = `  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });
      await Share.share({
        title: 'Backup Controle Financeiro',
        text: \`Backup com todos os dados (\${payload.summary.totalRecords} registros) gerado em \${now.toLocaleDateString('pt-BR')}.\`,
        url: result.uri,
        dialogTitle: 'Compartilhar Backup'
      });
      return {
        success: true,
        filename,
        totalRecords: payload.summary.totalRecords,
        method: 'shared',
        message: 'Backup enviado para o compartilhamento! Você pode salvar no Google Drive, WhatsApp ou Arquivos.',
      };
    } catch (err) {
      console.warn('Native share/write failed:', err);
    }
  }

  // 1. On Android / iOS, try native Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {`;

code = code.replace(searchStr1, replaceStr1);

fs.writeFileSync('src/lib/backupManager.ts', code);
console.log('done backupManager.ts');
