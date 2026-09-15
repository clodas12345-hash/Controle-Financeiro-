import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Trash2, ChevronDown, Car, Briefcase, Calendar } from 'lucide-react';
import {
  Transaction,
  TransactionCategory,
  CategoryScope,
  PaymentMethod,
  TransactionType,
  SCOPE_CATEGORIES,
} from '../types';
import { getTodayStr, getYesterdayStr, getIncomeProfile } from '../lib/storage';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  defaultScope?: CategoryScope;
  defaultCategory?: TransactionCategory;
  defaultType?: TransactionType;
  defaultDescription?: string;
  editingTransaction?: Transaction | null;
}

const getAllowedCategories = (scope: CategoryScope): TransactionCategory[] => {
  return SCOPE_CATEGORIES[scope];
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultScope = 'geral',
  defaultCategory = 'Outros',
  defaultType = 'despesa',
  defaultDescription = '',
  editingTransaction = null,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<TransactionCategory>(defaultCategory);
  const [scope, setScope] = useState<CategoryScope>(defaultScope);
  const [date, setDate] = useState(getTodayStr());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("fin_control_custom_categories_v1");
      if (saved) setCustomCategories(JSON.parse(saved));
    } catch (e) {}
  }, []);
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


  const handleNewCategory = () => {
    setShowNewCategoryInput(true);
  };

  const [incomeSource, setIncomeSource] = useState<'onix' | '208' | 'd1' | 'outros'>('onix');

  React.useEffect(() => {
    if (editingTransaction && editingTransaction.id && editingTransaction.id.trim() !== '') {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount || '');
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setScope(editingTransaction.scope);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setIsInstallment(!!editingTransaction.installment);
      setTotalInstallments(editingTransaction.installment?.total || '');
      setNotes(editingTransaction.notes || '');

      const descLower = (editingTransaction.description || '').toLowerCase();
      if (descLower.includes('ônix') || descLower.includes('onix')) {
        setIncomeSource('onix');
      } else if (descLower.includes('208')) {
        setIncomeSource('208');
      } else if (descLower.includes('d1')) {
        setIncomeSource('d1');
      } else {
        setIncomeSource('outros');
      }
    } else {
      setDescription(defaultDescription || (editingTransaction?.description || ''));
      setAmount('');
      setType(defaultType);
      setCategory(defaultCategory);
      setScope(defaultScope);
      setDate(getTodayStr());
      setPaymentMethod('PIX');
      setIsInstallment(false);
      setTotalInstallments('');
      setNotes('');
      setIncomeSource('onix');
    }
  }, [editingTransaction, isOpen, defaultScope, defaultCategory, defaultType, defaultDescription]);

  // Allow receita for any scope without forcing despesa

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      alert('Por favor, informe um valor numérico válido maior que R$ 0,00.');
      return;
    }

    const finalDescription = description.trim() || category || 'Lançamento';
    const targetId = editingTransaction?.id && editingTransaction.id.trim() !== '' ? editingTransaction.id : undefined;

    onSave(
      {
        description: finalDescription,
        amount: numVal,
        type,
        category,
        scope,
        date: date || getTodayStr(),
        paymentMethod,
        paid: true,
        notes: notes || undefined,
        installment: isInstallment && totalInstallments ? { current: 1, total: Number(totalInstallments) } : undefined,
      },
      targetId
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#161618] border border-white/10 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6 shrink-0 bg-[#1A1A1C]">
          <h3 className="text-base font-light text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            {editingTransaction ? 'Editar Lançamento' : 'Cadastrar Lançamento'}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2 bg-[#1A1A1C] p-1 rounded-full border border-white/5">
            <button
              type="button"
              onClick={() => setType('despesa')}
              className={`py-2 text-xs font-semibold rounded-full transition cursor-pointer ${
                type === 'despesa' ? 'bg-rose-500 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Despesa (-)
            </button>
            <button
              type="button"
              onClick={() => setType('receita')}
              className={`py-2 text-xs font-semibold rounded-full transition cursor-pointer ${
                type === 'receita' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-white/40 hover:text-white'
              }`}
            >
              Receita (+)
            </button>
          </div>

          {/* Organização das Entradas por Ônix, 208 e D1 */}
          {type === 'receita' && (
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-emerald-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  Organizar Entrada por Origem
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ônix • 208 • D1
                </span>
              </div>

              {/* Seletor da Fonte / Veículo */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIncomeSource('onix');
                    if (!description || description.includes('208') || description.includes('D1')) {
                      setDescription('Ganhos Ônix');
                    }
                    setCategory('Salário/Renda');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    incomeSource === 'onix'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>Ônix</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIncomeSource('208');
                    if (!description || description.includes('Ônix') || description.includes('D1')) {
                      setDescription('Ganhos 208');
                    }
                    setCategory('Salário/Renda');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    incomeSource === '208'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>208</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIncomeSource('d1');
                    if (!description || description.includes('Ônix') || description.includes('208')) {
                      setDescription('Ganhos D1');
                    }
                    setCategory('Salário/Renda');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    incomeSource === 'd1'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Briefcase className="w-3 h-3" />
                  <span>D1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIncomeSource('outros');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    incomeSource === 'outros'
                      ? 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Outros</span>
                </button>
              </div>

              {/* Opções de Entradas Semanais */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Opções de Entradas Semanais
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Selecione a semana do mês
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Semana 1', tag: 'Semana 1' },
                    { label: 'Semana 2', tag: 'Semana 2' },
                    { label: 'Semana 3', tag: 'Semana 3' },
                    { label: 'Semana 4', tag: 'Semana 4' },
                    { label: 'Semana 5', tag: 'Semana 5' },
                    { label: 'Entrada Semanal', tag: 'Semanal' },
                  ].map((w) => {
                    const isSelected = description.toLowerCase().includes(w.tag.toLowerCase());
                    return (
                      <button
                        key={w.label}
                        type="button"
                        onClick={() => {
                          const srcName =
                            incomeSource === 'onix'
                              ? 'Ganhos Ônix'
                              : incomeSource === '208'
                              ? 'Ganhos 208'
                              : incomeSource === 'd1'
                              ? 'Ganhos D1'
                              : 'Entrada Semanal';
                          
                          // If description already has something base, append or replace week tag
                          let base = description.replace(/\s*-\s*Semana\s*\d+/gi, '').replace(/\s*-\s*Semanal/gi, '').trim();
                          if (!base || base === 'Ganhos Ônix' || base === 'Ganhos 208' || base === 'Ganhos D1' || base === 'Entrada Semanal') {
                            base = srcName;
                          }
                          setDescription(`${base} - ${w.tag}`);
                          setCategory('Salário/Renda');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        📅 {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets específicos do Ônix */}
              {incomeSource === 'onix' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-emerald-300/80 font-medium">
                    Atalhos rápidos para <strong className="text-white">Ônix</strong>:
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'Ganhos Ônix', desc: 'Ganhos Ônix' },
                      { label: 'Semana 1', desc: 'Ganhos Ônix - Semana 1' },
                      { label: 'Semana 2', desc: 'Ganhos Ônix - Semana 2' },
                      { label: 'Semana 3', desc: 'Ganhos Ônix - Semana 3' },
                      { label: 'Semana 4', desc: 'Ganhos Ônix - Semana 4' },
                      { label: 'Uber Ônix', desc: 'Uber - Ônix' },
                      { label: '99 App Ônix', desc: '99 App - Ônix' },
                      { label: 'Diária Ônix', desc: 'Diária Ônix' },
                      { label: 'Bônus Ônix', desc: 'Bônus/Meta Ônix' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDescription(p.desc);
                          setCategory('Salário/Renda');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl border transition cursor-pointer ${
                          description === p.desc
                            ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets específicos do 208 */}
              {incomeSource === '208' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-emerald-300/80 font-medium">
                    Atalhos rápidos para <strong className="text-white">208</strong>:
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'Ganhos 208', desc: 'Ganhos 208' },
                      { label: 'Semana 1', desc: 'Ganhos 208 - Semana 1' },
                      { label: 'Semana 2', desc: 'Ganhos 208 - Semana 2' },
                      { label: 'Semana 3', desc: 'Ganhos 208 - Semana 3' },
                      { label: 'Semana 4', desc: 'Ganhos 208 - Semana 4' },
                      { label: 'Uber 208', desc: 'Uber - 208' },
                      { label: '99 App 208', desc: '99 App - 208' },
                      { label: 'Diária 208', desc: 'Diária 208' },
                      { label: 'Bônus 208', desc: 'Bônus/Meta 208' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDescription(p.desc);
                          setCategory('Salário/Renda');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl border transition cursor-pointer ${
                          description === p.desc
                            ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets específicos do D1 */}
              {incomeSource === 'd1' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-amber-300/80 font-medium">
                    Atalhos rápidos para <strong className="text-white">D1</strong>:
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'Ganhos D1', desc: 'Ganhos D1' },
                      { label: 'Semana 1', desc: 'Ganhos D1 - Semana 1' },
                      { label: 'Semana 2', desc: 'Ganhos D1 - Semana 2' },
                      { label: 'Semana 3', desc: 'Ganhos D1 - Semana 3' },
                      { label: 'Semana 4', desc: 'Ganhos D1 - Semana 4' },
                      { label: 'Turno D1', desc: 'Turno - D1' },
                      { label: 'Faturamento D1', desc: 'Faturamento D1' },
                      { label: 'Diária D1', desc: 'Diária D1' },
                      { label: 'Bônus D1', desc: 'Bônus/Meta D1' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDescription(p.desc);
                          setCategory('Salário/Renda');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl border transition cursor-pointer ${
                          description === p.desc
                            ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets Gerais / CLT / MEU */}
              {incomeSource === 'outros' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Outras Rendas & Receitas Gerais:
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'Semana 1', desc: 'Entrada Semanal 1' },
                      { label: 'Semana 2', desc: 'Entrada Semanal 2' },
                      { label: 'Semana 3', desc: 'Entrada Semanal 3' },
                      { label: 'Semana 4', desc: 'Entrada Semanal 4' },
                      { label: 'Salário Principal', desc: 'Salário Principal' },
                      { label: 'Pro-Labore', desc: 'Pro-Labore' },
                      { label: 'Serviços', desc: 'Prestação de Serviços' },
                      { label: 'Renda Extra', desc: 'Renda Extra' },
                      { label: 'Rendimento', desc: 'Rendimento de Investimentos' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDescription(p.desc);
                          setCategory('Salário/Renda');
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-semibold rounded-xl border border-white/10 transition cursor-pointer"
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Compras Semanais, Abastecimento, Aluguel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount === '' ? '' : amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setAmount('');
                  } else {
                    const parsed = parseFloat(val);
                    setAmount(isNaN(parsed) ? '' : parsed);
                  }
                }}
                className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-light text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-white/50">Data</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate(getTodayStr())}
                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 transition cursor-pointer"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(getYesterdayStr())}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-white/70 px-2 py-0.5 rounded border border-white/10 transition cursor-pointer"
                  >
                    Ontem
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-white/50">Escopo</label>
                <button type="button" onClick={() => alert('Em desenvolvimento')} className="text-[10px] text-emerald-400 hover:text-emerald-300">+ Novo</button>
              </div>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'txScope' ? null : 'txScope')}
                className="w-full bg-[#1A1A1C] border border-white/10 hover:border-emerald-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition"
              >
                <span className="truncate">
                  {scope === 'casa' && 'Casa'}
                  {scope === 'pagamentos' && 'Pagamentos Fixos'}
                  {scope === 'geral' && 'Geral / Pessoal'}
                  {scope === 'pet' && 'Pet'}
                  {scope === 'empresa' && 'Empresa'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
              </button>
              {openDropdown === 'txScope' && (
                <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                  {[
                    { value: 'casa', label: 'Casa' },
                    { value: 'pagamentos', label: 'Pagamentos Fixos' },
                    { value: 'geral', label: 'Geral / Pessoal' },
                    { value: 'pet', label: 'Pet' },
                    { value: 'empresa', label: 'Empresa' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        const newScope = item.value as CategoryScope;
                        setScope(newScope);
                        const allowed = getAllowedCategories(newScope);
                        if (!allowed.includes(category)) {
                          setCategory(allowed[0]);
                        }
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${
                        scope === item.value ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
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
                <label className="text-xs font-medium text-white/50">Categoria</label>
                <button type="button" onClick={() => setShowNewCategoryInput(!showNewCategoryInput)} className="text-[10px] text-emerald-400 hover:text-emerald-300">+ Novo</button>
              </div>

              {showNewCategoryInput ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    placeholder="Nome da categoria"
                    value={newCategoryText}
                    onChange={(e) => setNewCategoryText(e.target.value)}
                    className="flex-1 bg-[#1A1A1C] border border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryText.trim()) {
                        const trimmed = newCategoryText.trim();
                        if (!customCategories.includes(trimmed)) {
                          const updated = [...customCategories, trimmed];
                          setCustomCategories(updated);
                          localStorage.setItem("fin_control_custom_categories_v1", JSON.stringify(updated));
                        }
                        setCategory(trimmed as TransactionCategory);
                        setNewCategoryText('');
                        setShowNewCategoryInput(false);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'txCategory' ? null : 'txCategory')}
                    className="w-full bg-[#1A1A1C] border border-white/10 hover:border-emerald-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition"
                  >
                    <span className="truncate">{category || 'Selecione...'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
                  </button>
                  {openDropdown === 'txCategory' && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                      {[...getAllowedCategories(scope), ...customCategories].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat as TransactionCategory);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${
                            category === cat ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(true);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-emerald-400 font-bold hover:bg-slate-800 transition border-t border-white/10"
                      >
                        + Criar Nova Categoria...
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-white/50 mb-1">Forma de Pagamento</label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'txPaymentMethod' ? null : 'txPaymentMethod')}
              className="w-full bg-[#1A1A1C] border border-white/10 hover:border-emerald-400 rounded-2xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition"
            >
              <span className="truncate">{paymentMethod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
            </button>
            {openDropdown === 'txPaymentMethod' && (
              <div className="absolute left-0 right-0 mt-1 bg-[#1F1F23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                {['PIX', 'Cartão de Crédito', 'Boleto', 'Débito', 'Dinheiro', 'Transferência', 'SEM PAGAMENTO'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm as PaymentMethod);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition border-b border-white/5 last:border-0 ${
                      paymentMethod === pm ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="rounded border-white/10 bg-[#1A1A1C] text-emerald-500 focus:ring-emerald-500"
              />
              Parcelado
            </label>
            {isInstallment && (
              <div className="flex-1">
                <input
                  type="number"
                  min="2"
                  placeholder="Qtd. de vezes"
                  value={totalInstallments === 0 ? '' : totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Observações (Opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais ou detalhes..."
              className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white h-16 focus:outline-none focus:border-emerald-400"
            />
          </div>



          </div>

          <div className="shrink-0 p-4 sm:px-6 sm:py-4 border-t border-white/10 bg-[#1A1A1C] flex items-center justify-between gap-2">
            <div>
              {editingTransaction && onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <span className="text-xs text-rose-400 font-semibold">Excluir?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(editingTransaction.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-full transition shadow-sm"
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-full transition"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-semibold rounded-full transition flex items-center gap-1.5 border border-rose-500/25"
                    title="Excluir Lançamento"
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="px-5 py-2.5 bg-[#1A1A1C] hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold rounded-full transition border border-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-full transition shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
