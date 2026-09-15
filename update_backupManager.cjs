const fs = require('fs');

let code = fs.readFileSync('src/lib/backupManager.ts', 'utf8');

// replace exportFullBackupUniversal definition
const searchStr = `export async function exportFullBackupUniversal(
  appData?: ReturnType<typeof loadAllAppData>
): Promise<UniversalBackupResult> {`;

const replaceStr = `export async function exportFullBackupUniversal(
  appData?: ReturnType<typeof loadAllAppData>,
  mode: 'download' | 'share' = 'share'
): Promise<UniversalBackupResult> {`;

code = code.replace(searchStr, replaceStr);

// replace Capacitor logic inside it
const capSearch = `  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonStr,
        directory: Directory.Documents,
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
        message: 'Backup salvo na pasta Documentos do seu celular! Você também pode compartilhar agora.',
      };
    } catch (err) {
      console.warn('Native share/write failed:', err);
    }
  }`;

const capReplace = `  if (Capacitor.isNativePlatform()) {
    try {
      if (mode === 'download') {
        await Filesystem.writeFile({
          path: filename,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        return {
          success: true,
          filename,
          totalRecords: payload.summary.totalRecords,
          method: 'downloaded',
          message: 'Arquivo de backup salvo com sucesso na pasta Documentos do seu celular!',
        };
      } else {
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
          message: 'Backup enviado para compartilhamento.',
        };
      }
    } catch (err) {
      console.warn('Native share/write failed:', err);
      // Fallback
    }
  }`;

code = code.replace(capSearch, capReplace);

fs.writeFileSync('src/lib/backupManager.ts', code);
console.log('done updating backupManager.ts');
