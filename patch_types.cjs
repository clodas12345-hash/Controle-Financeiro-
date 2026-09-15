const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const regex = /foodExpense\?: number; \/\/ Alimentação[\s\S]*?\/\/ Despesas de alimentação detalhadas/m;
if (regex.test(code)) {
    code = code.replace(regex, 'foodExpense?: number; // Alimentação\n  foodExpenses?: { description: string; amount: number }[]; // Alimentação detalhada');
    fs.writeFileSync('src/types.ts', code);
    console.log("Fixed types!");
} else {
    // maybe there's a different duplication
    console.log("Not matched exactly. Let's look at the lines.");
}
