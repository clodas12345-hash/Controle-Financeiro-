const fs = require('fs');

let code = fs.readFileSync('src/components/BackupModal.tsx', 'utf8');
code = code.replace(
`  const handleUniversalBackup = async () => {`,
`  const handleUniversalBackup = async (mode: 'download' | 'share' = 'download') => {`
);
code = code.replace(
`      const res = await exportFullBackupUniversal(appData);`,
`      const res = await exportFullBackupUniversal(appData, mode);`
);

fs.writeFileSync('src/components/BackupModal.tsx', code);
console.log('Fixed type error in BackupModal');
