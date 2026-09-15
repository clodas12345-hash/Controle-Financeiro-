const fs = require('fs');
let code = fs.readFileSync('src/components/DailyLogModule.tsx', 'utf8');

// just remove what's between "{/* Food Expense Section */}" and "{/* Row 3: App Earnings */}"
const start = code.indexOf('{/* Food Expense Section */}');
const end = code.indexOf('{/* Row 3: App Earnings */}');

if(start !== -1 && end !== -1) {
  const before = code.substring(0, start);
  const after = code.substring(end);
  fs.writeFileSync('src/components/DailyLogModule.tsx', before + after);
  console.log("Removed successfully!");
} else {
  console.log("NOT FOUND!");
}
