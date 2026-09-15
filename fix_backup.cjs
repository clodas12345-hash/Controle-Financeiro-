const fs = require('fs');

let code = fs.readFileSync('src/lib/backupManager.ts', 'utf8');

const capSearch = `  if (Capacitor.isNativePlatform()) {
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

const capReplace = `  if (Capacitor.isNativePlatform()) {
    try {
      if (mode === 'download') {
        // Explicitly request permissions for Directory.Documents
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          const req = await Filesystem.requestPermissions();
          if (req.publicStorage !== 'granted') {
            throw new Error('Permissão de armazenamento negada pelo usuário.');
          }
        }
        
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
    } catch (err: any) {
      console.warn('Native share/write failed:', err);
      if (mode === 'download') {
        throw new Error(err?.message || 'Falha ao salvar arquivo no armazenamento do celular.');
      }
      // If it's 'share' and it failed, we can let it fall back
    }
  }`;

code = code.replace(capSearch, capReplace);
fs.writeFileSync('src/lib/backupManager.ts', code);
console.log('Fixed backupManager.ts');
