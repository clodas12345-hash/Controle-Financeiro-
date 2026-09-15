const fs = require('fs');
let code = fs.readFileSync('src/components/DailyLogModule.tsx', 'utf8');

const replacement = `                      className="w-full bg-slate-950 border border-slate-700/50 text-rose-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
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

const searchStr = `                      className="w-full bg-slate-950 border border-slate-700/50 text-rose-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>`;

if(code.includes(searchStr)) {
  code = code.replace(searchStr, replacement);
  fs.writeFileSync('src/components/DailyLogModule.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("NOT FOUND!");
}
