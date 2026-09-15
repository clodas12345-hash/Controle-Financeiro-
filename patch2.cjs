const fs = require('fs');
let code = fs.readFileSync('src/components/DailyLogModule.tsx', 'utf8');

// Part 1: Fix grid-cols-4 and remove food input from grid
const gridStartStr = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">`;
code = code.replace(gridStartStr, `<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">`);

// Part 2: Fix the broken line in dailyRentalCost and remove Alimentacao div
const brokenStr = `                      value={Number(editingLog.dailyRentalCost) > 0 ? editingLog.dailyRentalCost : ''}
                      onChange={(e) => setEditingLog({ ...editingLog, dailyRentalCost: e.target.value === '' ? 0 : Number(e.target.value) })}                      className="w-full bg-slate-950 border border-slate-700/50 text-rose-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 flex items-center gap-1"><Utensils className="w-3 h-3 text-orange-400" /> Alimentação</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor (R$)"
                      value={Number(editingLog.foodExpense) > 0 ? editingLog.foodExpense : ''}
                      onChange={(e) => setEditingLog({ ...editingLog, foodExpense: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700/50 text-orange-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>`;
const replacement1 = `                      value={Number(editingLog.dailyRentalCost) > 0 ? editingLog.dailyRentalCost : ''}
                      onChange={(e) => setEditingLog({ ...editingLog, dailyRentalCost: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700/50 text-rose-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>`;
const regex1 = new RegExp(brokenStr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s*'));
if(regex1.test(code)) {
    code = code.replace(regex1, replacement1);
    console.log("Replaced brokenStr successfully!");
} else {
    console.log("brokenStr NOT FOUND!");
}

// Part 3: Add Alimentacao card back before Row 3: App Earnings
const row3Str = `{/* Row 3: App Earnings */}`;
const alimentacaoCard = `{/* Food Expense Section */}
                <div className="bg-slate-900/60 border border-orange-500/20 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
                       <span className="flex items-center gap-1.5"><Utensils className="w-4 h-4" /> Alimentação</span>
                    </label>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor (R$)"
                      value={Number(editingLog.foodExpense) > 0 ? editingLog.foodExpense : ''}
                      onChange={(e) => setEditingLog({ ...editingLog, foodExpense: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700/50 text-orange-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

              {/* Row 3: App Earnings */}`;
code = code.replace(row3Str, alimentacaoCard);

fs.writeFileSync('src/components/DailyLogModule.tsx', code);
console.log("Done!");
