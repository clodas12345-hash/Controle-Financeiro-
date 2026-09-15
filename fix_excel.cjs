const fs = require('fs');
let code = fs.readFileSync('src/lib/excelExport.ts', 'utf8');

const capSearch = `    if (Capacitor.isNativePlatform()) {
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents
      }).then((result) => {
        Share.share({
          title: 'Planilha Controle Financeiro',
          text: \`Planilha financeira gerada em \${new Date().toLocaleDateString('pt-BR')}\`,
          url: result.uri,
          dialogTitle: 'Compartilhar Planilha'
        }).catch(err => console.warn('Share error', err));
      }).catch(err => {
        console.warn('File write error', err);
      });
      return;
    }`;

const capReplace = `    if (Capacitor.isNativePlatform()) {
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      
      const saveAndShare = async () => {
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
      saveAndShare();
      return;
    }`;

code = code.replace(capSearch, capReplace);
fs.writeFileSync('src/lib/excelExport.ts', code);
console.log('Fixed excelExport.ts');
