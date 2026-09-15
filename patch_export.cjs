const fs = require('fs');
let code = fs.readFileSync('src/lib/excelExport.ts', 'utf8');

// Replace carExpense
code = code.replace(
  "const totalCosts = (l.energyCost || 0) + (l.dailyRentalCost || 0) + (l.carExpense || 0);",
  "const carExpTotal = (l.carExpenses && l.carExpenses.length > 0) ? l.carExpenses.reduce((acc, c) => acc + (c.amount || 0), 0) : (l.carExpense || 0);\n      const foodExpTotal = (l.foodExpenses && l.foodExpenses.length > 0) ? l.foodExpenses.reduce((acc, f) => acc + (f.amount || 0), 0) : (l.foodExpense || 0);\n      const totalCosts = (l.energyCost || 0) + (l.dailyRentalCost || 0) + carExpTotal;"
);

code = code.replace(
  "'Despesas Veículo (R$)': l.carExpense || 0,",
  "'Despesas Veículo (R$)': carExpTotal,"
);

code = code.replace(
  "'Alimentação (R$)': l.foodExpense || 0,",
  "'Alimentação (R$)': foodExpTotal,"
);

fs.writeFileSync('src/lib/excelExport.ts', code);
console.log("Patched export!");
