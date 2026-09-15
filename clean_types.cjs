const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(`foodExpenses?: { description: string; amount: number }[]; // Despesas de alimentação detalhadas\n  foodExpenses?: { description: string; amount: number }[]; // Despesas de alimentação detalhadas`, `foodExpenses?: { description: string; amount: number }[]; // Despesas de alimentação detalhadas`);
fs.writeFileSync('src/types.ts', code);
