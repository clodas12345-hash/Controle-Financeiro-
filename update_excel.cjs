const fs = require('fs');
let code = fs.readFileSync('src/lib/excelExport.ts', 'utf8');

code = `import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
` + code;

const searchStr = `const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });`;

const replaceStr = `
    if (Capacitor.isNativePlatform()) {
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache
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
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('src/lib/excelExport.ts', code);
console.log('done excelExport.ts');
