import React, { useState, memo, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Home,
  Car,
  CalendarCheck2,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Receipt,
  PieChart as PieChartIcon,
  Calculator,
  Pencil,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  RefreshCw,
  CreditCard,
  Search,
  Filter,
  X,
  Clock,
  PiggyBank,
  History,
  Tag,
  BarChart3,
  Sparkles,
  Dog,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Transaction, Bill, HomeTask, CategoryScope, TransactionCategory, TransactionType, CreditCard as CreditCardType } from '../types';
import { formatBRL, formatDateBR } from '../lib/storage';
import { BankLogo } from './BankLogo';
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

interface DashboardProps {
  transactions: Transaction[];
  bills: Bill[];
  vehicleServices?: any[];
  homeTasks: HomeTask[];
  creditCards?: CreditCardType[];
  onPayBill: (billId: string) => void;
  onOpenNewTransaction: (scope?: CategoryScope, category?: TransactionCategory, type?: TransactionType) => void;
  onOpenNewBill: () => void;
  onOpenCalculators?: () => void;
  onOpenCreditCardsManage?: () => void;
  setActiveTab: (tab: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onEditBill?: (bill: Bill) => void;
  onUpdateHomeTask?: (task: HomeTask) => void;
  onUpdateService?: (service: any) => void;
  onConsolidateData?: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = memo(({
  transactions = [],
  bills = [],
  vehicleServices = [],
  homeTasks = [],
  creditCards = [],
  onPayBill,
  onOpenNewTransaction,
  onOpenNewBill,
  onOpenCalculators,
  onOpenCreditCardsManage,
  setActiveTab,
  onEditTransaction,
  onEditBill,
  onUpdateHomeTask,
  onUpdateService,
  onConsolidateData,
}) => {
  // Current month calculation using local time to avoid timezone offsets shifting months
  const nowLocal = new Date();
  const currentMonth = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}`;

  const monthTransactions = useMemo(() => transactions.filter((t) => t.date.startsWith(currentMonth)), [transactions, currentMonth]);
  
  const monthIncome = useMemo(() => monthTransactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0), [monthTransactions]);

  const monthExpense = useMemo(() => monthTransactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0), [monthTransactions]);

  const totalIncomeAllTime = useMemo(() => transactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0), [transactions]);

  const totalExpenseAllTime = useMemo(() => transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0), [transactions]);

  const currentBalance = useMemo(() => totalIncomeAllTime - totalExpenseAllTime, [totalIncomeAllTime, totalExpenseAllTime]);

  // Savings rate calculation
  const netSavingsMonth = useMemo(() => monthIncome - monthExpense, [monthIncome, monthExpense]);
  const savingsRateMonth = useMemo(() => {
    if (monthIncome <= 0) return 0;
    const rate = Math.round((netSavingsMonth / monthIncome) * 100);
    return rate > 100 ? 100 : rate;
  }, [monthIncome, netSavingsMonth]);

  // Scope & Annual breakdown
  const currentYearStr = new Date().getFullYear().toString();
  
  const yearIncome = useMemo(() => transactions
    .filter((t) => t.type === 'receita' && t.date.startsWith(currentYearStr))
    .reduce((acc, t) => acc + t.amount, 0), [transactions, currentYearStr]);

  const yearExpense = useMemo(() => transactions
    .filter((t) => t.type === 'despesa' && t.date.startsWith(currentYearStr))
    .reduce((acc, t) => acc + t.amount, 0), [transactions, currentYearStr]);

  const yearBalanceAccumulated = useMemo(() => yearIncome - yearExpense, [yearIncome, yearExpense]);

  const scopeExpenses = useMemo(() => ({
    casa: monthTransactions.filter((t) => t.type === 'despesa' && t.scope === 'casa').reduce((a, b) => a + b.amount, 0),
    pet: monthTransactions.filter((t) => t.type === 'despesa' && t.scope === 'pet').reduce((a, b) => a + b.amount, 0),
    empresa: monthTransactions.filter((t) => t.type === 'despesa' && t.scope === 'empresa').reduce((a, b) => a + b.amount, 0),
    pagamentos: monthTransactions.filter((t) => t.type === 'despesa' && t.scope === 'pagamentos').reduce((a, b) => a + b.amount, 0),
    geral: monthTransactions.filter((t) => t.type === 'despesa' && t.scope === 'geral').reduce((a, b) => a + b.amount, 0),
  }), [monthTransactions]);

  // Recent transactions list (last 5)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);
  }, [transactions]);

  // Category Donut Data
  const categoryChartData = useMemo(() => {
    const map: { [key: string]: number } = {};
    monthTransactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.keys(map).map((cat) => ({
      name: cat,
      value: map[cat],
    }));
  }, [monthTransactions]);

  // Bar Chart Data (Last 5 Months Calculated dynamically from actual transactions)
  const monthlyComparison = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(nowLocal.getFullYear(), nowLocal.getMonth() - 4 + i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const name = monthNames[d.getMonth()];
    
    const mTrans = transactions.filter((t) => t.date.startsWith(monthStr));
    const income = mTrans.filter((t) => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const expense = mTrans.filter((t) => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name,
      Receita: income,
      Despesa: expense
    };
  });

  // Upcoming maintenance or tasks alert
  const scheduledCarServices = (vehicleServices || []).filter((s) => s.status === 'agendado' || s.status === 'atencao');

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Visão Geral Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#161618] border border-white/10 hover:border-emerald-500/30 rounded-3xl p-6 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shrink-0">
            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-light text-white tracking-tight flex items-center gap-2">
              Visão Geral do Ecossistema
            </h2>
            <p className="text-xs text-white/40 italic mt-0.5">
              Painel analítico de receitas, despesas, âmbitos e patrimônio
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onConsolidateData && (
            <button
              onClick={onConsolidateData}
              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-2xl transition-all border border-emerald-500/20 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              title="Consolidar Dados e Fazer Varredura"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Consolidar Dados</span>
              <span className="sm:hidden">Consolidar</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fadeIn">

      {/* GRADE 3x3 DE TÓPICOS DA VISÃO GERAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* 1. Saldo Consolidado */}
        <div
          onClick={() => setActiveTab('relatorios')}
          className="bg-[#161618] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.02] rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Saldo Consolidado
              </span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-light text-white tracking-tight">
              {formatBRL(currentBalance)}
            </div>
            <div className="text-[11px] text-white/40 mt-1 font-light">
              Saldo livre acumulado
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              Acumulado no ano: {formatBRL(yearBalanceAccumulated)}
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 italic flex items-center justify-between">
            <span>Balanço livre em conta</span>
          </p>
        </div>

        {/* 2. Receitas Mensais */}
        <div
          onClick={() => setActiveTab('relatorios')}
          className="bg-[#161618] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.02] rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Receitas do Mês
              </span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-light text-emerald-400 tracking-tight">
              {formatBRL(monthIncome)}
            </div>
            <div className="text-[11px] text-white/40 mt-1 font-light">
              Entradas no mês atual
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              Acumulado no ano: {formatBRL(yearIncome)}
            </div>
          </div>
          
          <p className="text-xs text-white/40 mt-3 italic flex items-center justify-between">
            <span>Total de receitas registradas</span>
          </p>
        </div>

        {/* 3. Despesas Mensais */}
        <div
          onClick={() => setActiveTab('relatorios')}
          className="bg-[#161618] border border-white/5 hover:border-rose-500/30 hover:bg-white/[0.02] rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                Despesas do Mês
              </span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-light text-rose-400 tracking-tight">
              {formatBRL(monthExpense)}
            </div>
            <div className="text-[11px] text-white/40 mt-1 font-light">
              Saídas no mês atual
            </div>
            <div className="text-xs text-rose-400/90 font-medium mt-1">
              Acumulado no ano: {formatBRL(yearExpense)}
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 italic">
            Saídas acumuladas
          </p>
        </div>

        {/* 4. Taxa de Poupança & Economia (Novo Card) */}
        <div
          onClick={() => setActiveTab('relatorios')}
          className="bg-[#161618] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-blue-400" />
                Taxa de Economia
              </span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-light text-blue-400 tracking-tight flex items-baseline gap-2">
              <span>{savingsRateMonth}%</span>
              <span className="text-xs text-white/40 font-normal">guardados</span>
            </div>
            <div className="text-[11px] text-white/40 mt-1 font-light">
              Sobra do mês: <span className={netSavingsMonth >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{formatBRL(netSavingsMonth)}</span>
            </div>
            <div className="text-xs text-blue-300 font-medium mt-1">
              Meta recomendada: 20% das receitas
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 italic">
            {savingsRateMonth >= 20 ? 'Excelente margem de poupança!' : 'Monitore seus gastos fixos'}
          </p>
        </div>

        {/* 5. Relatórios & Analytics */}
        <div
          onClick={() => setActiveTab('relatorios')}
          className="bg-[#161618] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.02] rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                Relatórios & Orçamento
              </span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-light text-white tracking-tight">
              {formatBRL(monthExpense)}
            </div>
            <div className="text-[11px] text-white/40 mt-1 font-light">
              Realizado no mês atual
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              Acumulado no ano: {formatBRL(yearExpense)}
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 italic">
            Saúde financeira e limites
          </p>
        </div>

        {/* 6. Calculadoras Utilitárias */}
        <div
          onClick={() => onOpenCalculators && onOpenCalculators()}
          className="bg-[#161618] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.02] rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Calculadoras Utilitárias
              </span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-light text-white tracking-tight">
              Utilitários
            </div>
            <div className="text-[11px] text-white/40 mt-1 font-light">
              Ferramentas de decisão
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              Acumulado no ano: Simulação ativa
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 italic">
            Etanol vs Gasolina & Reserva
          </p>
        </div>
      </div>

      {/* Main Content: Charts & Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column (2 Cols): Charts & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bar Chart: Receita x Despesa Mês a Mês */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <h2 className="text-xs uppercase tracking-wider text-white/50 mb-1">
              Evolução do Balanço
            </h2>
            <p className="text-xs text-white/40 italic mb-6">
              Comparativo consolidado de Receitas e Despesas
            </p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262628" />
                  <XAxis dataKey="name" stroke="#66666e" fontSize={12} />
                  <YAxis stroke="#66666e" fontSize={12} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161618', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
                    formatter={(val: number) => [formatBRL(val)]}
                  />
                  <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="Receita"
                      position="inside"
                      angle={-90}
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(val: number) => (val > 0 ? formatBRL(val) : '')}
                    />
                  </Bar>
                  <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="Despesa"
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
          </div>

          {/* NOVO WIDGET: Últimas Movimentações */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  Últimas Movimentações Registradas
                </h2>
                <p className="text-xs text-white/40 italic mt-0.5">
                  Lançamentos recentes no seu livro caixa
                </p>
              </div>
              <button
                onClick={() => setActiveTab('relatorios')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Ver Extrato Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-xs italic border border-dashed border-white/10 rounded-2xl">
                Nenhuma movimentação cadastrada até o momento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'receita';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => onEditTransaction && onEditTransaction(tx)}
                      className="p-3.5 bg-[#1A1A1C] border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{tx.description}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5 overflow-hidden whitespace-nowrap text-ellipsis">
                            <span className="shrink-0">{formatDateBR(tx.date)}</span>
                            <span className="shrink-0">•</span>
                            <span className="bg-white/5 text-white/60 px-1.5 py-0.5 rounded uppercase shrink-0">
                              {tx.scope || 'geral'}
                            </span>
                            <span className="shrink-0">•</span>
                            <span className="text-white/50 truncate">{tx.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-bold ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatBRL(tx.amount)}
                        </div>
                        <div className="text-[10px] text-white/30 italic">{tx.paymentMethod || 'PIX'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1 Col): Scope Breakdown, Category Donut & Maintenance */}
        <div className="space-y-6">

          {/* NOVO WIDGET: Gastos por Âmbito (Casa, Pet, Empresa, Pagamentos, Geral) */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <h2 className="text-xs uppercase tracking-wider text-white/50 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Gastos do Mês por Âmbito
            </h2>
            <p className="text-xs text-white/40 italic mb-4">
              Divisão entre Casa, Pet, Empresa e Geral
            </p>

            <div className="space-y-3">
              {[
                { name: 'Casa', amount: scopeExpenses.casa, icon: Home, color: 'bg-emerald-500' },
                { name: 'Pet', amount: scopeExpenses.pet, icon: Dog, color: 'bg-amber-500' },
                { name: 'Empresa', amount: scopeExpenses.empresa, icon: Briefcase, color: 'bg-blue-500' },
                { name: 'Pagamentos', amount: scopeExpenses.pagamentos, icon: Receipt, color: 'bg-purple-500' },
                { name: 'Geral', amount: scopeExpenses.geral, icon: Tag, color: 'bg-slate-400' },
              ].map((scope) => {
                const percent = monthExpense > 0 ? Math.round((scope.amount / monthExpense) * 100) : 0;
                const IconComp = scope.icon;
                return (
                  <div key={scope.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 flex items-center gap-1.5 font-medium">
                        <IconComp className="w-3.5 h-3.5 text-white/40" />
                        {scope.name}
                      </span>
                      <span className="text-white font-mono font-semibold">
                        {formatBRL(scope.amount)} <span className="text-white/40 text-[10px]">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${scope.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown Donut */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <h2 className="text-xs uppercase tracking-wider text-white/50 mb-1">
              Gastos por Categoria
            </h2>
            <p className="text-xs text-white/40 italic mb-4">
              Distribuição percentual deste mês
            </p>

            {categoryChartData.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-xs italic">
                Nenhum gasto registrado este mês.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161618', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
                      formatter={(val: number) => [formatBRL(val)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Legend */}
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
              {categoryChartData.map((cat, i) => (
                <div 
                  key={cat.name} 
                  className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                  onClick={() => setActiveTab('relatorios')}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-white/70 truncate max-w-[120px]">{cat.name}</span>
                  </div>
                  <span className="font-light text-white">{formatBRL(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Cards Widget */}
          {onOpenCreditCardsManage && (
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  Cartões de Crédito
                </h2>
                <button
                  onClick={onOpenCreditCardsManage}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  Gerenciar
                </button>
              </div>

              {creditCards.length === 0 ? (
                <div 
                  onClick={onOpenCreditCardsManage}
                  className="p-4 bg-white/5 border border-white/5 border-dashed rounded-2xl text-center cursor-pointer hover:border-purple-500/30 transition"
                >
                  <p className="text-xs text-white/50">Nenhum cartão cadastrado.</p>
                  <p className="text-[11px] text-purple-400 font-bold mt-1">+ Cadastrar Meus Cartões</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {creditCards.map((card) => (
                    <div 
                      key={card.id}
                      onClick={onOpenCreditCardsManage}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <BankLogo name={card.name} customLogo={card.customLogo} className="w-8 h-8 rounded-lg" />
                        <div>
                          <div className="text-xs font-bold text-white">{card.name || 'Cartão'}</div>
                          <div className="text-[10px] text-slate-400">Melhor dia: {card.bestDay}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                        Dia {card.bestDay}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Maintenance & Checklist Box */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                Avisos & Manutenções
              </h2>
            </div>

            <div className="space-y-3">
              {scheduledCarServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setActiveTab('contas')}
                  className="p-3.5 bg-[#1A1A1C] border border-white/5 rounded-2xl cursor-pointer hover:border-emerald-500/30 transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Car className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{service.title}</span>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">{formatBRL(service.cost)}</span>
                  </div>

                  <p className="text-xs text-white/80 font-light">
                    Previsão:{' '}
                    {service.nextKmDue ? `${service.nextKmDue.toLocaleString()} KM` : ''}
                    {service.nextKmDue && service.nextDateDue ? ' • ' : ''}
                    {service.nextDateDue ? formatDateBR(service.nextDateDue) : (!service.nextKmDue ? formatDateBR(service.date) : '')}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[10px] text-white/40 italic">EV • {service.type}</span>
                    {onUpdateService && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateService({
                            ...service,
                            status: 'concluido',
                            completed: true,
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Marcar como Feita</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
});

