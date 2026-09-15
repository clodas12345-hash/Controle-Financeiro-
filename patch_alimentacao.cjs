const fs = require('fs');
let code = fs.readFileSync('src/components/DailyLogModule.tsx', 'utf8');

const regex = /\{\/\* Food Expense Section \*\/\}[\s\S]*?\{\/\* Row 3: App Earnings \*\/\}/;

const newSection = `{/* Food Expense Section */}
                <div className="bg-slate-900/60 border border-orange-500/20 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-orange-400 flex items-center justify-between w-full uppercase tracking-wider cursor-pointer" onClick={() => setIsFoodExpensesExpanded(!isFoodExpensesExpanded)}>
                       <span className="flex items-center gap-1.5"><Utensils className="w-4 h-4" /> Alimentação</span>
                       <div className="flex items-center gap-2">
                         {!isFoodExpensesExpanded && <span className="text-orange-300">{formatBRL((editingLog.foodExpenses && editingLog.foodExpenses.length > 0) ? editingLog.foodExpenses.reduce((acc, m) => acc + m.amount, 0) : (editingLog.foodExpense || 0))}</span>}
                         {isFoodExpensesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                       </div>
                    </label>
                  </div>
                  
                  {isFoodExpensesExpanded && (
                    <>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const currentExpenses = (editingLog.foodExpenses && editingLog.foodExpenses.length > 0) 
                              ? editingLog.foodExpenses 
                              : (Number(editingLog.foodExpense) > 0 ? [{ description: 'Alimentação (antigo)', amount: Number(editingLog.foodExpense) }] : []);
                              
                          setEditingLog({
                            ...editingLog,
                            foodExpense: 0,
                            foodExpenses: [...currentExpenses, { description: '', amount: 0 }]
                          });
                        }}
                        className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded-lg font-bold hover:bg-orange-500/30 transition"
                      >
                        + Novo
                      </button>
                    </div>

                    {(() => {
                      const currentExpenses = (editingLog.foodExpenses && editingLog.foodExpenses.length > 0) 
                              ? editingLog.foodExpenses 
                              : (Number(editingLog.foodExpense) > 0 ? [{ description: 'Alimentação', amount: Number(editingLog.foodExpense) }] : []);
                              
                      if (currentExpenses.length === 0) return null;
                      
                      return currentExpenses.map((exp, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={exp.description}
                            onChange={(e) => {
                              const newExpenses = [...currentExpenses];
                              newExpenses[idx] = { ...newExpenses[idx], description: e.target.value };
                              setEditingLog({ ...editingLog, foodExpense: 0, foodExpenses: newExpenses });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-700/50 text-white rounded-xl px-3 py-1 text-xs"
                            placeholder="Descrição"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={exp.amount > 0 ? exp.amount : ''}
                            onChange={(e) => {
                              const newExpenses = [...currentExpenses];
                              newExpenses[idx] = { ...newExpenses[idx], amount: Number(e.target.value) || 0 };
                              setEditingLog({ ...editingLog, foodExpense: 0, foodExpenses: newExpenses });
                            }}
                            className="w-20 bg-slate-950 border border-slate-700/50 text-orange-300 rounded-xl px-3 py-1 text-xs"
                            placeholder="Valor"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newExpenses = currentExpenses.filter((_, i) => i !== idx);
                              setEditingLog({ ...editingLog, foodExpense: 0, foodExpenses: newExpenses });
                            }}
                            className="text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ));
                    })()}
                    
                    <div className="flex justify-between items-center px-2 pt-1 border-t border-slate-700/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                      <span className="text-xs font-bold text-orange-400">
                        {formatBRL((editingLog.foodExpenses && editingLog.foodExpenses.length > 0) ? editingLog.foodExpenses.reduce((acc, m) => acc + m.amount, 0) : (Number(editingLog.foodExpense) || 0))}
                      </span>
                    </div>
                    </>
                  )}
                </div>

              {/* Row 3: App Earnings */}`;

if (regex.test(code)) {
  code = code.replace(regex, newSection);
  fs.writeFileSync('src/components/DailyLogModule.tsx', code);
  console.log("Patched successfully!");
} else {
  console.log("Regex not matched!");
}
