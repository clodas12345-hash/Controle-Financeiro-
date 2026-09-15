import React, { useState, useEffect, memo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Home,
  Car,
  Filter,
  CreditCard,
  Building,
  QrCode,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Camera,
  CalendarClock,
  CopyX
} from 'lucide-react';
import { Bill, CategoryScope, Transaction, TransactionCategory, PaymentMethod, isVariableBill } from '../types';
import { formatBRL, formatDateBR, getDueDateBusinessInfo, getEffectiveDueDate } from '../lib/storage';

interface BillsModuleProps {
  bills: Bill[];
  transactions?: Transaction[];
  onPayBill: (billId: string) => void;
  onDeleteBill: (billId: string) => void;
  onOpenNewBillModal: () => void;
  onEditBill?: (bill: Bill) => void;
  onUpdateBill?: (bill: Bill) => void;
  onCopyBills?: (newBills: Bill[]) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onDeleteDuplicateBills?: () => void;
  onImportMasterBills?: () => void;
  onSyncMonthlyBills?: (targetMonthStr?: string) => number;
}

export const BillsModule: React.FC<BillsModuleProps> = memo(({
  bills = [],
  transactions = [],
  onPayBill,
  onDeleteBill,
  onOpenNewBillModal,
  onEditBill,
  onUpdateBill,
  onCopyBills,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  onDeleteDuplicateBills,
  onImportMasterBills,
  onSyncMonthlyBills,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'pago' | 'atrasado' | 'meses_seguintes'>('todos');
  const [scopeFilter, setScopeFilter] = useState<'todos' | CategoryScope>('todos');
  const [paymentFilter, setPaymentFilter] = useState<'com_pagamento' | 'sem_pagamento' | 'todos'>('com_pagamento');
  const [viewType, setViewType] = useState<'todos' | 'faturas' | 'despesas'>('todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setDeletingId(null);
    };
    if (deletingId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [deletingId]);
  const [expandedBarcodeId, setExpandedBarcodeId] = useState<string | null>(null);

  // Copiar Contas Mensais states and helpers
  const [isCopySectionOpen, setIsCopySectionOpen] = useState(false);
  const [bankModalItem, setBankModalItem] = useState<{ isOpen: boolean, isPix: boolean, item?: any, isPaid?: boolean }>({ isOpen: false, isPix: false });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [viewMonthStr, setViewMonthStr] = useState<string>(currentMonthStr);

  // Generate the upcoming 6 months forward from the current month (e.g. Outubro 2026, Novembro 2026, etc.)
  const upcomingMonths = React.useMemo(() => {
    const list: string[] = [];
    const [currY, currM] = currentMonthStr.split('-').map(Number);
    for (let i = 1; i <= 6; i++) {
      const d = new Date(currY, currM - 1 + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      list.push(`${y}-${m}`);
    }
    return list;
  }, [currentMonthStr]);

  const allMonthsSet = new Set<string>();
  allMonthsSet.add(currentMonthStr);
  upcomingMonths.forEach((m) => allMonthsSet.add(m));
  bills.forEach((b) => { if (b.dueDate && b.dueDate.length >= 7) allMonthsSet.add(b.dueDate.slice(0, 7)); });
  if (transactions) {
    transactions.forEach((t) => { if (t.date && t.date.length >= 7) allMonthsSet.add(t.date.slice(0, 7)); });
  }
  const allRecordedMonths = Array.from(allMonthsSet).sort();

  const handleShiftMonth = (direction: -1 | 1) => {
    if (viewMonthStr === 'todos') {
      setViewMonthStr(currentMonthStr);
      return;
    }
    try {
      const [year, month] = viewMonthStr.split('-').map(Number);
      const targetDate = new Date(year, month - 1 + direction, 1);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      setViewMonthStr(`${y}-${m}`);
    } catch {
      setViewMonthStr(currentMonthStr);
    }
  };
  
  const recurringBills = bills.filter((b) => b.recurring !== 'unico');
  const uniqueMonths: string[] = Array.from(new Set(recurringBills.map((b) => b.dueDate.slice(0, 7)))).sort().reverse() as string[];
  const initialSourceMonth = uniqueMonths.length > 0 ? uniqueMonths[0] : currentMonthStr;

  const [selectedSourceMonth, setSelectedSourceMonth] = useState(initialSourceMonth);
  const [selectedTargetMonth, setSelectedTargetMonth] = useState('');

  const getNextSixMonths = (monthStr: string) => {
    try {
      const parts = monthStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (isNaN(year) || isNaN(month)) {
        const today = new Date();
        return Array.from({ length: 6 }, (_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() + 1 + i, 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        });
      }
      const list = [];
      for (let i = 1; i <= 6; i++) {
        const d = new Date(year, month - 1 + i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        list.push(`${y}-${m}`);
      }
      return list;
    } catch {
      return [];
    }
  };

  const targetOptions = getNextSixMonths(selectedSourceMonth);
  const activeTargetMonth = selectedTargetMonth && targetOptions.includes(selectedTargetMonth)
    ? selectedTargetMonth
    : targetOptions[0] || '';

  const formatMonthName = (yearMonth: string) => {
    if (!yearMonth) return '';
    try {
      const [year, month] = yearMonth.split('-');
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const monthIdx = parseInt(month, 10) - 1;
      if (monthIdx < 0 || monthIdx > 11 || isNaN(monthIdx)) return yearMonth;
      return `${months[monthIdx]} de ${year}`;
    } catch {
      return yearMonth;
    }
  };

  const shiftMonth = (dateStr: string, monthsToShift: number): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
      const targetMonthIndex = month - 1 + monthsToShift;
      const targetDate = new Date(year, targetMonthIndex, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(day, maxDays);
      const y = targetYear;
      const m = String(targetMonth + 1).padStart(2, '0');
      const d = String(targetDay).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return dateStr;
    }
  };

  const handleExecuteCopy = () => {
    if (!onCopyBills) return;
    if (!selectedSourceMonth || !activeTargetMonth) return;

    const sourceBills = bills.filter(
      (b) => b.recurring !== 'unico' && b.dueDate.startsWith(selectedSourceMonth)
    );

    if (sourceBills.length === 0) {
      alert(`Nenhuma conta recorrente foi encontrada em ${formatMonthName(selectedSourceMonth)}.`);
      return;
    }

    try {
      const [srcY, srcM] = selectedSourceMonth.split('-').map(Number);
      const [tgtY, tgtM] = activeTargetMonth.split('-').map(Number);
      const monthsDiff = (tgtY - srcY) * 12 + (tgtM - srcM);

      const copied = sourceBills.map((b, index) => {
        let newDueDate = shiftMonth(b.dueDate, monthsDiff);
        
        // Se a recorrência for anual, só deve copiar se for para o mesmo mês no ano seguinte, mas 
        // para simplificar e seguir o comportamento esperado de apenas manter para os próximos meses
        // vamos ajustar a data usando a lógica atual, que apenas incrementa meses.
        if (b.recurring === 'anual') {
          // Ajusta a data para o próximo ano se monthsDiff >= 12 ou algo assim, mas como a ferramenta é "Copiar para o mês",
          // vamos apenas jogar a data pro mês selecionado, mantendo a flexibilidade do usuário.
        }

        const newBill: Bill = {
          ...b,
          id: `bill_copy_${Date.now()}_${index}`,
          dueDate: newDueDate,
          status: 'pendente' as const,
          paidDate: undefined,
        };
        return newBill;
      });

      const existingInTarget = bills.filter((b) => b.dueDate.startsWith(activeTargetMonth));
      const duplicates = copied.filter((cb) =>
        existingInTarget.some((eb) => eb.title.toLowerCase() === cb.title.toLowerCase())
      );

      let confirmMsg = `Deseja copiar ${sourceBills.length} conta(s) recorrente(s) de ${formatMonthName(selectedSourceMonth)} para ${formatMonthName(activeTargetMonth)}?\n\n`;
      if (duplicates.length > 0) {
        confirmMsg += `Atenção: Já existem contas em ${formatMonthName(activeTargetMonth)} com os mesmos títulos:\n`;
        duplicates.forEach((d) => { confirmMsg += `- ${d.title}\n`; });
        confirmMsg += `\nDeseja duplicá-las mesmo assim?`;
      }

      if (window.confirm(confirmMsg)) {
        onCopyBills(copied);
        alert(`${copied.length} conta(s) copiada(s) com sucesso para ${formatMonthName(activeTargetMonth)}!`);
        setIsCopySectionOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao copiar as contas.');
    }
  };

  // Formato unificado de itens para listar (Faturas + Lançamentos)
  interface UnifiedItem {
    isTransaction: boolean;
    id: string;
    title: string;
    amount: number;
    dueDate: string; // data do vencimento ou do lançamento
    category: TransactionCategory;
    scope: CategoryScope;
    paymentMethod: PaymentMethod;
    status: 'pendente' | 'pago' | 'atrasado';
    recurring?: string;
    notes?: string;
    excludeFromTotals?: boolean;
    installment?: { current: number; total: number };
    includeInCarDaily?: boolean;
    original: Bill | Transaction;
  }

  const unifiedItems: UnifiedItem[] = [];

  // Adicionar Faturas se o filtro de tipo permitir
  if (viewType === 'todos' || viewType === 'faturas') {
    bills.forEach((b) => {
      unifiedItems.push({
        isTransaction: false,
        id: b.id,
        title: b.title,
        amount: b.amount,
        dueDate: b.dueDate,
        category: b.category,
        scope: b.scope,
        paymentMethod: b.paymentMethod,
        status: b.status,
        recurring: b.recurring,
        notes: b.notes,
        excludeFromTotals: b.excludeFromTotals,
        installment: b.installment,
        includeInCarDaily: b.includeInCarDaily,
        original: b,
      });
    });
  }

  // Adicionar Lançamentos/Despesas Diárias de Casa se o filtro permitir
  if ((viewType === 'todos' || viewType === 'despesas') && transactions) {
    transactions
      .filter((t) => t.type === 'despesa' && t.scope === 'casa' && !t.id.startsWith('tx_auto_bill_'))
      .forEach((t) => {
        unifiedItems.push({
          isTransaction: true,
          id: t.id,
          title: t.description,
          amount: t.amount,
          dueDate: t.date,
          category: t.category,
          scope: t.scope,
          paymentMethod: t.paymentMethod,
          status: t.paid ? 'pago' : 'pendente',
          recurring: t.recurring ? 'Recorrente' : 'Único',
          notes: t.notes,
          excludeFromTotals: false,
          original: t,
        });
      });
  }

  const filteredItems = unifiedItems.filter((item) => {
    const itemMonth = (item.dueDate || '').slice(0, 7);
    if (viewMonthStr !== 'todos' && itemMonth !== viewMonthStr) {
      return false;
    }
    if (statusFilter === 'meses_seguintes') {
      if ((item.dueDate || '').slice(0, 7) <= currentMonthStr) return false;
    } else if (statusFilter === 'todos') {
      if (item.status === 'pago') return false;
    } else if (statusFilter !== 'todos' && item.status !== statusFilter) {
      return false;
    }
    if (scopeFilter !== 'todos' && item.scope !== scopeFilter) return false;
    if (paymentFilter === 'com_pagamento' && item.paymentMethod === 'SEM PAGAMENTO') return false;
    if (paymentFilter === 'sem_pagamento' && item.paymentMethod !== 'SEM PAGAMENTO') return false;
    return true;
  });

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const sortedItems = [...filteredItems].sort((a, b) => {
    const getStatusPriority = (item: any) => {
      let status = item.status;
      if (item.isTransaction && status === 'pendente' && getEffectiveDueDate(item.dueDate) < todayStr) {
        status = 'atrasado';
      }
      if (status === 'atrasado') return 0;
      if (status === 'pendente') return 1;
      return 2; // pago
    };

    const priorityA = getStatusPriority(a);
    const priorityB = getStatusPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (a.dueDate || "").localeCompare(b.dueDate || "");
  });

  const currentYearStr = `${now.getFullYear()}`;

  const monthPending = bills
    .filter((b) => (b.status === 'pendente' || b.status === 'atrasado') && b.paymentMethod !== 'SEM PAGAMENTO' && b.dueDate.startsWith(currentMonthStr))
    .reduce((acc, b) => acc + b.amount, 0);

  const yearPending = bills
    .filter((b) => (b.status === 'pendente' || b.status === 'atrasado') && b.paymentMethod !== 'SEM PAGAMENTO' && b.dueDate.startsWith(currentYearStr))
    .reduce((acc, b) => acc + b.amount, 0);

  const monthPaid = bills
    .filter((b) => b.status === 'pago' && b.dueDate.startsWith(currentMonthStr))
    .reduce((acc, b) => acc + b.amount, 0);

  const yearPaid = bills
    .filter((b) => b.status === 'pago' && b.dueDate.startsWith(currentYearStr))
    .reduce((acc, b) => acc + b.amount, 0);

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Summary Banner */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#161618] border border-white/10 hover:border-amber-500/30 rounded-3xl p-6 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 shrink-0">
            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-light text-white flex items-center gap-2">
              Contas
            </h2>
            <p className="text-xs text-white/40 italic mt-0.5">
              Agenda de obrigações financeiras, faturas fixas & liquidação de boletos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#1A1A1C] px-5 py-2.5 rounded-2xl border border-white/10 text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">A Pagar no Mês</div>
            <div className="text-xl font-medium text-amber-400">{formatBRL(monthPending)}</div>
            <div className="text-[11px] text-white/50 pt-1 mt-1 border-t border-white/5">
              Acumulado no ano: <span className="text-white font-medium">{formatBRL(yearPending)}</span>
            </div>
          </div>

          <div className="bg-[#1A1A1C] px-5 py-2.5 rounded-2xl border border-white/10 text-right hidden sm:block">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Quitados no Mês</div>
            <div className="text-xl font-medium text-emerald-400">{formatBRL(monthPaid)}</div>
            <div className="text-[11px] text-white/50 pt-1 mt-1 border-t border-white/5">
              Acumulado no ano: <span className="text-white font-medium">{formatBRL(yearPaid)}</span>
            </div>
          </div>

          <button
            onClick={() => onOpenNewBillModal()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-2 cursor-pointer"
            title="Adicionar Manualmente"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Conta</span>
          </button>
          <button
            onClick={() => onOpenNewBillModal()}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-2xl transition-all border border-amber-500/20 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.15)]"
            title="Adicionar Conta com Câmera"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Câmera / Scanner</span>
            <span className="sm:hidden">Câmera / Scanner</span>
          </button>
          {onSyncMonthlyBills && (
            <button
              type="button"
              onClick={() => {
                const targetM = viewMonthStr !== 'todos' ? viewMonthStr : currentMonthStr;
                const count = onSyncMonthlyBills(targetM);
                if (count > 0) {
                  alert(`✅ ${count} conta(s) mensais foram atualizadas/sincronizadas para ${formatMonthName(targetM)}!`);
                } else {
                  alert(`ℹ️ Todas as contas mensais recorrentes já estão sincronizadas para ${formatMonthName(targetM)}.`);
                }
              }}
              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-2xl transition-all border border-emerald-500/20 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              title="Gerar / Atualizar Contas Recorrentes para o Mês Selecionado"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Atualizar Contas Mensais</span>
              <span className="sm:hidden">Atualizar Mensal</span>
            </button>
          )}

          {onDeleteDuplicateBills && (
            <button
              type="button"
              onClick={onDeleteDuplicateBills}
              className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-2xl transition-all border border-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              title="Detectar e remover contas duplicadas neste mês ou em outros"
            >
              <CopyX className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Remover Duplicadas</span>
              <span className="sm:hidden">Limpar Duplicadas</span>
            </button>
          )}

        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fadeIn">
          {/* Month Selector Bar for Archiving & Viewing Specific Months */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Mês Vigente / Arquivo:</span>
              </div>

              {/* Stepper Navigator */}
              <div className="flex items-center gap-1 bg-[#1A1A1C] border border-white/10 rounded-2xl p-0.5">
                <button
                  type="button"
                  onClick={() => handleShiftMonth(-1)}
                  title="Mês Anterior"
                  className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold text-amber-400 min-w-[90px] text-center">
                  {viewMonthStr === 'todos' ? 'Todos' : formatMonthName(viewMonthStr)}
                </span>
                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  title="Próximo Mês"
                  className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Current Month */}
              <button
                type="button"
                onClick={() => setViewMonthStr(currentMonthStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMonthStr === currentMonthStr
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-[#1A1A1C] hover:bg-white/5 text-white/70 border border-white/5'
                }`}
              >
                Mês Atual ({formatMonthName(currentMonthStr)})
              </button>

              {/* Upcoming Months (Próximos Meses) */}
              {upcomingMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMonthStr(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    viewMonthStr === m
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-[#1A1A1C] hover:bg-white/5 text-white/70 border border-white/5'
                  }`}
                >
                  {formatMonthName(m)}
                </button>
              ))}

              {/* Active custom month if not in current/upcoming and not 'todos' */}
              {viewMonthStr !== 'todos' && viewMonthStr !== currentMonthStr && !upcomingMonths.includes(viewMonthStr) && (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-md"
                >
                  {formatMonthName(viewMonthStr)}
                </button>
              )}

              {/* Dropdown for other past/future recorded months */}
              <select
                value={allRecordedMonths.includes(viewMonthStr) ? viewMonthStr : ''}
                onChange={(e) => {
                  if (e.target.value) setViewMonthStr(e.target.value);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#1A1A1C] hover:bg-white/10 text-white/70 border border-white/10 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="" disabled>Outros Meses...</option>
                {allRecordedMonths.map((m) => (
                  <option key={m} value={m} className="bg-[#1A1A1E] text-white">
                    {formatMonthName(m)} {m === currentMonthStr ? '(Atual)' : ''}
                  </option>
                ))}
              </select>

              {/* View All */}
              <button
                type="button"
                onClick={() => setViewMonthStr('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  viewMonthStr === 'todos'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-[#1A1A1C] hover:bg-white/5 text-white/70 border border-white/5'
                }`}
              >
                Ver Todos (Arquivos)
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-4">
        <button
          type="button"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Visualizar</span>
          {isFiltersExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        {isFiltersExpanded && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fadeIn">
            {/* Row 1: View Type Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Visualizar:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewType('todos')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    viewType === 'todos'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'bg-[#1A1A1C] text-white/40 hover:text-white border border-white/5'
                  }`}
                >
                  Tudo Unificado
                </button>
                <button
                  onClick={() => setViewType('faturas')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    viewType === 'faturas'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'bg-[#1A1A1C] text-white/40 hover:text-white border border-white/5'
                  }`}
                >
                  Faturas Agendadas
                </button>
                <button
                  onClick={() => setViewType('despesas')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    viewType === 'despesas'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'bg-[#1A1A1C] text-white/40 hover:text-white border border-white/5'
                  }`}
                >
                  Despesas Lançadas (Casa/Carro)
                </button>
              </div>
            </div>

            {/* Row 2: Status & Scope Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-1 mr-2">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  Status:
                </span>
                {(['todos', 'pendente', 'pago', 'atrasado', 'meses_seguintes'] as const).map((st) => {
                  let label: string = st;
                  if (st === 'todos') label = 'Ativas';
                  if (st === 'pendente') label = 'Pendentes';
                  if (st === 'pago') label = 'Pagas';
                  if (st === 'atrasado') label = 'Atrasadas';
                  if (st === 'meses_seguintes') label = 'Mêses Seguintes';

                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                        statusFilter === st
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-[#1A1A1C] text-white/40 hover:text-white border border-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider mr-1">Escopo:</span>
                {(['todos', 'casa', 'pet', 'pagamentos', 'empresa', 'geral'] as const).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setScopeFilter(sc)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                      scopeFilter === sc
                        ? 'bg-white/10 text-white font-bold border border-white/20'
                        : 'bg-[#1A1A1C] text-white/40 hover:text-white border border-white/5'
                    }`}
                  >
                    {sc === 'pagamentos' ? 'Pagos' : sc}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Payment Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                Pagamento:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'com_pagamento', label: 'Com Pagamento' },
                  { id: 'todos', label: 'Todos' },
                  { id: 'sem_pagamento', label: 'Sem Pagamento' },
                ].map((pf) => (
                  <button
                    key={pf.id}
                    onClick={() => setPaymentFilter(pf.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                      paymentFilter === pf.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-[#1A1A1C] text-white/40 hover:text-white border border-white/5'
                    }`}
                  >
                    {pf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Cards List */}
      <div className="space-y-6">
        {sortedItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold text-sm">Nenhum lançamento ou fatura encontrado!</p>
            <p className="text-slate-500 text-xs">Tente ajustar os filtros acima ou cadastre uma nova conta ou lançamento.</p>
          </div>
        ) : viewMonthStr === 'todos' ? (
          (() => {
            const grouped: { [m: string]: typeof sortedItems } = {};
            sortedItems.forEach((it) => {
              const m = (it.dueDate || '').slice(0, 7) || 'Outros';
              if (!grouped[m]) grouped[m] = [];
              grouped[m].push(it);
            });
            const months = Object.keys(grouped).sort().reverse();
            return months.map((monthKey) => {
              const monthItems = grouped[monthKey];
              const monthTotal = monthItems.reduce((acc, i) => acc + i.amount, 0);
              return (
                <div key={monthKey} className="space-y-3 bg-[#161618] border border-white/5 rounded-3xl p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white text-base capitalize">{formatMonthName(monthKey)}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                        {monthItems.length} {monthItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total do Mês</span>
                      <span className="text-sm font-extrabold text-amber-400">{formatBRL(monthTotal)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {monthItems.map((item) => {
                      const isPaid = item.status === 'pago';
                      const isPending = item.status === 'pendente';
                      const isOverdue = item.status === 'atrasado';
                      const isPastMonth = item.dueDate.slice(0, 7) < currentMonthStr;
                      const needsUpdate = !isPaid && isPastMonth;

                      return (
                        <div key={item.id} className="flex flex-col gap-2 relative overflow-hidden rounded-2xl">
                          <div
                            onClick={() => {
                              if (item.isTransaction) {
                                onEditTransaction && onEditTransaction(item.original as Transaction);
                              } else {
                                onEditBill && onEditBill(item.original as Bill);
                              }
                            }}
                            className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer ${
                            isPaid
                              ? 'bg-slate-900/60 border-slate-800/80 hover:border-white/20'
                              : isOverdue
                              ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/50'
                              : 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                          }`}
                          title="Clique para abrir os dados da conta (código de barras, PIX, valores e vencimento)"
                        >
                          {needsUpdate && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center border border-amber-500/30 rounded-2xl">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const [y, m, d] = item.dueDate.split('-');
                                  const [cy, cm] = currentMonthStr.split('-');
                                  const maxDays = new Date(Number(cy), Number(cm), 0).getDate();
                                  const targetDay = Math.min(Number(d), maxDays);
                                  const newDate = `${cy}-${cm}-${String(targetDay).padStart(2, '0')}`;
                                  
                                  if (item.isTransaction) {
                                    onUpdateTransaction && onUpdateTransaction({
                                      ...(item.original as any),
                                      date: newDate,
                                      paid: false
                                    });
                                  } else {
                                    onUpdateBill && onUpdateBill({
                                      ...(item.original as any),
                                      dueDate: newDate,
                                      status: 'pendente'
                                    });
                                  }
                                }}
                                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Atualizar para {formatMonthName(currentMonthStr)}
                              </button>
                              <p className="text-amber-400/80 text-[10px] mt-2 font-medium uppercase tracking-wider">
                                Conta de {formatMonthName(item.dueDate.slice(0, 7))} não quitada
                              </p>
                            </div>
                          )}
                          
                          <div 
                            className="flex items-start gap-3.5 flex-1 min-w-0"
                          >
                            <div
                              className={`p-3 rounded-xl border shrink-0 mt-0.5 ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : isOverdue
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {item.scope === 'casa' ? (
                                <Home className="w-5 h-5" />
                              ) : (
                                <CreditCard className="w-5 h-5" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition flex items-center gap-1.5 truncate">
                                  {item.title}
                                  <Pencil className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                                </h3>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    isPaid
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : isOverdue
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {item.status}
                                </span>
                                
                                {item.isTransaction ? (
                                  <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-full font-medium">
                                    Lançamento Diário
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full font-medium">
                                    Fatura Agendada
                                  </span>
                                )}

                                

                                {item.installment && (
                                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                                    Parcela {item.installment.current}/{item.installment.total}
                                  </span>
                                )}
                              </div>

                              {item.notes && (
                                <div className="text-xs text-amber-300/90 italic mt-1 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit">
                                  <span className="font-semibold non-italic text-amber-400">Obs:</span>
                                  <span>{item.notes}</span>
                                </div>
                              )}

                              {(() => {
                                const dueInfo = getDueDateBusinessInfo(item.dueDate);
                                return (
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                                    <span className="flex items-center gap-1">
                                      {item.isTransaction ? 'Lançamento: ' : 'Vencimento: '}
                                      <strong className="text-slate-300">{formatDateBR(item.dueDate)}</strong>
                                      {dueInfo.isNonBusinessDay && (
                                        <span className="text-slate-400 font-medium">({dueInfo.originalDayOfWeek.slice(0, 3)})</span>
                                      )}
                                    </span>
                                    {dueInfo.isNonBusinessDay && (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30"
                                        title={dueInfo.noticeText}
                                      >
                                        <CalendarClock className="w-3 h-3 text-cyan-400 shrink-0" />
                                        <span>
                                          {dueInfo.holidayName ? `${dueInfo.holidayName.split(' ')[0]} • ` : ''}
                                          Próx. dia útil: <strong className="text-white font-bold">{dueInfo.formattedEffective.slice(0, 5)} ({dueInfo.effectiveDayOfWeek.slice(0, 3)})</strong>
                                        </span>
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span className="flex items-center gap-1 bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                                      <RefreshCw className="w-3 h-3 text-amber-400" />
                                      {item.recurring || 'Único'}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 sm:gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 w-full md:w-auto">
                            <div className="text-left md:text-right">
                              <div
                                className={`text-lg font-extrabold ${
                                  isPaid ? 'text-slate-400 line-through' : 'text-amber-400'
                                }`}
                              >
                                {formatBRL(item.amount)}
                              </div>
                              <div className="text-[11px] text-slate-400">Método: {item.paymentMethod}</div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                              {deletingId === item.id ? (
                                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl px-2.5 py-1 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs text-rose-300 font-bold pr-1">Excluir?</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.isTransaction) {
                                        onDeleteTransaction && onDeleteTransaction(item.id);
                                      } else {
                                        onDeleteBill(item.id);
                                      }
                                      setDeletingId(null);
                                    }}
                                    className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(null);
                                    }}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition cursor-pointer"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {!isPaid ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.isTransaction) {
                                          onUpdateTransaction && onUpdateTransaction({
                                            ...(item.original as Transaction),
                                            paid: true,
                                          });
                                        } else {
                                          onPayBill(item.id);
                                        }
                                      }}
                                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Pagar</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.isTransaction) {
                                          onUpdateTransaction && onUpdateTransaction({
                                            ...(item.original as Transaction),
                                            paid: false,
                                          });
                                        } else {
                                          onPayBill(item.id);
                                        }
                                      }}
                                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Desfazer</span>
                                    </button>
                                  )}

                                  {((item.original as any).barcode || (item.original as any).pixCode) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedBarcodeId(expandedBarcodeId === item.id ? null : item.id);
                                      }}
                                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 border border-white/10"
                                      title="Ver Dados do Boleto / PIX"
                                    >
                                      <QrCode className="w-4 h-4 text-white/70" />
                                      <span className="hidden sm:inline">Dados do Boleto</span>
                                      <span className="sm:hidden">Boleto</span>
                                    </button>
                                  )}

                                  {!item.isTransaction && onUpdateBill && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateBill({
                                          ...(item.original as any),
                                          excludeFromTotals: !item.excludeFromTotals,
                                        });
                                      }}
                                      className={`p-2 rounded-xl transition ${
                                        item.excludeFromTotals
                                          ? 'text-rose-400 bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/15 hover:text-rose-300'
                                          : 'text-slate-400 border border-transparent hover:bg-slate-800 hover:text-emerald-400'
                                      }`}
                                      title={
                                        item.excludeFromTotals
                                          ? 'Somar esta conta nos totais gerais (Dashboard)'
                                          : 'Ignorar esta conta nos totais gerais (Dashboard)'
                                      }
                                      id={`toggle_totals_${item.id}`}
                                    >
                                      <Calculator className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.isTransaction) {
                                        onEditTransaction && onEditTransaction(item.original as Transaction);
                                      } else {
                                        onEditBill && onEditBill(item.original as any);
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                                    title="Editar"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(item.id);
                                    }}
                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          </div>
                          {expandedBarcodeId === item.id && (
                            <div className="px-4 py-3 bg-[#1A1A1E] border border-white/5 rounded-2xl animate-fadeIn space-y-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                  <label className="block text-[11px] font-medium text-white/50 mb-1">Linha Digitável / Código de Barras</label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      readOnly
                                      value={(item.original as any).barcode || ""} 
                                      placeholder="Nenhum código disponível"
                                      className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const code = (item.original as any).barcode;
                                        if (code) {
                                          navigator.clipboard.writeText(code).then(() => {
                                            setBankModalItem({ isOpen: true, isPix: false, item, isPaid });
                                          });
                                        } else {
                                          if (window.confirm("Nenhum código disponível. Deseja editar esta conta para capturar os dados com a câmera?")) {
                                             if (item.isTransaction) {
                                                onEditTransaction && onEditTransaction(item.original as any);
                                             } else {
                                                onEditBill && onEditBill(item.original as any);
                                             }
                                          }
                                        }
                                      }}
                                      className="px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition"
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[11px] font-medium text-white/50 mb-1">Código PIX (Copia e Cola)</label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      readOnly
                                      value={(item.original as any).pixCode || ""} 
                                      placeholder="Nenhum PIX disponível"
                                      className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const code = (item.original as any).pixCode;
                                        if (code) {
                                          navigator.clipboard.writeText(code).then(() => {
                                            setBankModalItem({ isOpen: true, isPix: true, item, isPaid });
                                          });
                                        } else {
                                          if (window.confirm("Nenhum PIX disponível. Deseja editar esta conta para capturar os dados com a câmera?")) {
                                             if (item.isTransaction) {
                                                onEditTransaction && onEditTransaction(item.original as any);
                                             } else {
                                                onEditBill && onEditBill(item.original as any);
                                             }
                                          }
                                        }
                                      }}
                                      className="px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition"
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const isPaid = item.status === 'pago';
              const isPending = item.status === 'pendente';
              const isOverdue = item.status === 'atrasado';
              const isPastMonth = item.dueDate.slice(0, 7) < currentMonthStr;
              const needsUpdate = !isPaid && isPastMonth;

              return (
                <div key={item.id} className="flex flex-col gap-2 relative overflow-hidden rounded-2xl">
                  <div
                    onClick={() => {
                      if (item.isTransaction) {
                        onEditTransaction && onEditTransaction(item.original as Transaction);
                      } else {
                        onEditBill && onEditBill(item.original as Bill);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer ${
                    isPaid
                      ? 'bg-slate-900/60 border-slate-800/80 hover:border-white/20'
                      : isOverdue
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/50'
                      : 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                  }`}
                  title="Clique para abrir os dados da conta (código de barras, PIX, valores e vencimento)"
                >
                  {needsUpdate && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center border border-amber-500/30 rounded-2xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const [y, m, d] = item.dueDate.split('-');
                          const [cy, cm] = currentMonthStr.split('-');
                          const maxDays = new Date(Number(cy), Number(cm), 0).getDate();
                          const targetDay = Math.min(Number(d), maxDays);
                          const newDate = `${cy}-${cm}-${String(targetDay).padStart(2, '0')}`;
                          
                          if (item.isTransaction) {
                            onUpdateTransaction && onUpdateTransaction({
                              ...(item.original as any),
                              date: newDate,
                              paid: false
                            });
                          } else {
                            onUpdateBill && onUpdateBill({
                              ...(item.original as any),
                              dueDate: newDate,
                              status: 'pendente'
                            });
                          }
                        }}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Atualizar para {formatMonthName(currentMonthStr)}
                      </button>
                      <p className="text-amber-400/80 text-[10px] mt-2 font-medium uppercase tracking-wider">
                        Conta de {formatMonthName(item.dueDate.slice(0, 7))} não quitada
                      </p>
                    </div>
                  )}
                  
                  <div 
                    className="flex items-start gap-3.5 flex-1 min-w-0"
                  >
                    <div
                      className={`p-3 rounded-xl border shrink-0 mt-0.5 ${
                        isPaid
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isOverdue
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {item.scope === 'casa' ? (
                        <Home className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition flex items-center gap-1.5 truncate">
                          {item.title}
                          <Pencil className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.status}
                        </span>
                        
                        {item.isTransaction ? (
                          <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-full font-medium">
                            Lançamento Diário
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full font-medium">
                            Fatura Agendada
                          </span>
                        )}

                        

                        {item.installment && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                            Parcela {item.installment.current}/{item.installment.total}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="text-xs text-amber-300/90 italic mt-1 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit">
                          <span className="font-semibold non-italic text-amber-400">Obs:</span>
                          <span>{item.notes}</span>
                        </div>
                      )}

                      {(() => {
                        const dueInfo = getDueDateBusinessInfo(item.dueDate);
                        return (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              {item.isTransaction ? 'Lançamento: ' : 'Vencimento: '}
                              <strong className="text-slate-300">{formatDateBR(item.dueDate)}</strong>
                              {dueInfo.isNonBusinessDay && (
                                <span className="text-slate-400 font-medium">({dueInfo.originalDayOfWeek.slice(0, 3)})</span>
                              )}
                            </span>
                            {dueInfo.isNonBusinessDay && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30"
                                title={dueInfo.noticeText}
                              >
                                <CalendarClock className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>
                                  {dueInfo.holidayName ? `${dueInfo.holidayName.split(' ')[0]} • ` : ''}
                                  Próx. dia útil: <strong className="text-white font-bold">{dueInfo.formattedEffective.slice(0, 5)} ({dueInfo.effectiveDayOfWeek.slice(0, 3)})</strong>
                                </span>
                              </span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1 bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                              <RefreshCw className="w-3 h-3 text-amber-400" />
                              {item.recurring || 'Único'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 sm:gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 w-full md:w-auto">
                    <div className="text-left md:text-right">
                      <div
                        className={`text-lg font-extrabold ${
                          isPaid ? 'text-slate-400 line-through' : 'text-amber-400'
                        }`}
                      >
                        {formatBRL(item.amount)}
                      </div>
                      <div className="text-[11px] text-slate-400">Método: {item.paymentMethod}</div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {deletingId === item.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl px-2.5 py-1 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-rose-300 font-bold pr-1">Excluir?</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.isTransaction) {
                                onDeleteTransaction && onDeleteTransaction(item.id);
                              } else {
                                onDeleteBill(item.id);
                              }
                              setDeletingId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <>
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.isTransaction) {
                                  onUpdateTransaction && onUpdateTransaction({
                                    ...(item.original as Transaction),
                                    paid: true,
                                  });
                                } else {
                                  onPayBill(item.id);
                                }
                              }}
                              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Pagar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.isTransaction) {
                                  onUpdateTransaction && onUpdateTransaction({
                                    ...(item.original as Transaction),
                                    paid: false,
                                  });
                                } else {
                                  onPayBill(item.id);
                                }
                              }}
                              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>Desfazer</span>
                            </button>
                          )}

                          {((item.original as any).barcode || (item.original as any).pixCode) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBarcodeId(expandedBarcodeId === item.id ? null : item.id);
                              }}
                              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 border border-white/10"
                              title="Ver Dados do Boleto / PIX"
                            >
                              <QrCode className="w-4 h-4 text-white/70" />
                              <span className="hidden sm:inline">Dados do Boleto</span>
                              <span className="sm:hidden">Boleto</span>
                            </button>
                          )}

                          {!item.isTransaction && onUpdateBill && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateBill({
                                  ...(item.original as any),
                                  excludeFromTotals: !item.excludeFromTotals,
                                });
                              }}
                              className={`p-2 rounded-xl transition ${
                                item.excludeFromTotals
                                  ? 'text-rose-400 bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/15 hover:text-rose-300'
                                  : 'text-slate-400 border border-transparent hover:bg-slate-800 hover:text-emerald-400'
                              }`}
                              title={
                                item.excludeFromTotals
                                  ? 'Somar esta conta nos totais gerais (Dashboard)'
                                  : 'Ignorar esta conta nos totais gerais (Dashboard)'
                              }
                              id={`toggle_totals_${item.id}`}
                            >
                              <Calculator className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.isTransaction) {
                                onEditTransaction && onEditTransaction(item.original as Transaction);
                              } else {
                                onEditBill && onEditBill(item.original as any);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(item.id);
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  </div>
                  {expandedBarcodeId === item.id && (
                    <div className="px-4 py-3 bg-[#1A1A1E] border border-white/5 rounded-2xl animate-fadeIn space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-white/50 mb-1">Linha Digitável / Código de Barras</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly
                              value={(item.original as any).barcode || ""} 
                              placeholder="Nenhum código disponível"
                              className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const code = (item.original as any).barcode;
                                if (code) {
                                  navigator.clipboard.writeText(code).then(() => {
                                    setBankModalItem({ isOpen: true, isPix: false, item, isPaid });
                                  });
                                } else {
                                  if (window.confirm("Nenhum código disponível. Deseja editar esta conta para capturar os dados com a câmera?")) {
                                     if (item.isTransaction) {
                                        onEditTransaction && onEditTransaction(item.original as any);
                                     } else {
                                        onEditBill && onEditBill(item.original as any);
                                     }
                                  }
                                }
                              }}
                              className="px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-white/50 mb-1">Código PIX (Copia e Cola)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly
                              value={(item.original as any).pixCode || ""} 
                              placeholder="Nenhum PIX disponível"
                              className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const code = (item.original as any).pixCode;
                                if (code) {
                                  navigator.clipboard.writeText(code).then(() => {
                                    setBankModalItem({ isOpen: true, isPix: true, item, isPaid });
                                  });
                                } else {
                                  if (window.confirm("Nenhum PIX disponível. Deseja editar esta conta para capturar os dados com a câmera?")) {
                                     if (item.isTransaction) {
                                        onEditTransaction && onEditTransaction(item.original as any);
                                     } else {
                                        onEditBill && onEditBill(item.original as any);
                                     }
                                  }
                                }
                              }}
                              className="px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Copiar Contas Mensais Section */}
      <div className="bg-[#161618] border border-white/5 rounded-3xl p-4 transition-all">
        <button
          type="button"
          onClick={() => setIsCopySectionOpen(!isCopySectionOpen)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
              <RefreshCw className={`w-4 h-4 ${isCopySectionOpen ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">
                Planejamento: Copiar Contas para Meses Subsequentes
              </h4>
              <p className="text-[11px] text-white/40">
                Copie todas as faturas recorrentes de um mês de origem para o mês seguinte
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-white/5 hover:bg-slate-700 transition">
            {isCopySectionOpen ? 'Fechar' : 'Abrir'}
          </span>
        </button>

        {isCopySectionOpen && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fadeIn">
            {recurringBills.length === 0 ? (
              <p className="text-xs text-rose-400/80 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                Aviso: Não há nenhuma conta cadastrada com recorrência no sistema. Cadastre pelo menos uma conta recorrente para habilitar a cópia.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
                    Mês de Origem (com faturas)
                  </label>
                  <select
                    value={selectedSourceMonth}
                    onChange={(e) => {
                      setSelectedSourceMonth(e.target.value);
                      setSelectedTargetMonth(''); // Reset target when source shifts
                    }}
                    className="w-full bg-[#1A1A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
                  >
                    {uniqueMonths.map((m) => (
                      <option key={m} value={m}>
                        {formatMonthName(m)} ({bills.filter(b => b.recurring === 'mensal' && b.dueDate.startsWith(m)).length} faturas)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
                    Mês de Destino (subsequente)
                  </label>
                  <select
                    value={activeTargetMonth}
                    onChange={(e) => setSelectedTargetMonth(e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
                  >
                    {targetOptions.map((m) => (
                      <option key={m} value={m}>
                        {formatMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleExecuteCopy}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Copiar Contas Selecionadas</span>
                  </button>
                </div>
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
