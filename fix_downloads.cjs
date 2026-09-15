const fs = require('fs');

// --- 1. Fix backupManager.ts ---
let backupCode = fs.readFileSync('src/lib/backupManager.ts', 'utf8');

// Replace Directory.Documents with Directory.ExternalStorage and path to Download/
backupCode = backupCode.replace(/directory: Directory\.Documents/g, "directory: Directory.ExternalStorage");
backupCode = backupCode.replace(/path: filename,/g, "path: 'Download/' + filename,");
backupCode = backupCode.replace(/pasta Documentos/g, "pasta Downloads");

fs.writeFileSync('src/lib/backupManager.ts', backupCode);


// --- 2. Fix excelExport.ts ---
let excelCode = fs.readFileSync('src/lib/excelExport.ts', 'utf8');

// The excel file is currently written to Directory.Cache and then shared.
// We should give the option to download or share, but for now the user just wants it to work.
// Let's modify excelExport to also save to Downloads explicitly.

const capSearch = `      const saveAndShare = async () => {
        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache
          });
          await Share.share({
            title: 'Planilha Controle Financeiro',
            text: \`Planilha financeira gerada em \${new Date().toLocaleDateString('pt-BR')}\`,
            url: result.uri,
            dialogTitle: 'Compartilhar Planilha'
          });
        } catch (err) {
          console.warn('Native share/write failed:', err);
        }
      };
      saveAndShare();`;

const capReplace = `      const saveAndShare = async () => {
        try {
          // Request permissions first
          const permStatus = await Filesystem.checkPermissions();
          if (permStatus.publicStorage !== 'granted') {
            await Filesystem.requestPermissions();
          }

          // Save to public Downloads folder
          const result = await Filesystem.writeFile({
            path: 'Download/' + fileName,
            data: base64,
            directory: Directory.ExternalStorage
          });
          
          alert('Planilha salva com sucesso na pasta DOWNLOADS do seu celular!');
          
          // Still offer to share to WhatsApp
          await Share.share({
            title: 'Planilha Controle Financeiro',
            text: \`Planilha financeira gerada em \${new Date().toLocaleDateString('pt-BR')}\`,
            url: result.uri,
            dialogTitle: 'Compartilhar Planilha'
          });
        } catch (err) {
          console.warn('Native share/write failed:', err);
          alert('Erro ao salvar no celular. Tente verificar as permissões.');
        }
      };
      saveAndShare();`;

excelCode = excelCode.replace(capSearch, capReplace);
fs.writeFileSync('src/lib/excelExport.ts', excelCode);

console.log('Fixed paths to Downloads!');
