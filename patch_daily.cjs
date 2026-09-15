const fs = require('fs');
let code = fs.readFileSync('src/components/DailyLogModule.tsx', 'utf8');

code = code.replace(
  "const [isCarExpensesExpanded, setIsCarExpensesExpanded] = useState<boolean>(false);",
  "const [isCarExpensesExpanded, setIsCarExpensesExpanded] = useState<boolean>(false);\n  const [isFoodExpensesExpanded, setIsFoodExpensesExpanded] = useState<boolean>(false);"
);

// We also need to compute total food cost. It is either the sum of foodExpenses OR foodExpense if foodExpenses is empty.
// In handleUpdateLog, maybe we want to keep foodExpense for legacy, or sum it up.
// Actually, let's find where food cost is computed.
code = code.replace(
  "const food = Number(log.foodExpense) || 0;",
  "const food = (log.foodExpenses && log.foodExpenses.length > 0) ? log.foodExpenses.reduce((acc, f) => acc + (Number(f.amount) || 0), 0) : (Number(log.foodExpense) || 0);"
);

fs.writeFileSync('src/components/DailyLogModule.tsx', code);
console.log("Patched daily log");
