import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CalendarDays,
  Trash2,
  Camera,
  Loader2,
  Plus,
  Check,
  Sparkles,
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
  ShieldCheck
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
  const [bankModalItem, setBankModalItem] = useState<{ isOpen: boolean, isPix: boolean }>({ isOpen: false, isPix: false });
  const [pixCode, setPixCode] = useState("");
  const [showBarcode, setShowBarcode] = useState(false);
  const [copiedField, setCopiedField] = useState<'barcode' | 'pix' | null>(null);

  // Bill Type / Mode: 'fixa' (Monthly across all months), 'parcelada' (Installments), 'unica' (One-off)
  const [billType, setBillType] = useState<'fixa' | 'parcelada' | 'unica'>('fixa');
  const [paymentMode, setPaymentMode] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [installments, setInstallments] = useState<number>(2);
  const [hasInstallment, setHasInstallment] = useState(false);
  const [installmentCurrent, setInstallmentCurrent] = useState<number | ''>(1);
  const [installmentTotal, setInstallmentTotal] = useState<number | ''>(12);
  const [installmentAmountType, setInstallmentAmountType] = useState<'por_parcela' | 'valor_total'>('por_parcela');
  const [markPriorAsPaid, setMarkPriorAsPaid] = useState(true);
  const [includeInCarDaily, setIncludeInCarDaily] = useState(false);

  // Bulk / Multiple bills synchronization scope ('all' | 'future' | 'single')
  // Default to 'single' so editing a bill only edits that specific instance
  const [updateScope, setUpdateScope] = useState<'all' | 'future' | 'single'>('single');

  const baseTitle = editingBill ? getBaseBillTitle(editingBill.title) : '';
  const matchingBills = React.useMemo(() => {
    if (!editingBill || !existingBills || existingBills.length === 0) return [];
    const base = getBaseBillTitle(editingBill.title).toLowerCase().trim();
    if (!base) return [];
    return existingBills
      .filter((b) => getBaseBillTitle(b.title).toLowerCase().trim() === base)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [editingBill, existingBills]);

  // UI state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  React.useEffect(() => {
    const handleClickOutside_confirmDelete = () => {
      setConfirmDelete(false);
    };
    if (confirmDelete) {
      document.addEventListener('click', handleClickOutside_confirmDelete);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside_confirmDelete);
    };
  }, [confirmDelete]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  React.useEffect(() => {

    try {
      const saved = localStorage.getItem("fin_control_custom_categories_v1");
      if (saved) setCustomCategories(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target as Node)) {
        setIsTitleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal opens or editing state changes
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
      setShowBarcode(true); // Always display barcode & PIX data immediately when opening bill details!
      
      const installmentMatch = editingBill.title ? editingBill.title.match(/\((\d+)\/(\d+)\)/) : null;
      if (editingBill.installment || installmentMatch) {
        setBillType('parcelada');
        setPaymentMode('parcelado');
        setHasInstallment(true);
        const currVal = editingBill.installment?.current ?? (installmentMatch ? parseInt(installmentMatch[1], 10) : 1);
        const totVal = editingBill.installment?.total ?? (installmentMatch ? parseInt(installmentMatch[2], 10) : 12);
        setInstallmentCurrent(currVal);
        setInstallmentTotal(totVal);
        setInstallments(totVal);
      } else if (editingBill.recurring === 'mensal') {
        setBillType('fixa');
        setPaymentMode('a_vista');
        setHasInstallment(false);
      } else {
        setBillType('unica');
        setPaymentMode('a_vista');
        setHasInstallment(false);
      }
      setInstallments(2);
      setIncludeInCarDaily(!!editingBill.includeInCarDaily);
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
      setBillType('fixa'); // Default to Conta Fixa for convenient all-month template loading
      setPaymentMode('a_vista');
      setInstallments(2);
      setHasInstallment(false);
      setInstallmentCurrent(1);
      setInstallmentTotal(12);
      setIncludeInCarDaily(false);
      setUpdateScope('all');
    }
    setConfirmDelete(false);
    setIsAddingNewCat(false);
    setNewCatInput('');
    setAiMessage(null);
  }, [editingBill, isOpen, defaultScope]);

  // Sync category if scope changes and current category isn't valid for new scope
  const handleScopeChange = (newScope: CategoryScope) => {
    setScope(newScope);
    const allowed = [...(SCOPE_CATEGORIES[newScope] || []), ...customCategories];
    if (!allowed.includes(category)) {
      setCategory(allowed[0] || 'Outros');
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Photo / OCR upload with AI
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setAiMessage('Processando fatura/boleto com IA...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type || 'image/jpeg';

          const response = await fetch('/api/process-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: mimeType
            })
          });

          if (!response.ok) {
             throw new Error('Servidor retornou erro: ' + response.status);
          }

          const result = await response.json();
          if (result.success && result.data) {
            const { empresa, vencimento, valor, codigoBarras, codigoPix } = result.data;
            if (empresa) setTitle(String(empresa));
            if (vencimento) setDueDate(String(vencimento));
            if (valor) setAmount(Number(valor));
            if (codigoBarras) setBarcode(String(codigoBarras));
            if (codigoPix) setPixCode(String(codigoPix));
            if (codigoBarras || codigoPix) setShowBarcode(true);
            setAiMessage('✨ Dados extraídos com sucesso pela IA!');
            setTimeout(() => setAiMessage(null), 4000);
          } else {
            setAiMessage('⚠️ ' + (result.error || 'Não foi possível ler os dados automaticamente. Preencha manualmente.'));
          }
        } catch (err: any) {
          console.error(err);
          setAiMessage(`⚠️ Erro de conexão com serviço de leitura: ${err.message}`);
        } finally {
          setIsProcessing(false);
          // Reset input
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setAiMessage(`⚠️ Erro ao preparar imagem: ${err.message}`);
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCatInput.trim()) return;
    const cleanCat = newCatInput.trim();
    if (!customCategories.includes(cleanCat)) {
      const updated = [...customCategories, cleanCat];
      setCustomCategories(updated);
      localStorage.setItem("fin_control_custom_categories_v1", JSON.stringify(updated));
    }
    setCategory(cleanCat as TransactionCategory);
    setNewCatInput('');
    setIsAddingNewCat(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsTitleDropdownOpen(true);
    
    // Auto-detect installment pattern in title e.g. "10/36" or "(10/36)"
    const installmentMatch = newTitle.match(/\(?(\d+)\s*\/\s*(\d+)\)?/);
    if (installmentMatch && !editingBill) {
      const currentNum = parseInt(installmentMatch[1], 10);
      const totalNum = parseInt(installmentMatch[2], 10);
      if (totalNum > 1 && currentNum <= totalNum) {
        setBillType('parcelada');
        setPaymentMode('parcelado');
        setHasInstallment(true);
        setInstallmentCurrent(currentNum);
        setInstallmentTotal(totalNum);
        setInstallments(totalNum);
      }
    }

    // Auto-fill category and scope if it matches a preset exactly
    const matchedPreset = COMMON_PRESETS.find(p => p.title.toLowerCase() === newTitle.toLowerCase());
    if (matchedPreset && !editingBill) {
      setScope(matchedPreset.scope);
      setCategory(matchedPreset.cat);
    }
  };

  const handlePresetSelect = (preset: typeof COMMON_PRESETS[0] | { title: string }) => {
    setTitle(preset.title);
    setIsTitleDropdownOpen(false);
    
    // If it's a full preset with scope and cat, apply them
    if ('scope' in preset && 'cat' in preset && !editingBill) {
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

  const filteredTitles = titleOptions.filter(
    (opt) =>
      opt.title.toLowerCase().includes(title.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const numericAmount = typeof amount === 'number' 
      ? amount 
      : (parseFloat(String(amount).replace(/\./g, '').replace(',', '.')) || parseFloat(String(amount).replace(',', '.')) || 0);

    const todayStr = getTodayStr();
    if (!isPaid && dueDate < todayStr) {
      const [y, m, d] = dueDate.split('-');
      const formattedDate = d && m && y ? `${d}/${m}/${y}` : dueDate;
      alert(`⚠️ Atenção: Esta conta ("${title.trim()}") já está vencida!\nData de vencimento: ${formattedDate}.`);
    }

    if (!editingBill && billType === 'fixa') {
      // Replicate across all 12 months of the current year and 12 months of next year (24 months total)
      const billsBatch: (Omit<Bill, 'id' | 'status'> & { paid?: boolean })[] = [];
      const [yearStr, monthStr, dayStr] = dueDate.split('-');
      const baseYear = parseInt(yearStr, 10) || new Date().getFullYear();
      const baseMonth = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
      const day = parseInt(dayStr, 10) || 10;
      
      // We generate all months for baseYear (Jan to Dec) and baseYear + 1 (Jan to Dec)
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
          });
        }
      }

      onSave(billsBatch);
    } else if (!editingBill && billType === 'parcelada') {
      const curr = Math.max(1, Number(installmentCurrent) || 1);
      const total = Math.max(curr, Number(installmentTotal) || Number(installments) || 2);
      const cleanBaseTitle = title.replace(/\s*\(\d+\/\d+\)/g, '').trim();

      const eachInstallmentAmount = installmentAmountType === 'valor_total'
        ? Number((numericAmount / total).toFixed(2))
        : numericAmount;

      const billsBatch: (Omit<Bill, 'id' | 'status'> & { paid?: boolean })[] = [];

      for (let i = 1; i <= total; i++) {
        const monthOffset = i - curr;
        const currentDueDate = addMonthsToDateString(dueDate, monthOffset);
        const currentTitle = `${cleanBaseTitle} (${i}/${total})`;
        
        let installmentPaid = false;
        if (i < curr) {
          installmentPaid = markPriorAsPaid;
        } else if (i === curr) {
          installmentPaid = isPaid;
        } else {
          installmentPaid = false;
        }

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
        });
      }

      onSave(billsBatch);
    } else if (editingBill) {
      const isParcelada = billType === 'parcelada' || hasInstallment;

      if (isParcelada) {
        // User is editing or converting into installments!
        // "ex as q lancei sem parcelas e depois corrigi"
        const curr = Math.max(1, Number(installmentCurrent) || 1);
        const total = Math.max(curr, Number(installmentTotal) || Number(installments) || 2);
        const cleanBaseTitle = getBaseBillTitle(title.trim()) || getBaseBillTitle(editingBill.title) || title.trim();
        const eachInstallmentAmount = installmentAmountType === 'valor_total'
          ? Number((numericAmount / total).toFixed(2))
          : numericAmount;

        const targetMatching = updateScope === 'future'
          ? matchingBills.filter((b) => b.dueDate >= editingBill.dueDate)
          : matchingBills;

        const billsBatch: (Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean })[] = [];

        for (let i = 1; i <= total; i++) {
          const monthOffset = i - curr;
          const currentDueDate = addMonthsToDateString(dueDate, monthOffset);
          const currentTitle = `${cleanBaseTitle} (${i}/${total})`;

          const existingMatchingBill = targetMatching[i - 1];

          let installmentPaid = false;
          let billBarcode: string | undefined = undefined;
          let billPixCode: string | undefined = undefined;

          if (existingMatchingBill) {
            if (existingMatchingBill.id === editingBill.id) {
              installmentPaid = isPaid;
              billBarcode = barcode || undefined;
              billPixCode = pixCode || undefined;
            } else {
              installmentPaid = existingMatchingBill.status === 'pago' ? true : (i < curr ? markPriorAsPaid : false);
              billBarcode = existingMatchingBill.barcode || undefined;
              billPixCode = existingMatchingBill.pixCode || undefined;
            }
          } else {
            installmentPaid = i < curr ? markPriorAsPaid : (i === curr ? isPaid : false);
            billBarcode = i === curr ? (barcode || undefined) : undefined;
            billPixCode = i === curr ? (pixCode || undefined) : undefined;
          }

          billsBatch.push({
            id: existingMatchingBill ? existingMatchingBill.id : undefined,
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
            barcode: billBarcode,
            pixCode: billPixCode,
            installment: { current: i, total: total },
          });
        }

        // If there were more matching bills than total installments, and user chose 'all',
        // remove the extra ones to keep total count accurate
        if (targetMatching.length > total && onDeleteMultiple && updateScope === 'all') {
          const extraIds = targetMatching.slice(total).map((b) => b.id);
          onDeleteMultiple(extraIds);
        }

        onSave(billsBatch);
      } else if (matchingBills.length > 1 && (updateScope === 'all' || updateScope === 'future')) {
        // User is editing identical recurring bills (e.g. Luz, Internet, etc.)
        const targetBills = updateScope === 'future'
          ? matchingBills.filter((b) => b.dueDate >= editingBill.dueDate)
          : matchingBills;

        const [, , newDay] = dueDate.split('-');
        const billsBatch: (Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean })[] = [];

        for (const b of targetBills) {
          let targetDueDate = b.dueDate;
          const [bYear, bMonth] = b.dueDate.split('-');
          if (bYear && bMonth && newDay) {
            const maxD = new Date(Number(bYear), Number(bMonth), 0).getDate();
            const adjustedDay = Math.min(Number(newDay), maxD);
            targetDueDate = `${bYear}-${bMonth}-${String(adjustedDay).padStart(2, '0')}`;
          }

          const isThisBill = b.id === editingBill.id;
          if (isThisBill) {
            targetDueDate = dueDate;
          }

          billsBatch.push({
            id: b.id,
            title: title.trim(),
            amount: isThisBill ? numericAmount : b.amount, // Valor é estritamente individual por conta
            dueDate: targetDueDate,
            category,
            scope,
            paymentMethod,
            recurring: billType === 'fixa' ? 'mensal' : (b.recurring || recurring),
            recipient: recipient.trim() || undefined,
            notes: notes.trim() || undefined,
            paid: isThisBill ? isPaid : (b.status === 'pago'),
            barcode: isThisBill ? (barcode || undefined) : (b.barcode || undefined), // Código de barras estritamente individual
            pixCode: isThisBill ? (pixCode || undefined) : (b.pixCode || undefined), // PIX estritamente individual
            installment: undefined,
          });
        }

        onSave(billsBatch);
      } else {
        // Single bill update
        onSave(
          {
            id: editingBill.id,
            title: title.trim(),
            amount: numericAmount,
            dueDate,
            category,
            scope,
            paymentMethod,
            recurring: billType === 'fixa' ? 'mensal' : (billType === 'parcelada' ? 'unico' : recurring),
            recipient: recipient.trim() || undefined,
            notes: notes.trim() || undefined,
            paid: isPaid,
            barcode: barcode || undefined,
            pixCode: pixCode || undefined,
            installment: undefined,
          },
          editingBill.id
        );
      }
    } else {
      const isParcelada = billType === 'parcelada' || hasInstallment;
      onSave(
        {
          title: title.trim(),
          amount: numericAmount,
          dueDate,
          category,
          scope,
          paymentMethod,
          recurring: billType === 'fixa' ? 'mensal' : (billType === 'parcelada' ? 'unico' : recurring),
          recipient: recipient.trim() || undefined,
          notes: notes.trim() || undefined,
          paid: isPaid,
          barcode: barcode || undefined,
          pixCode: pixCode || undefined,
          installment: isParcelada && installmentCurrent !== '' && installmentTotal !== '' ? { current: Number(installmentCurrent), total: Number(installmentTotal) } : undefined,
        },
        editingBill?.id
      );
    }

    onClose();
  };

  const numAmount = typeof amount === 'number' ? amount : 0;
  const isPaidLocked = false;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#141416] border border-amber-500/20 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-[#1A1A1E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {editingBill ? 'Editar Conta a Pagar' : 'Cadastrar Nova Conta'}
              </h3>
              <p className="text-[11px] text-white/50">
                {editingBill ? 'Atualize os vencimentos e detalhes da conta' : 'Agende seus compromissos financeiros futuros'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Scanner Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-white/5 px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>Leitura por IA (Foto / Boleto)</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <label className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0">
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              ) : (
                <Camera className="w-3 h-3 text-amber-400" />
              )}
              <span>Câmera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
                disabled={isProcessing}
              />
            </label>
            <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0">
              <span>Scanner / Galeria</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoCapture}
                disabled={isProcessing}
              />
            </label>
          </div>
        </div>

        {aiMessage && (
          <div className="px-5 py-2 bg-amber-500/10 text-amber-300 text-xs border-b border-amber-500/20 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {/* Lock Notice if Paid */}
            {isPaidLocked && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
                <span className="text-base leading-none">🔒</span>
                <div>
                  <strong>Conta Marcada como Paga:</strong> Para editar título, valores ou datas, desmarque o checkbox "Já foi pago" no final.
                </div>
              </div>
            )}

            {/* Title / Description */}
            {/* Barcode / Pix Section */}
            <div className="rounded-2xl border border-white/10 bg-[#161618] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBarcode(!showBarcode)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Dados para Pagamento (Código de Barras & PIX)</span>
                  {(barcode || pixCode) && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Disponível
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <span>{showBarcode ? 'Ocultar' : 'Exibir'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBarcode ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showBarcode && (
                <div className="p-4 bg-[#1A1A1E] space-y-3.5 border-t border-white/5">
                  {/* Linha Digitavel / Boleto */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-white/70">
                        Linha Digitável / Código de Barras
                      </label>
                      {barcode && (
                        <span className="text-[10px] text-amber-400">
                          {barcode.replace(/\D/g, '').length} dígitos
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={barcode} 
                        onChange={e => setBarcode(e.target.value)}
                        placeholder="Cole ou digite o código de barras ou use a câmera"
                        className="flex-1 bg-black/30 border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/25 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (barcode) {
                            navigator.clipboard.writeText(barcode).then(() => {
                              setCopiedField('barcode');
                              setTimeout(() => setCopiedField(null), 3000);
                              setBankModalItem({ isOpen: true, isPix: false });
                            });
                          } else {
                            if (window.confirm("Nenhum código de barras disponível. Deseja abrir a câmera para capturar os dados do boleto?")) {
                               if (fileInputRef.current) fileInputRef.current.click();
                            }
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          copiedField === 'barcode'
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {copiedField === 'barcode' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PIX Copia e Cola */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">
                      Código PIX (Copia e Cola)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={pixCode} 
                        onChange={e => setPixCode(e.target.value)}
                        placeholder="Cole o código PIX Copia e Cola ou use a câmera"
                        className="flex-1 bg-black/30 border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/25 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (pixCode) {
                            navigator.clipboard.writeText(pixCode).then(() => {
                              setCopiedField('pix');
                              setTimeout(() => setCopiedField(null), 3000);
                              setBankModalItem({ isOpen: true, isPix: true });
                            });
                          } else {
                            if (window.confirm("Nenhum código PIX disponível. Deseja abrir a câmera para capturar os dados?")) {
                               if (fileInputRef.current) fileInputRef.current.click();
                            }
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          copiedField === 'pix'
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {copiedField === 'pix' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-white/50">
                    <span>Dica: Clique em <strong>Copiar</strong> para copiar e abrir seu banco.</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                    >
                      Escanear com Câmera
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Nome ou Título da Conta <span className="text-rose-400">*</span>
              </label>
              <div className="relative" ref={titleDropdownRef}>
                <input
                  type="text"
                  placeholder="Ex: Fatura de Luz, Aluguel, Parcela IPVA, Internet"
                  value={title}
                  onChange={handleTitleChange}
                  onFocus={() => setIsTitleDropdownOpen(true)}
                  disabled={isPaidLocked}
                  className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                
                {isTitleDropdownOpen && filteredTitles.length > 0 && !isPaidLocked && (
                  <div className="absolute z-10 w-full mt-1.5 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredTitles.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(opt)}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition border-b border-white/5 last:border-0"
                      >
                        {'label' in opt ? (
                          <div className="flex items-center gap-2">
                            <span>{opt.label}</span>
                            <span className="text-slate-500 hidden sm:inline">- {opt.title}</span>
                          </div>
                        ) : (
                          <span>{opt.title}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mass Update Selector for recurring/matching bills */}
            {editingBill && matchingBills.length > 1 && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Repeat className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Existem {matchingBills.length} contas com este título ("{baseTitle}")</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/40 font-bold whitespace-nowrap">
                    Alteração em Lote
                  </span>
                </div>

                <p className="text-[11px] text-white/70 leading-tight">
                  Ao salvar as alterações, onde você deseja aplicar o título/categoria/vencimento?
                </p>

                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span><strong>Proteção Individual:</strong> O Valor, Código de Barras e PIX são 100% individuais e nunca são alterados em massa.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateScope('all')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                      updateScope === 'all'
                        ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md'
                        : 'bg-[#141416] text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold">Todas as {matchingBills.length} Contas</span>
                    <span className="text-[9px] opacity-80 leading-tight">Mudar todas as iguais</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpdateScope('future')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                      updateScope === 'future'
                        ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md'
                        : 'bg-[#141416] text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold">Esta e as Próximas</span>
                    <span className="text-[9px] opacity-80 leading-tight">A partir deste mês</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpdateScope('single')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                      updateScope === 'single'
                        ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md'
                        : 'bg-[#141416] text-white/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold">Apenas Esta Conta</span>
                    <span className="text-[9px] opacity-80 leading-tight">Somente este registro</span>
                  </button>
                </div>
              </div>
            )}

            {/* Observação / O que se refere */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Observação <span className="text-white/40 font-normal">(Do que se refere esta conta)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Referente a reparo da bomba d'água, Parcela 2 do seguro, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPaidLocked}
                className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Amount & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount === '' || amount === 0 ? '' : amount}
                    onFocus={(e) => {
                      if (amount === 0 || amount === '0') {
                        setAmount('');
                      }
                      e.target.select();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setAmount('');
                      } else {
                        const parsed = parseFloat(val);
                        setAmount(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    disabled={isPaidLocked}
                    className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-amber-400 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Data de Vencimento <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isPaidLocked}
                  className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            {/* Aviso de Vencimento em Fim de Semana ou Feriado */}
            {dueBusinessInfo.isNonBusinessDay && (
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CalendarClock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Vencimento em {dueBusinessInfo.originalDayOfWeek}</span>
                    {dueBusinessInfo.holidayName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {dueBusinessInfo.holidayName}
                      </span>
                    )}
                  </div>
                  <p className="text-cyan-200/90 leading-relaxed text-[11px]">
                    {dueBusinessInfo.noticeText}
                  </p>
                </div>
              </div>
            )}

            {/* Scope & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-semibold text-white/70 mb-1">Escopo</label>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'scope' ? null : 'scope')}
                  disabled={isPaidLocked}
                  className="w-full bg-[#1A1A1E] border border-white/10 hover:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition disabled:opacity-50"
                >
                  <span className="truncate">
                    {scope === 'casa' && '🏠 Casa'}
                    {scope === 'geral' && '🌐 Geral'}
                    {scope === 'pagamentos' && '💳 Pagamentos / Cartão'}
                    {scope === 'pet' && '🐾 Pet'}
                    {scope === 'empresa' && '🏢 Empresa'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
                </button>
                {openDropdown === 'scope' && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                    {[
                      { value: 'casa', label: '🏠 Casa' },
                      { value: 'geral', label: '🌐 Geral' },
                      { value: 'pagamentos', label: '💳 Pagamentos / Cartão' },
                      { value: 'pet', label: '🐾 Pet' },
                      { value: 'empresa', label: '🏢 Empresa' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          handleScopeChange(item.value as CategoryScope);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${
                          scope === item.value ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-white/70">Categoria</label>
                  {scope !== 'geral' && !isAddingNewCat && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(true)}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova</span>
                    </button>
                  )}
                </div>

                {scope === 'geral' ? (
                  <input
                    type="text"
                    placeholder="Digite a categoria..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    disabled={isPaidLocked}
                    className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition disabled:opacity-50"
                    list="geral-categories"
                    required
                  />
                ) : isAddingNewCat ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nova Categoria..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      className="w-full bg-[#1A1A1E] border border-amber-400/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="p-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
                      title="Salvar Categoria"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(false)}
                      className="p-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                      disabled={isPaidLocked}
                      className="w-full bg-[#1A1A1E] border border-white/10 hover:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition disabled:opacity-50"
                    >
                      <span className="truncate">{category || 'Selecione...'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
                    </button>
                    {openDropdown === 'category' && (
                      <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                        {[...(SCOPE_CATEGORIES[scope] || []), ...customCategories].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setCategory(cat as TransactionCategory);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${
                              category === cat ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <datalist id="geral-categories">
                  {SCOPE_CATEGORIES['geral'].map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                  {customCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Tipo de Conta / Frequência */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white/70 flex items-center justify-between">
                <span>Tipo de Conta</span>
                {!editingBill && billType === 'fixa' && (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    Replicada em Todos os Meses
                  </span>
                )}
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBillType('fixa');
                    setPaymentMode('a_vista');
                    setRecurring('mensal');
                    setHasInstallment(false);
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    billType === 'fixa'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-[#1A1A1E] border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Repeat className="w-4 h-4 text-amber-400" />
                  <span className="text-xs">Conta Fixa</span>
                  <span className="text-[9px] opacity-70 leading-tight">Todos os meses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBillType('parcelada');
                    setPaymentMode('parcelado');
                    setRecurring('unico');
                    setHasInstallment(true);
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    billType === 'parcelada'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'bg-[#1A1A1E] border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span className="text-xs">Parcelada</span>
                  <span className="text-[9px] opacity-70 leading-tight">Ex: 1/12, 2/12</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBillType('unica');
                    setPaymentMode('a_vista');
                    setRecurring('unico');
                    setHasInstallment(false);
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    billType === 'unica'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'bg-[#1A1A1E] border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  <span className="text-xs">Conta Única</span>
                  <span className="text-[9px] opacity-70 leading-tight">Apenas este mês</span>
                </button>
              </div>

              {billType === 'fixa' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                  <Pin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Conta Fixa Permanente:</strong> Ao salvar, esta conta será criada e carregada em todos os meses (do início ao fim do ano). Em cada mês você poderá atualizar valores, código de barras e data de vencimento.
                  </div>
                </div>
              )}

              {billType === 'parcelada' && (
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 mb-1">
                        Parcela Atual / Início
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={typeof installmentTotal === 'number' ? installmentTotal : 999}
                        value={installmentCurrent}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
                          setInstallmentCurrent(val);
                        }}
                        className="w-full bg-[#141416] border border-purple-400/50 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-purple-200 focus:outline-none focus:border-purple-300"
                        placeholder="Ex: 10"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 mb-1">
                        Total de Parcelas
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="360"
                        value={installmentTotal}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(2, Number(e.target.value));
                          setInstallmentTotal(val);
                          if (typeof val === 'number') setInstallments(val);
                        }}
                        className="w-full bg-[#141416] border border-purple-400/50 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-purple-200 focus:outline-none focus:border-purple-300"
                        placeholder="Ex: 36"
                      />
                    </div>
                  </div>

                  {/* Amount Type Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-purple-500/20 text-[11px]">
                    <span className="text-purple-300/80 font-medium">O valor digitado é:</span>
                    <div className="flex bg-[#141416] p-0.5 rounded-lg border border-purple-500/30">
                      <button
                        type="button"
                        onClick={() => setInstallmentAmountType('por_parcela')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                          installmentAmountType === 'por_parcela'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-purple-300/70 hover:text-white'
                        }`}
                      >
                        Por Parcela
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstallmentAmountType('valor_total')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                          installmentAmountType === 'valor_total'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-purple-300/70 hover:text-white'
                        }`}
                      >
                        Total do Contrato
                      </button>
                    </div>
                  </div>

                  {/* Retroactive Info or Editing Info when starting at a higher installment or editing */}
                  {Number(installmentCurrent) > 1 && !editingBill && (
                    <div className="p-2.5 bg-purple-950/60 border border-purple-400/40 rounded-xl space-y-2 text-[11px] text-purple-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Puxando histórico anterior:</strong> O sistema criará automaticamente as parcelas de <strong>01 até {String(Number(installmentCurrent) - 1).padStart(2, '0')}</strong> com as datas nos meses anteriores correspondentes.
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-1.5 border-t border-purple-500/20 text-xs font-semibold text-purple-100 select-none">
                        <input
                          type="checkbox"
                          checked={markPriorAsPaid}
                          onChange={(e) => setMarkPriorAsPaid(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20 accent-purple-500 cursor-pointer"
                        />
                        <span>Marcar parcelas anteriores (01 a {String(Number(installmentCurrent) - 1).padStart(2, '0')}) como Pagas</span>
                      </label>
                    </div>
                  )}

                  {editingBill && (
                    <div className="p-3 bg-purple-950/60 border border-purple-400/40 rounded-xl space-y-2 text-[11px] text-purple-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Sincronização de Parcelas:</strong> Ao salvar, o sistema atualizará esta conta e sincronizará as <strong>{installmentTotal || 12} parcelas</strong> ({installmentCurrent || 1}/{installmentTotal || 12} até {installmentTotal || 12}/{installmentTotal || 12}) sequencialmente nos meses correspondentes.
                        </div>
                      </div>
                      {Number(installmentCurrent) > 1 && (
                        <label className="flex items-center gap-2 cursor-pointer pt-1.5 border-t border-purple-500/20 text-xs font-semibold text-purple-100 select-none">
                          <input
                            type="checkbox"
                            checked={markPriorAsPaid}
                            onChange={(e) => setMarkPriorAsPaid(e.target.checked)}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20 accent-purple-500 cursor-pointer"
                          />
                          <span>Marcar parcelas anteriores (01 a {String(Number(installmentCurrent) - 1).padStart(2, '0')}) como Pagas</span>
                        </label>
                      )}
                    </div>
                  )}

                  {numAmount > 0 && (
                    <div className="text-[11px] text-purple-200/90 pt-1 border-t border-purple-500/20 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span>Plano de {installmentCurrent || 1} a {installmentTotal || 12}:</span>
                        <strong className="text-purple-300">
                          {installmentAmountType === 'por_parcela'
                            ? `${installmentTotal || 12}x de ${formatBRL(numAmount)}`
                            : `${installmentTotal || 12}x de ${formatBRL(numAmount / (Number(installmentTotal) || 12))}`
                          }
                        </strong>
                      </div>
                      <span className="text-[10px] text-purple-300/70">
                        {installmentAmountType === 'por_parcela'
                          ? `Total acumulado do contrato: ${formatBRL(numAmount * (Number(installmentTotal) || 12))}`
                          : `Valor total do contrato: ${formatBRL(numAmount)}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="relative">
              <label className="block text-xs font-semibold text-white/70 mb-1">Meio de Pagamento</label>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'paymentMethod' ? null : 'paymentMethod')}
                disabled={isPaidLocked}
                className="w-full bg-[#1A1A1E] border border-white/10 hover:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition disabled:opacity-50"
              >
                <span className="truncate">{paymentMethod}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
              </button>
              {openDropdown === 'paymentMethod' && (
                <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                  {['PIX', 'Boleto', 'Cartão de Crédito', 'Débito', 'Dinheiro', 'Transferência', 'SEM PAGAMENTO'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm as PaymentMethod);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${
                        paymentMethod === pm ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {pm === 'Boleto' ? 'Boleto Bancário' : pm === 'Débito' ? 'Débito Automático' : pm}
                    </button>
                  ))}
                </div>
              )}
            </div>





            {/* Toggle Paid */}
            <div className="p-3.5 bg-[#1A1A1E] border border-white/5 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Já foi pago?</span>
                </div>
                <div className="text-[10px] text-emerald-300/70 mt-0.5">
                  Se ativado, a conta será quitada e lançada automaticamente como despesa confirmada no relatório.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950"></div>
              </label>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="shrink-0 px-5 py-4 border-t border-white/10 bg-[#1A1A1E] flex items-center justify-between gap-3">
            <div>
              {editingBill && onDelete && (
                confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
                    <span className="text-xs text-rose-400 font-bold mr-1">Excluir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(editingBill.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold rounded-xl border border-rose-500/30 transition cursor-pointer"
                    >
                      Apenas Esta
                    </button>
                    {matchingBills.length > 1 && onDeleteMultiple && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteMultiple(matchingBills.map((b) => b.id));
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition shadow-md cursor-pointer"
                      >
                        Todas as {matchingBills.length} Iguais
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#141416] hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold rounded-xl transition border border-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingBill ? 'Salvar Alterações' : 'Agendar Conta'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
