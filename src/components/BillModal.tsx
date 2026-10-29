import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CalendarDays,
  Trash2,
  CreditCard,
  Building2,
  Repeat,
  DollarSign,
  AlertCircle,
  Tag,
  HelpCircle,
  FileText,
  ChevronDown,
  Layers,
  Pin,
  CheckCircle2,
  Calendar,
  CalendarClock,
  QrCode,
  Copy,
  ShieldCheck,
  Plus,
  Check
} from 'lucide-react';
import { Bill, TransactionCategory, CategoryScope, PaymentMethod, SCOPE_CATEGORIES } from '../types';
import { getTodayStr, addMonthsToDateString, formatBRL, getBaseBillTitle, getDueDateBusinessInfo } from '../lib/storage';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    bill: (Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean }) | (Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean })[],
    existingId?: string
  ) => void;
  onDelete?: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  editingBill?: Bill | null;
  defaultScope?: CategoryScope;
  existingBills?: Bill[];
}

const COMMON_PRESETS = [
  { label: '⚡ Luz (Energia)', title: 'Fatura de Energia Elétrica', cat: 'Energia' as TransactionCategory, scope: 'casa' as CategoryScope },
  { label: '💧 Água / Saneamento', title: 'Conta de Água e Esgoto', cat: 'Moradia' as TransactionCategory, scope: 'casa' as CategoryScope },
  { label: '📶 Internet / TV', title: 'Fatura Internet & TV', cat: 'Internet/TV' as TransactionCategory, scope: 'casa' as CategoryScope },
  { label: '🏠 Aluguel', title: 'Aluguel do Imóvel', cat: 'Moradia' as TransactionCategory, scope: 'casa' as CategoryScope },
  { label: '🏢 Condomínio', title: 'Taxa de Condomínio', cat: 'Condomínio' as TransactionCategory, scope: 'casa' as CategoryScope },
  { label: '💳 Fatura Cartão', title: 'Fatura do Cartão de Crédito', cat: 'Fatura de Cartão' as TransactionCategory, scope: 'pagamentos' as CategoryScope },
];

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDeleteMultiple,
  editingBill = null,
  defaultScope = 'casa',
  existingBills = [],
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState(getTodayStr());
  const dueBusinessInfo = React.useMemo(() => getDueDateBusinessInfo(dueDate), [dueDate]);
  const [scope, setScope] = useState<CategoryScope>(defaultScope);
  const [category, setCategory] = useState<TransactionCategory>('Moradia');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [recurring, setRecurring] = useState<'mensal' | 'anual' | 'semanal' | 'unico'>('mensal');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [showBarcode, setShowBarcode] = useState(false);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [copiedField, setCopiedField] = useState<'barcode' | 'pix' | null>(null);
  
  // Bill Type / Mode
  const [billType, setBillType] = useState<'fixa' | 'parcelada' | 'unica'>('fixa');
  const [installments, setInstallments] = useState<number>(2);
  const [hasInstallment, setHasInstallment] = useState(false);
  const [installmentCurrent, setInstallmentCurrent] = useState<number | ''>(1);
  const [installmentTotal, setInstallmentTotal] = useState<number | ''>(12);
  const [installmentAmountType, setInstallmentAmountType] = useState<'por_parcela' | 'valor_total'>('por_parcela');
  const [markPriorAsPaid, setMarkPriorAsPaid] = useState(true);
  const [includeInCarDaily, setIncludeInCarDaily] = useState(false);
  const [autoPay, setAutoPay] = useState(false);
  const [excludeFromTotals, setExcludeFromTotals] = useState(false);
  const [updateScope, setUpdateScope] = useState<'all' | 'future' | 'single'>('single');

  const baseTitle = React.useMemo(() => getBaseBillTitle(title), [title]);

  const matchingBills = React.useMemo(() => {
    if (!editingBill || !existingBills.length) return [];
    const editingBaseTitle = getBaseBillTitle(editingBill.title);
    return existingBills.filter(b => getBaseBillTitle(b.title) === editingBaseTitle);
  }, [editingBill, existingBills]);

  // UI state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const titleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fin_control_custom_categories_v1");
      if (saved) setCustomCategories(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target as Node)) {
        setIsTitleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingBill) {
      setTitle(editingBill.title || '');
      setAmount(editingBill.amount && editingBill.amount > 0 ? editingBill.amount : '');
      setDueDate(editingBill.dueDate || getTodayStr());
      setScope(editingBill.scope || 'casa');
      setCategory(editingBill.category || 'Moradia');
      setPaymentMethod(editingBill.paymentMethod || 'PIX');
      setRecurring(editingBill.recurring || 'mensal');
      setRecipient(editingBill.recipient || '');
      setNotes(editingBill.notes || '');
      setBarcode(editingBill.barcode || "");
      setPixCode(editingBill.pixCode || "");
      setIsPaid(editingBill.status === 'pago');
      setShowBarcode(false);
      
      const installmentMatch = editingBill.title ? editingBill.title.match(/\((\d+)\/(\d+)\)/) : null;
      if (editingBill.installment || installmentMatch) {
        setBillType('parcelada');
        setHasInstallment(true);
        const currVal = editingBill.installment?.current ?? (installmentMatch ? parseInt(installmentMatch[1], 10) : 1);
        const totVal = editingBill.installment?.total ?? (installmentMatch ? parseInt(installmentMatch[2], 10) : 12);
        setInstallmentCurrent(currVal);
        setInstallmentTotal(totVal);
      } else if (editingBill.recurring === 'mensal') {
        setBillType('fixa');
        setHasInstallment(false);
      } else {
        setBillType('unica');
        setHasInstallment(false);
      }
      setIncludeInCarDaily(!!editingBill.includeInCarDaily);
      setAutoPay(!!editingBill.autoPay);
      setExcludeFromTotals(!!editingBill.excludeFromTotals);
      setUpdateScope('single');
    } else {
      setTitle('');
      setAmount('');
      setDueDate(getTodayStr());
      setScope(defaultScope);
      const allowed = SCOPE_CATEGORIES[defaultScope] || [];
      setCategory(allowed[0] || 'Moradia');
      setPaymentMethod('PIX');
      setRecurring('mensal');
      setRecipient('');
      setNotes('');
      setBarcode("");
      setPixCode("");
      setIsPaid(false);
      setBillType('fixa');
      setHasInstallment(false);
      setInstallmentCurrent(1);
      setInstallmentTotal(12);
      setIncludeInCarDaily(false);
      setAutoPay(false);
      setExcludeFromTotals(false);
      setUpdateScope('all');
    }
    setConfirmDelete(false);
    setIsAddingNewCat(false);
  }, [editingBill, isOpen, defaultScope]);

  const handleScopeChange = (newScope: CategoryScope) => {
    setScope(newScope);
    const allowed = [...(SCOPE_CATEGORIES[newScope] || []), ...customCategories];
    if (!allowed.includes(category)) {
      setCategory(allowed[0] || 'Outros');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsTitleDropdownOpen(true);
    
    const installmentMatch = newTitle.match(/\(?(\d+)\s*\/\s*(\d+)\)?/);
    if (installmentMatch && !editingBill) {
      const currentNum = parseInt(installmentMatch[1], 10);
      const totalNum = parseInt(installmentMatch[2], 10);
      if (totalNum > 1 && currentNum <= totalNum) {
        setBillType('parcelada');
        setHasInstallment(true);
        setInstallmentCurrent(currentNum);
        setInstallmentTotal(totalNum);
      }
    }

    const matchedPreset = COMMON_PRESETS.find(p => p.title.toLowerCase() === newTitle.toLowerCase());
    if (matchedPreset && !editingBill) {
      setScope(matchedPreset.scope);
      setCategory(matchedPreset.cat);
    }
  };

  const handlePresetSelect = (preset: any) => {
    setTitle(preset.title);
    setIsTitleDropdownOpen(false);
    if (preset.scope && preset.cat && !editingBill) {
      setScope(preset.scope);
      setCategory(preset.cat);
    }
  };

  const titleOptions = [
    ...COMMON_PRESETS,
    { title: 'Mercado' },
    { title: 'Farmácia' },
    { title: 'Academia' },
    { title: 'Plano de Saúde' },
    { title: 'Combustível' },
    { title: 'Recarga Pública (Eletroposto)' },
    { title: 'Acessórios EV' },
    { title: 'Wallbox / Instalação' }
  ];

  const filteredTitles = titleOptions.filter(opt => opt.title.toLowerCase().includes(title.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const numericAmount = typeof amount === 'number' 
      ? amount 
      : (parseFloat(String(amount).replace(/\./g, '').replace(',', '.')) || parseFloat(String(amount).replace(',', '.')) || 0);

    const todayStr = getTodayStr();
    if (!isPaid && dueDate < todayStr) {
      alert(`⚠️ Atenção: Esta conta ("${title.trim()}") já está vencida!`);
    }

    if (!editingBill && billType === 'fixa') {
      const billsBatch: any[] = [];
      const [yearStr, monthStr, dayStr] = dueDate.split('-');
      const baseYear = parseInt(yearStr, 10) || new Date().getFullYear();
      const day = parseInt(dayStr, 10) || 10;
      
      for (let y of [baseYear, baseYear + 1]) {
        for (let m = 1; m <= 12; m++) {
          const maxD = new Date(y, m, 0).getDate();
          const targetDay = Math.min(day, maxD);
          const targetDueDate = `${y}-${String(m).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
          const isThisSelectedMonth = targetDueDate === dueDate;

          billsBatch.push({
            title: title.trim(),
            amount: numericAmount,
            dueDate: targetDueDate,
            category,
            scope,
            paymentMethod,
            recurring: 'mensal',
            recipient: recipient.trim() || undefined,
            notes: notes.trim() || undefined,
            paid: isPaid && isThisSelectedMonth,
            barcode: barcode || undefined,
            pixCode: pixCode || undefined,
            includeInCarDaily,
            autoPay,
            excludeFromTotals,
          });
        }
      }
      onSave(billsBatch);
    } else if (!editingBill && billType === 'parcelada') {
      const curr = Math.max(1, Number(installmentCurrent) || 1);
      const total = Math.max(curr, Number(installmentTotal) || 2);
      const cleanBaseTitle = title.replace(/\s*\(\d+\/\d+\)/g, '').trim();
      const eachInstallmentAmount = installmentAmountType === 'valor_total' ? Number((numericAmount / total).toFixed(2)) : numericAmount;
      const billsBatch: any[] = [];

      for (let i = 1; i <= total; i++) {
        const monthOffset = i - curr;
        const currentDueDate = addMonthsToDateString(dueDate, monthOffset);
        const currentTitle = `${cleanBaseTitle} (${i}/${total})`;
        let installmentPaid = i < curr ? markPriorAsPaid : (i === curr ? isPaid : false);

        billsBatch.push({
          title: currentTitle,
          amount: eachInstallmentAmount,
          dueDate: currentDueDate,
          category,
          scope,
          paymentMethod,
          recurring: 'unico',
          recipient: recipient.trim() || undefined,
          notes: notes.trim() || undefined,
          paid: installmentPaid,
          barcode: i === curr ? (barcode || undefined) : undefined,
          pixCode: i === curr ? (pixCode || undefined) : undefined,
          installment: { current: i, total: total },
          includeInCarDaily,
          autoPay,
          excludeFromTotals,
        });
      }
      onSave(billsBatch);
    } else {
      onSave({
        id: editingBill?.id,
        title: title.trim(),
        amount: numericAmount,
        dueDate: dueDate,
        category: category,
        scope: scope,
        paymentMethod: paymentMethod,
        recurring: (billType === 'fixa' ? 'mensal' : (billType === 'parcelada' ? 'unico' : 'unico')),
        recipient: recipient.trim() || undefined,
        notes: notes.trim() || undefined,
        paid: isPaid,
        barcode: barcode || undefined,
        pixCode: pixCode || undefined,
        installment: (billType === 'parcelada' && installmentCurrent !== '' && installmentTotal !== '') ? { current: Number(installmentCurrent), total: Number(installmentTotal) } : undefined,
        includeInCarDaily,
        autoPay,
        excludeFromTotals,
      }, editingBill?.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn overflow-y-auto" onClick={onClose}>
      <div className="bg-[#141416] border border-amber-500/20 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-[#1A1A1E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">{editingBill ? 'Editar Conta a Pagar' : 'Cadastrar Nova Conta'}</h3>
              <p className="text-[11px] text-white/50">{editingBill ? 'Atualize os vencimentos e detalhes da conta' : 'Agende seus compromissos financeiros futuros'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-4">
              {/* Barcode / Pix Section */}
              <div className="rounded-2xl border border-white/10 bg-[#161618] overflow-hidden">
                <button type="button" onClick={() => setShowBarcode(!showBarcode)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Dados para Pagamento (Código de Barras & PIX)</span>
                    {(barcode || pixCode) && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Disponível</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <span>{showBarcode ? 'Ocultar' : 'Exibir'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBarcode ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {showBarcode && (
                  <div className="p-4 bg-[#1A1A1E] space-y-3.5 border-t border-white/5">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-1 uppercase tracking-wider">Código de Barras</label>
                        <div className="flex gap-2">
                          <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Linha digitável ou código..." className="flex-1 bg-[#141416] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
                          {barcode && <button type="button" onClick={() => { navigator.clipboard.writeText(barcode); setCopiedField('barcode'); setTimeout(() => setCopiedField(null), 2000); }} className="p-2 bg-white/5 rounded-xl transition">{copiedField === 'barcode' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}</button>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-1 uppercase tracking-wider">Código PIX</label>
                        <div className="flex gap-2">
                          <input type="text" value={pixCode} onChange={e => setPixCode(e.target.value)} placeholder="Chave ou código PIX..." className="flex-1 bg-[#141416] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
                          {pixCode && <button type="button" onClick={() => { navigator.clipboard.writeText(pixCode); setCopiedField('pix'); setTimeout(() => setCopiedField(null), 2000); }} className="p-2 bg-white/5 rounded-xl transition">{copiedField === 'pix' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Nome ou Título da Conta <span className="text-rose-400">*</span></label>
                <div className="relative" ref={titleDropdownRef}>
                  <input type="text" placeholder="Ex: Fatura de Luz, Aluguel, Internet" value={title} onChange={handleTitleChange} onFocus={() => setIsTitleDropdownOpen(true)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none transition" required />
                  {isTitleDropdownOpen && filteredTitles.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto">
                      {filteredTitles.map((opt, idx) => <button key={idx} type="button" onClick={() => handlePresetSelect(opt)} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 border-b border-white/5 last:border-0">{'label' in opt ? (opt as any).label : opt.title}</button>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">R$</span>
                    <input type="text" inputMode="numeric" placeholder="0,00" value={typeof amount === 'number' && !isNaN(amount) && amount > 0 ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} onChange={e => { const digits = e.target.value.replace(/\D/g, ''); if (!digits) setAmount(''); else setAmount(Number(digits) / 100); }} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-amber-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Vencimento <span className="text-rose-400">*</span></label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-semibold text-white/70 mb-1">Meio de Pagamento</label>
                  <button type="button" onClick={() => setOpenDropdown(openDropdown === 'paymentMethod' ? null : 'paymentMethod')} className="w-full bg-[#1A1A1E] border border-white/10 hover:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between">
                    <span className="truncate">{paymentMethod}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                  {openDropdown === 'paymentMethod' && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden">
                      {['PIX', 'Boleto', 'Cartão de Crédito', 'Débito', 'Dinheiro', 'Transferência', 'SEM PAGAMENTO'].map(pm => <button key={pm} type="button" onClick={() => { setPaymentMethod(pm as PaymentMethod); setOpenDropdown(null); }} className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${paymentMethod === pm ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>{pm}</button>)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Favorecido (Opcional)</label>
                  <input type="text" placeholder="Ex: Nome da Empresa..." value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Observação / Detalhes</label>
                <textarea rows={2} placeholder="Notas adicionais..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition" />
              </div>

              {dueBusinessInfo.isNonBusinessDay && (
                <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CalendarClock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Vencimento em {dueBusinessInfo.originalDayOfWeek}</span>
                      {dueBusinessInfo.holidayName && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">{dueBusinessInfo.holidayName}</span>}
                    </div>
                    <p className="text-cyan-200/90 leading-relaxed text-[11px]">{dueBusinessInfo.noticeText}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-semibold text-white/70 mb-1">Escopo</label>
                  <button type="button" onClick={() => setOpenDropdown(openDropdown === 'scope' ? null : 'scope')} className="w-full bg-[#1A1A1E] border border-white/10 hover:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between">
                    <span className="truncate">{scope === 'casa' ? '🏠 Casa' : scope === 'geral' ? '🌐 Geral' : scope === 'pagamentos' ? '💳 Pagamentos' : scope === 'pet' ? '🐾 Pet' : '🏢 Empresa'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                  {openDropdown === 'scope' && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden">
                      {['casa', 'geral', 'pet', 'empresa', 'pagamentos'].map(s => <button key={s} type="button" onClick={() => { handleScopeChange(s as CategoryScope); setOpenDropdown(null); }} className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:bg-slate-800 border-b border-white/5 last:border-0 capitalize">{s}</button>)}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-white/70 mb-1">Categoria</label>
                  <button type="button" onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')} className="w-full bg-[#1A1A1E] border border-white/10 hover:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between">
                    <span className="truncate">{category}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                  {openDropdown === 'category' && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                      {[...(SCOPE_CATEGORIES[scope] || []), ...customCategories].map(cat => <button key={cat} type="button" onClick={() => { setCategory(cat as TransactionCategory); setOpenDropdown(null); }} className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:bg-slate-800 border-b border-white/5 last:border-0">{cat}</button>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[ { id: 'fixa', label: 'Mensal', icon: Repeat }, { id: 'parcelada', label: 'Parcelada', icon: CreditCard }, { id: 'unica', label: 'Única', icon: CalendarDays } ].map(type => (
                  <button key={type.id} type="button" onClick={() => { setBillType(type.id as any); setHasInstallment(type.id === 'parcelada'); }} className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${billType === type.id ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#1A1A1E] border-white/10 text-white/60'}`}><type.icon className="w-4 h-4" /><span className="text-[10px] font-bold">{type.label}</span></button>
                ))}
              </div>

              {billType === 'parcelada' && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 mb-1">Parcela Atual</label>
                      <input type="number" value={installmentCurrent} onChange={e => setInstallmentCurrent(Number(e.target.value))} className="w-full bg-[#141416] border border-purple-400/50 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-purple-200 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 mb-1">Total</label>
                      <input type="number" value={installmentTotal} onChange={e => setInstallmentTotal(Number(e.target.value))} className="w-full bg-[#141416] border border-purple-400/50 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-purple-200 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="amtType" checked={installmentAmountType === 'por_parcela'} onChange={() => setInstallmentAmountType('por_parcela')} className="w-3 h-3 text-purple-500 bg-slate-900 border-white/20" />
                      <span className="text-[10px] text-white/70 font-bold">Valor por Parcela</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="amtType" checked={installmentAmountType === 'valor_total'} onChange={() => setInstallmentAmountType('valor_total')} className="w-3 h-3 text-purple-500 bg-slate-900 border-white/20" />
                      <span className="text-[10px] text-white/70 font-bold">Valor Total</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-white/20 accent-amber-500 cursor-pointer" />
                  <span className="text-xs font-bold text-white/80">Esta conta já foi paga?</span>
                </label>
                
                {scope === 'casa' && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={includeInCarDaily} onChange={e => setIncludeInCarDaily(e.target.checked)} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400 bg-slate-900 border-white/20 accent-blue-500 cursor-pointer" />
                    <span className="text-xs font-bold text-white/80">Incluir no fechamento diário do carro?</span>
                  </label>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={autoPay} onChange={e => setAutoPay(e.target.checked)} className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-400 bg-slate-900 border-white/20 accent-indigo-500 cursor-pointer" />
                    <span className="text-xs font-bold text-white/80">Débito Automático?</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={excludeFromTotals} onChange={e => setExcludeFromTotals(e.target.checked)} className="w-4 h-4 rounded text-slate-500 focus:ring-slate-400 bg-slate-900 border-white/20 accent-slate-500 cursor-pointer" />
                    <span className="text-xs font-bold text-white/80">Ocultar dos Totais?</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Update Options */}
          {editingBill && (
            <div className="px-5 pb-5">
              <div className="rounded-2xl border border-amber-500/30 bg-[#161618] overflow-hidden">
                <button type="button" onClick={() => setShowBatchUpdate(!showBatchUpdate)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-amber-300 transition cursor-pointer">
                  <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-amber-400" /><span>Opções de Alteração em Lote ({matchingBills.length} iguais)</span></div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBatchUpdate ? 'rotate-180' : ''}`} />
                </button>
                {showBatchUpdate && (
                  <div className="p-4 bg-[#1A1A1E] space-y-3 border-t border-white/5 animate-fadeIn">
                    <p className="text-[11px] text-white/70 leading-tight">Onde deseja aplicar as mudanças?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => setUpdateScope('all')} className={`p-2 rounded-xl border text-[10px] font-bold text-center ${updateScope === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-[#141416] text-white/70 border-white/10'}`}>Todas</button>
                      <button type="button" onClick={() => setUpdateScope('future')} className={`p-2 rounded-xl border text-[10px] font-bold text-center ${updateScope === 'future' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-[#141416] text-white/70 border-white/10'}`}>Futuras</button>
                      <button type="button" onClick={() => setUpdateScope('single')} className={`p-2 rounded-xl border text-[10px] font-bold text-center ${updateScope === 'single' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-[#141416] text-white/70 border-white/10'}`}>Apenas esta</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="shrink-0 px-5 py-4 border-t border-white/10 bg-[#1A1A1E] flex items-center justify-between gap-3">
            <div>
              {editingBill && onDelete && (
                confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
                    <span className="text-xs text-rose-400 font-bold mr-1">Excluir:</span>
                    <button type="button" onClick={() => { onDelete(editingBill.id); onClose(); }} className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold rounded-xl border border-rose-500/30 transition cursor-pointer">Apenas Esta</button>
                    {matchingBills.length > 1 && onDeleteMultiple && <button type="button" onClick={() => { onDeleteMultiple(matchingBills.map((b: any) => b.id)); onClose(); }} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition shadow-md cursor-pointer">Todas</button>}
                    <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer">Cancelar</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /><span>Excluir</span></button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-[#141416] hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold rounded-xl transition border border-white/10 cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5 cursor-pointer"><Check className="w-4 h-4" /><span>{editingBill ? 'Salvar Alterações' : 'Agendar Conta'}</span></button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
