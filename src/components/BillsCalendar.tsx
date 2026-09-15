import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
  Tag,
  CreditCard,
  Building,
  Pencil,
  Trash2,
  CalendarClock,
} from 'lucide-react';
import { Bill, Transaction, CategoryScope } from '../types';
import { formatBRL, formatDateBR, getTodayStr, getDueDateBusinessInfo, getEffectiveDueDate } from '../lib/storage';

interface BillsCalendarProps {
  bills: Bill[];
  transactions?: Transaction[];
  onPayBill?: (billId: string) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onOpenNewBillModal?: (date?: string) => void;
  isCompact?: boolean;
  onNavigateToBills?: () => void;
  onEditBill?: (bill: Bill) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteBill?: (billId: string) => void;
  onDeleteTransaction?: (txId: string) => void;
}

export const BillsCalendar: React.FC<BillsCalendarProps> = ({
  bills = [],
  transactions = [],
  onPayBill,
  onUpdateTransaction,
  onOpenNewBillModal,
  isCompact = false,
  onNavigateToBills,
  onEditBill,
  onEditTransaction,
  onDeleteBill,
  onDeleteTransaction,
}) => {
  const todayStr = getTodayStr();
  const todayDate = new Date();
  
  const [currentYear, setCurrentYear] = useState<number>(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDate.getMonth()); // 0-indexed
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const monthsList = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Helper for dates in current view
  const currentYearMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Unified bill item model for calendar view
  interface CalendarBillItem {
    id: string;
    title: string;
    amount: number;
    dueDate: string; // YYYY-MM-DD
    category: string;
    scope: CategoryScope;
    isPaid: boolean;
    isOverdueOrToday: boolean;
    isFuture: boolean;
    isTransaction: boolean;
    notes?: string;
    original: Bill | Transaction;
  }

  // Build list of all items (Bills + Unpaid/Paid Expenses)
  const allCalendarItems: CalendarBillItem[] = [];

  // 1. Add Bills
  bills.forEach((b) => {
    if (b.paymentMethod === 'SEM PAGAMENTO') return;
    const isPaid = b.status === 'pago';
    const isOverdueOrToday = !isPaid && b.dueDate <= todayStr;
    const isFuture = !isPaid && b.dueDate > todayStr;
    allCalendarItems.push({
      id: b.id,
      title: b.title,
      amount: b.amount,
      dueDate: b.dueDate,
      category: b.category,
      scope: b.scope,
      isPaid,
      isOverdueOrToday,
      isFuture,
      isTransaction: false,
      notes: b.notes,
      original: b,
    });
  });

  // 2. Add Transactions (expenses with dates)
  transactions
    .filter((t) => t.type === 'despesa' && !t.id.startsWith('tx_auto_bill_'))
    .forEach((t) => {
      const isPaid = t.paid;
      const isOverdueOrToday = !isPaid && t.date <= todayStr;
      const isFuture = !isPaid && t.date > todayStr;
      allCalendarItems.push({
        id: t.id,
        title: t.description,
        amount: t.amount,
        dueDate: t.date,
        category: t.category,
        scope: t.scope,
        isPaid,
        isOverdueOrToday,
        isFuture,
        isTransaction: true,
        notes: t.notes,
        original: t,
      });
    });

  // Group items by date YYYY-MM-DD
  const itemsByDate: Record<string, CalendarBillItem[]> = {};
  allCalendarItems.forEach((item) => {
    if (!itemsByDate[item.dueDate]) {
      itemsByDate[item.dueDate] = [];
    }
    itemsByDate[item.dueDate].push(item);
  });

  // Days calculations for the month grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const prevMonth = () => {
    let newM = currentMonth - 1;
    let newY = currentYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    }
    setCurrentMonth(newM);
    setCurrentYear(newY);
    const newPrefix = `${newY}-${String(newM + 1).padStart(2, '0')}`;
    if (todayStr.startsWith(newPrefix)) {
      setSelectedDateStr(todayStr);
    } else {
      setSelectedDateStr(`${newPrefix}-01`);
    }
  };

  const nextMonth = () => {
    let newM = currentMonth + 1;
    let newY = currentYear;
    if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setCurrentMonth(newM);
    setCurrentYear(newY);
    const newPrefix = `${newY}-${String(newM + 1).padStart(2, '0')}`;
    if (todayStr.startsWith(newPrefix)) {
      setSelectedDateStr(todayStr);
    } else {
      setSelectedDateStr(`${newPrefix}-01`);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(getTodayStr());
  };

  // Determine status color for a date cell:
  // Green = All bills on that day are paid
  // Red = Has past due or due today unpaid bill(s)
  // Orange = Has future unpaid bill(s)
  const getDateStatus = (dateStr: string): 'red' | 'orange' | 'green' | null => {
    const dayItems = itemsByDate[dateStr];
    if (!dayItems || dayItems.length === 0) return null;

    const hasRed = dayItems.some((item) => !item.isPaid && getEffectiveDueDate(item.dueDate) <= todayStr);
    if (hasRed) return 'red';

    const hasOrange = dayItems.some((item) => !item.isPaid && getEffectiveDueDate(item.dueDate) > todayStr);
    if (hasOrange) return 'orange';

    return 'green';
  };

  // State to filter list below calendar: 'month' (all for current month) or 'day' (selected day)
  const [viewFilterMode, setViewFilterMode] = useState<'month' | 'day'>('month');

  // Items for current displayed month ONLY
  const currentMonthItems = allCalendarItems
    .filter((i) => i.dueDate.startsWith(currentYearMonthPrefix))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const monthPaidTotal = currentMonthItems.filter((i) => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
  const monthPendingTotal = currentMonthItems.filter((i) => !i.isPaid).reduce((sum, i) => sum + i.amount, 0);

  // Items for selected date (must also belong to current month)
  const selectedDayItems = currentMonthItems.filter((i) => i.dueDate === selectedDateStr);
  const selectedDayPaidTotal = selectedDayItems.filter((i) => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
  const selectedDayPendingTotal = selectedDayItems.filter((i) => !i.isPaid).reduce((sum, i) => sum + i.amount, 0);

  // Determine items to show in bottom list
  const displayedItems = viewFilterMode === 'day' ? selectedDayItems : currentMonthItems;

  return (
    <div className={`bg-[#161618] border border-white/10 rounded-3xl animate-fadeIn shadow-2xl ${
      isCompact ? 'p-3.5 sm:p-4 space-y-3' : 'p-5 md:p-6 space-y-6'
    }`}>
      {/* Calendar Header & Month Switcher */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 ${
        isCompact ? 'pb-2.5' : 'pb-4'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl ${
            isCompact ? 'p-1.5' : 'p-2.5'
          }`}>
            <CalendarIcon className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <div>
            <h3 className={`font-bold text-white flex items-center gap-2 ${
              isCompact ? 'text-sm' : 'text-lg'
            }`}>
              Calendário de Vencimentos
            </h3>
            {!isCompact && (
              <p className="text-xs text-slate-400">
                Visualize dias com contas a pagar coloridos por status
              </p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className={`flex flex-wrap items-center gap-2 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Atraso / Hoje</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>A Pagar</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Quitada</span>
          </div>
        </div>
      </div>

      {/* Month Navigation Controls */}
      <div className={`flex items-center justify-between bg-slate-900/80 rounded-2xl border border-slate-800 ${
        isCompact ? 'p-2' : 'p-3'
      }`}>
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition flex items-center gap-1 text-xs font-semibold"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`font-extrabold text-white tracking-wide ${isCompact ? 'text-xs sm:text-sm' : 'text-base'}`}>
            {monthsList[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToToday}
            className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] sm:text-xs font-bold rounded-lg transition border border-emerald-500/30 ml-1"
          >
            Hoje
          </button>
        </div>

        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition flex items-center gap-1 text-xs font-semibold"
          title="Próximo Mês"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1.5">
        {/* Weekday Labels */}
        <div className={`grid grid-cols-7 text-center font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-white/5 ${
          isCompact ? 'text-[9px]' : 'text-[11px]'
        }`}>
          <span className="text-rose-400">Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span className="text-amber-400">Sáb</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-0.5">
          {/* Empty padding slots before 1st day of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className={`${isCompact ? 'h-9 sm:h-11' : 'h-16 sm:h-20'} bg-slate-950/20 rounded-xl sm:rounded-2xl border border-transparent opacity-30`}
            />
          ))}

          {/* Days 1 to daysInMonth */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayStr = String(dayNum).padStart(2, '0');
            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const dayItems = itemsByDate[dateStr] || [];
            const count = dayItems.length;
            const statusColor = getDateStatus(dateStr);

            let numberClass = '';
            let bgStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700';

            if (statusColor === 'red') {
              numberClass = 'text-rose-200 font-black';
              bgStyle = 'bg-rose-950/40 border-2 border-rose-500 ring-2 ring-rose-500/50 hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)]';
            } else if (statusColor === 'orange') {
              numberClass = 'text-amber-200 font-bold';
              bgStyle = 'bg-amber-950/30 border-2 border-amber-500 ring-2 ring-amber-500/40 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
            } else if (statusColor === 'green') {
              numberClass = 'text-emerald-200 font-bold';
              bgStyle = 'bg-emerald-950/25 border-2 border-emerald-500 ring-2 ring-emerald-500/40 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
            }

            if (isSelected) {
              if (statusColor === 'red') {
                bgStyle = 'bg-rose-950/60 border-2 border-rose-400 ring-4 ring-rose-400/70 scale-[1.02] z-10 shadow-2xl';
              } else if (statusColor === 'orange') {
                bgStyle = 'bg-amber-950/50 border-2 border-amber-400 ring-4 ring-amber-400/70 scale-[1.02] z-10 shadow-2xl';
              } else if (statusColor === 'green') {
                bgStyle = 'bg-emerald-950/45 border-2 border-emerald-400 ring-4 ring-emerald-400/70 scale-[1.02] z-10 shadow-2xl';
              } else {
                bgStyle = 'bg-slate-900 border-2 border-slate-700 ring-4 ring-slate-700/30 scale-[1.02] z-10 shadow-2xl';
              }
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedDateStr(dateStr);

                  // Find bill on this date to open directly
                  const billItem = dayItems.find((item) => !item.isTransaction);
                  if (billItem && onEditBill) {
                    const originalBill = bills.find((b) => b.id === billItem.id);
                    if (originalBill) {
                      onEditBill(originalBill);
                      return;
                    }
                  }

                  // If no direct bill or no onEditBill, navigate to Bills module
                  if (onNavigateToBills) {
                    onNavigateToBills();
                  } else if (onOpenNewBillModal) {
                    onOpenNewBillModal(dateStr);
                  }
                }}
                title="Clique para selecionar • Duplo clique para abrir a conta"
                className={`relative ${
                  isCompact ? 'h-9 sm:h-11 p-1 rounded-xl' : 'h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl'
                } transition-all flex flex-col justify-between items-center text-center cursor-pointer select-none group ${bgStyle}`}
              >
                {/* Top Row: Date Number & Today Indicator */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`${
                      isCompact
                        ? 'w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs'
                        : 'w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm'
                    } rounded-full flex items-center justify-center transition-all ${
                      isToday
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : numberClass
                        ? numberClass
                        : 'text-slate-300 group-hover:text-white font-semibold'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isToday && !isCompact && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hidden sm:inline">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Bottom Row: Bill badges/amounts if present */}
                {count > 0 ? (
                  <div className="w-full flex flex-col items-center justify-center mt-0.5">
                    {isCompact ? (
                      <span
                        className={`text-[8px] font-bold px-1 py-0.2 rounded-full border truncate max-w-full ${
                          statusColor === 'red'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : statusColor === 'orange'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {count} {count === 1 ? 'conta' : 'contas'}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border truncate max-w-full ${
                          statusColor === 'red'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : statusColor === 'orange'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {count} {count === 1 ? 'conta' : 'contas'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={isCompact ? 'h-1' : 'h-4'} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Month / Day Details Section */}
      <div className="pt-4 border-t border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-white text-base">
                Contas de {monthsList[currentMonth]} de {currentYear}
              </h4>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                {currentMonthItems.length} {currentMonthItems.length === 1 ? 'conta' : 'contas'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {viewFilterMode === 'month'
                ? `Exibindo todas as contas com vencimento no mês de ${monthsList[currentMonth]}.`
                : `Exibindo contas do dia ${formatDateBR(selectedDateStr)}.`}
            </p>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => setViewFilterMode('month')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewFilterMode === 'month'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                Todas do Mês ({currentMonthItems.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilterMode('day')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewFilterMode === 'day'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                Dia {selectedDateStr.split('-')[2]} ({selectedDayItems.length})
              </button>
            </div>

            {viewFilterMode === 'day' && (() => {
              const dayBusinessInfo = getDueDateBusinessInfo(selectedDateStr);
              if (dayBusinessInfo.isNonBusinessDay) {
                return (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2 animate-fadeIn">
                    <CalendarClock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[11px] leading-relaxed">
                      {dayBusinessInfo.holidayName ? `${dayBusinessInfo.holidayName} • ` : `${dayBusinessInfo.originalDayOfWeek} • `}
                      Vencimentos deste dia são válidos para pagamento no próximo dia útil: <strong className="text-white font-bold">{dayBusinessInfo.formattedEffective} ({dayBusinessInfo.effectiveDayOfWeek})</strong> sem encargos.
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(viewFilterMode === 'month' ? monthPendingTotal : selectedDayPendingTotal) > 0 && (
              <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-right">
                <span className="text-[10px] uppercase font-semibold text-rose-400 block">Pendente</span>
                <span className="text-sm font-bold text-rose-300">
                  {formatBRL(viewFilterMode === 'month' ? monthPendingTotal : selectedDayPendingTotal)}
                </span>
              </div>
            )}

            {(viewFilterMode === 'month' ? monthPaidTotal : selectedDayPaidTotal) > 0 && (
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-right">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Quitado</span>
                <span className="text-sm font-bold text-emerald-300">
                  {formatBRL(viewFilterMode === 'month' ? monthPaidTotal : selectedDayPaidTotal)}
                </span>
              </div>
            )}

            {onNavigateToBills && (
              <button
                onClick={onNavigateToBills}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
                title="Ir para o Módulo de Contas"
              >
                <span>Ver no Módulo Contas</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {onOpenNewBillModal && (
              <button
                onClick={() => onOpenNewBillModal(selectedDateStr)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nova Conta</span>
              </button>
            )}
          </div>
        </div>

        {/* Displayed Month or Day Bills List */}
        {displayedItems.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
            {viewFilterMode === 'day'
              ? `Nenhuma conta a pagar ou quitada cadastrada no dia ${formatDateBR(selectedDateStr)}.`
              : `Nenhuma conta a pagar ou quitada cadastrada no mês de ${monthsList[currentMonth]} de ${currentYear}.`}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedItems.map((item) => {
              const dueInfo = getDueDateBusinessInfo(item.dueDate);
              const effectiveDueDate = dueInfo.effectiveDueDate;
              const isOverdue = !item.isPaid && effectiveDueDate < todayStr;
              const isDueToday = !item.isPaid && effectiveDueDate === todayStr;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.isPaid
                      ? 'bg-slate-900/60 border-slate-800'
                      : isOverdue || isDueToday
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                        item.isPaid
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isOverdue || isDueToday
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="font-bold text-sm text-white">{item.title}</h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            item.isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isDueToday
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {item.isPaid
                            ? 'Pago'
                            : isOverdue
                            ? 'Atrasado'
                            : isDueToday
                            ? (dueInfo.isNonBusinessDay ? 'Vence Hoje (Próx. Útil)' : 'Vence Hoje')
                            : 'A Pagar'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>
                          Vencimento: <strong className="text-slate-300">{formatDateBR(item.dueDate)}</strong>
                          {dueInfo.isNonBusinessDay && ` (${dueInfo.originalDayOfWeek.slice(0, 3)})`}
                        </span>
                        {dueInfo.isNonBusinessDay && (
                          <span
                            className="inline-flex items-center gap-1 bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            title={dueInfo.noticeText}
                          >
                            <CalendarClock className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>
                              {dueInfo.holidayName ? `${dueInfo.holidayName.split(' ')[0]} • ` : ''}
                              Próx. dia útil: <strong className="text-white font-bold">{dueInfo.formattedEffective.slice(0, 5)} ({dueInfo.effectiveDayOfWeek.slice(0, 3)})</strong>
                            </span>
                          </span>
                        )}
                        <span>• Escopo: <strong className="capitalize text-slate-300">{item.scope}</strong></span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-amber-300/90 italic mt-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Valor</span>
                      <span
                        className={`text-base font-extrabold ${
                          item.isPaid
                            ? 'text-slate-300 line-through opacity-75'
                            : isOverdue || isDueToday
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {formatBRL(item.amount)}
                      </span>
                    </div>

                    {/* Edit Button */}
                    {onEditBill && !item.isTransaction && (
                      <button
                        onClick={() => {
                          const originalBill = bills.find((b) => b.id === item.id);
                          if (originalBill) onEditBill(originalBill);
                        }}
                        className="p-2 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-xl transition cursor-pointer active:scale-95"
                        title="Editar Conta"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {onEditTransaction && item.isTransaction && (
                      <button
                        onClick={() => {
                          if (item.original) onEditTransaction(item.original as Transaction);
                        }}
                        className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition cursor-pointer active:scale-95"
                        title="Editar Lançamento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {(onDeleteBill || onDeleteTransaction) && (
                      deletingItemId === item.id ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-xl px-2 py-1 animate-fadeIn">
                          <span className="text-[10px] text-rose-300 font-bold">Excluir?</span>
                          <button
                            onClick={() => {
                              if (item.isTransaction && onDeleteTransaction) {
                                onDeleteTransaction(item.id);
                              } else if (!item.isTransaction && onDeleteBill) {
                                onDeleteBill(item.id);
                              }
                              setDeletingItemId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg transition"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeletingItemId(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] rounded-lg transition"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingItemId(item.id)}
                          className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer active:scale-95"
                          title="Excluir item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}

                    {onNavigateToBills && (
                      <button
                        onClick={onNavigateToBills}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition cursor-pointer"
                        title="Ver no Módulo de Contas"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Pay / Undo Button */}
                    {item.isPaid ? (
                      <button
                        onClick={() => {
                          if (item.isTransaction && onUpdateTransaction) {
                            onUpdateTransaction({
                              ...(item.original as Transaction),
                              paid: false,
                            });
                          } else if (onPayBill) {
                            onPayBill(item.id);
                          }
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Pago (Desfazer)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.isTransaction && onUpdateTransaction) {
                            onUpdateTransaction({
                              ...(item.original as Transaction),
                              paid: true,
                            });
                          } else if (onPayBill) {
                            onPayBill(item.id);
                          }
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                        <span>Marcar como Pago</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
