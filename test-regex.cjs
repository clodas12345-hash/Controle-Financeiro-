const fs = require('fs');
let code = fs.readFileSync('src/components/AnalyticsModule.tsx', 'utf8');
const stateRegex = new RegExp("\\\\s*const \\\\[deletingTxId, setDeletingTxId\\\\] = useState.*?;\\n");
const match = code.match(stateRegex);
console.log(match ? 'Matched' : 'Not Matched');
