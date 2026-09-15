const fs = require('fs');

// Update backupManager.ts
let backupCode = fs.readFileSync('src/lib/backupManager.ts', 'utf8');
backupCode = backupCode.replace(/Directory\.Cache/g, 'Directory.Documents');
backupCode = backupCode.replace(
  /Backup enviado para o compartilhamento! Você pode salvar no Google Drive, WhatsApp ou Arquivos\./g, 
  'Backup salvo na pasta Documentos do seu celular! Você também pode compartilhar agora.'
);
fs.writeFileSync('src/lib/backupManager.ts', backupCode);

// Update excelExport.ts
let excelCode = fs.readFileSync('src/lib/excelExport.ts', 'utf8');
excelCode = excelCode.replace(/Directory\.Cache/g, 'Directory.Documents');
fs.writeFileSync('src/lib/excelExport.ts', excelCode);

console.log('Directories updated to Documents!');
