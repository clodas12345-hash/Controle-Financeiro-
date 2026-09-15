import React, { useState, useEffect, memo, useMemo } from 'react';
import {
  PieChart as PieIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Transaction, MonthlyBudget } from '../types';
import { formatBRL, formatDateBR } from '../lib/storage';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts';

interface AnalyticsModuleProps {
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  onUpdateBudget?: (category: any, allocated: number) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = memo(({
  transactions = [],
  budgets = [],
  onUpdateBudget,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  React.useEffect(() => {
    const handleClickOutside_deletingTxId = () => {
      setDeletingTxId(null);
    };
    if (deletingTxId) {
      document.addEventListener('click', handleClickOutside_deletingTxId);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside_deletingTxId);
    };
  }, [deletingTxId]);

  const expenses = useMemo(() => transactions.filter((t) => t.type === 'despesa'), [transactions]);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${now.getFullYear()}`;

  const monthExpense = useMemo(() => expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((a, b) => a + b.amount, 0), [expenses, currentMonthStr]);

  const yearExpense = useMemo(() => expenses
    .filter((e) => e.date.startsWith(currentYearStr))
    .reduce((a, b) => a + b.amount, 0), [expenses, currentYearStr]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  }, [expenses]);

  // Scope totals
  const scopeTotals = useMemo(() => {
    const totals = {
      Casa: 0,
      Pet: 0,
      Empresa: 0,
      'Pagamentos Fixos': 0,
      Geral: 0,
    };
    expenses.forEach((e) => {
      if (e.scope === 'casa') totals.Casa += e.amount;
      else if (e.scope === 'pet') totals.Pet += e.amount;
      else if (e.scope === 'empresa') totals.Empresa += e.amount;
      else if (e.scope === 'pagamentos') totals['Pagamentos Fixos'] += e.amount;
      else if (e.scope === 'geral') totals.Geral += e.amount;
    });
    return totals;
  }, [expenses]);

  const scopeChartData = useMemo(() => Object.keys(scopeTotals).map((sc) => ({
    name: sc,
    Valor: scopeTotals[sc as keyof typeof scopeTotals],
  })), [scopeTotals]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);
  const [isBudgetHealthExpanded, setIsBudgetHealthExpanded] = useState(false);
  const [isBudgetTableExpanded, setIsBudgetTableExpanded] = useState(false);
  const [isExtratoExpanded, setIsExtratoExpanded] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [scopeFilter, setScopeFilter] = useState<'todos' | 'casa' | 'pet' | 'empresa' | 'pagamentos' | 'geral'>('todos');
  const [visibleCount, setVisibleCount] = useState(25);

  const filteredTransactions = useMemo(() => transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || t.type === typeFilter;
    const matchesScope = scopeFilter === 'todos' || t.scope === scopeFilter;
    return matchesSearch && matchesType && matchesScope;
  }), [transactions, searchTerm, typeFilter, scopeFilter]);

  const sortedTransactions = useMemo(() => [...filteredTransactions].sort((a, b) => {
    return (b.date || "").localeCompare(a.date || "");
  }), [filteredTransactions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#161618] border border-white/10 hover:border-emerald-500/30 rounded-3xl p-6 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shrink-0">
            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-light text-white flex items-center gap-2">
              Relatórios
            </h2>
            <p className="text-xs text-white/40 italic mt-0.5">
              Visão analítica do teto orçamentário e divisão por áreas estratégicas
            </p>
          </div>
        </div>

        <div className="bg-[#1A1A1C] px-5 py-2.5 rounded-2xl border border-white/10 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">Gasto do Mês</div>
          <div className="text-xl font-medium text-rose-400">{formatBRL(monthExpense)}</div>
          <div className="text-[11px] text-white/50 pt-1 mt-1 border-t border-white/5">
            Acumulado no ano: <span className="text-white font-medium">{formatBRL(yearExpense)}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fadeIn">

          {/* Collapsible Section Container Helper */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <div 
              onClick={() => setIsScopeExpanded(!isScopeExpanded)}
              className="flex items-center justify-between cursor-pointer mb-4"
            >
              <h3 className="text-xs uppercase tracking-wider font-medium text-white/50">
                Gastos por Área (Casa, Pet, Empresa, Outros)
              </h3>
              {isScopeExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </div>
            {isScopeExpanded && (
              <div className="h-60 w-full animate-fadeIn">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scopeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262628" />
                    <XAxis dataKey="name" stroke="#66666e" fontSize={11} />
                    <YAxis stroke="#66666e" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161618', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
                      formatter={(val: number) => [formatBRL(val)]}
                    />
                    <Bar dataKey="Valor" fill="#10b981" radius={[6, 6, 0, 0]}>
                      <LabelList
                        dataKey="Valor"
                        position="inside"
                        angle={-90}
                        fill="#ffffff"
                        fontSize={10}
                        fontWeight={600}
                        formatter={(val: number) => (val > 0 ? formatBRL(val) : '')}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <div 
              onClick={() => setIsBudgetHealthExpanded(!isBudgetHealthExpanded)}
              className="flex items-center justify-between cursor-pointer mb-4"
            >
              <h3 className="text-xs uppercase tracking-wider font-medium text-white/50">Saúde do Orçamento Mensal</h3>
              {isBudgetHealthExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </div>
            {isBudgetHealthExpanded && (
              <div className="space-y-4 animate-fadeIn">
                {budgets.slice(0, 5).map((b) => {
                  const spent = categoryTotals[b.category] || 0;
                  const percentage = b.allocated > 0 ? Math.min(Math.round((spent / b.allocated) * 100), 100) : 0;
                  const isOver = spent > b.allocated;

                  return (
                    <div key={b.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-normal text-white">{b.category}</span>
                        <span className="text-white/40">
                          <strong className={isOver ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                            {formatBRL(spent)}
                          </strong>{' '}
                          / {formatBRL(b.allocated)}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-[#1A1A1C] rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all ${
                            isOver ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        
        {/* Budget Table Detailed */}
        <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
          <div 
            onClick={() => setIsBudgetTableExpanded(!isBudgetTableExpanded)}
            className="flex items-center justify-between cursor-pointer mb-4"
          >
            <h3 className="text-xs uppercase tracking-wider font-medium text-white/50">
              Detalhamento Teto Orçamentário
            </h3>
            <div className="flex items-center gap-3">
              {isBudgetTableExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </div>
          </div>
          {isBudgetTableExpanded && (
            <div className="overflow-x-auto animate-fadeIn">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Orçamento Previsto</th>
                    <th className="py-3 px-4">Gasto Realizado</th>
                    <th className="py-3 px-4">Saldo Disponível</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {budgets.map((b) => {
                    const spent = categoryTotals[b.category] || 0;
                    const diff = b.allocated - spent;
                    const isOver = spent > b.allocated;

                    return (
                      <tr key={b.category} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4 font-normal text-white">{b.category}</td>
                        <td className="py-3.5 px-4 text-white/60">{formatBRL(b.allocated)}</td>
                        <td className="py-3.5 px-4 font-light text-white">{formatBRL(spent)}</td>
                        <td className={`py-3.5 px-4 font-light ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatBRL(diff)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isOver ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Excedeu Limite
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Dentro do Teto
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Extrato Geral de Lançamentos */}
        <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 space-y-6">
          <div 
            onClick={() => setIsExtratoExpanded(!isExtratoExpanded)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Extrato Geral de Lançamentos
              </h3>
              <p className="text-xs text-white/40 italic mt-0.5">
                Busque, filtre, edite e exclua qualquer despesa ou receita registrada no aplicativo
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isExtratoExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </div>
          </div>

          {isExtratoExpanded && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filters and Search controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1A1A1C] border border-white/5 rounded-2xl p-4">
                {/* Search bar */}
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-white/30">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por descrição ou categoria..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setVisibleCount(25);
                    }}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 shrink-0">Tipo:</span>
                  <div className="flex items-center gap-1 w-full bg-[#121214] border border-white/10 rounded-xl p-1">
                    {(['todos', 'receita', 'despesa'] as const).map((tp) => (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => {
                          setTypeFilter(tp);
                          setVisibleCount(25);
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg capitalize transition ${
                          typeFilter === tp
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {tp === 'todos' ? 'Todos' : tp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 shrink-0">Escopo:</span>
                  <select
                    value={scopeFilter}
                    onChange={(e) => {
                      setScopeFilter(e.target.value as any);
                      setVisibleCount(25);
                    }}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 capitalize font-medium"
                  >
                    <option value="todos">Todos Escopos</option>
                    <option value="casa">Casa</option>
                    <option value="pet">Pet</option>
                    <option value="empresa">Empresa</option>
                    <option value="pagamentos">Pagamentos</option>
                    <option value="geral">Geral</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table/List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] font-medium text-white/40 uppercase tracking-wider">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Escopo</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Pagamento</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {sortedTransactions.slice(0, visibleCount).map((t) => {
                      const isExpense = t.type === 'despesa';

                      return (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4 text-white/60 font-mono whitespace-nowrap">
                            {formatDateBR(t.date)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-white max-w-[200px] truncate" title={t.description}>
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{t.description}</span>
                              {t.installment && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/15 text-purple-300 rounded font-mono font-bold shrink-0">
                                  {t.installment.current}/{t.installment.total}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/70">
                              {t.scope}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-white/60">{t.category}</td>
                          <td className="py-3.5 px-4 text-white/50">{t.paymentMethod}</td>
                          <td className={`py-3.5 px-4 text-right font-bold ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isExpense ? '-' : '+'}{formatBRL(t.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {onEditTransaction && (
                                <button
                                  type="button"
                                  onClick={() => onEditTransaction(t)}
                                  className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-amber-400 transition"
                                  title="Editar lançamento"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteTransaction && (
                                deletingTxId === t.id ? (
                                  <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-lg p-1 animate-fadeIn">
                                    <span className="text-[10px] text-rose-300 font-semibold px-0.5">Excluir?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteTransaction(t.id);
                                        setDeletingTxId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded transition"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingTxId(null)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] rounded transition"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingTxId(t.id)}
                                    className="p-2 hover:bg-rose-500/10 rounded-xl text-white/40 hover:text-rose-400 transition"
                                    title="Excluir lançamento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-white/30 italic">
                          Nenhum lançamento encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              {sortedTransactions.length > visibleCount && (
                <div className="flex justify-center pt-4 border-t border-white/5 mt-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 25)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-full transition border border-white/10"
                  >
                    Carregar Mais Lançamentos ({sortedTransactions.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
});
