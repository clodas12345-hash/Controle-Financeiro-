import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Check, Trash2 } from 'lucide-react';
import { Bill } from '../types';
import { getTodayStr, formatBRL } from '../lib/storage';

interface EstornoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean }, existingId?: string) => void;
  onDelete?: (id: string) => void;
  editingBill?: Bill | null;
}

export const EstornoModal: React.FC<EstornoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingBill = null,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState(getTodayStr());
  const [expectedDate, setExpectedDate] = useState(getTodayStr());
  const [cardName, setCardName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pendente' | 'recebido'>('pendente');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingBill && editingBill.estorno) {
      setAmount(editingBill.estorno.amount || editingBill.amount || '');
      setPurchaseDate(editingBill.estorno.purchaseDate || getTodayStr());
      setExpectedDate(editingBill.estorno.expectedDate || editingBill.dueDate || getTodayStr());
      setCardName(editingBill.estorno.cardName || '');
      setStoreName(editingBill.estorno.storeName || '');
      setNotes(editingBill.estorno.notes || editingBill.notes || '');
      setStatus(editingBill.estorno.status || 'pendente');
    } else {
      setAmount('');
      setPurchaseDate(getTodayStr());
      setExpectedDate(getTodayStr());
      setCardName('');
      setStoreName('');
      setNotes('');
      setStatus('pendente');
    }
    setConfirmDelete(false);
  }, [editingBill, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
    
    onSave({
      title: `Estorno: ${storeName || 'Compra'}`,
      amount: numAmount || 0,
      dueDate: expectedDate,
      category: 'Outros',
      scope: 'geral',
      paymentMethod: 'SEM PAGAMENTO',
      recurring: 'unico',
      notes: notes.trim() || undefined,
      estorno: {
        status,
        amount: numAmount || undefined,
        notes: notes.trim() || undefined,
        purchaseDate,
        expectedDate,
        cardName: cardName.trim() || undefined,
        storeName: storeName.trim() || undefined,
      },
    }, editingBill?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#141416] border border-amber-500/30 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#1A1A1E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lançar Estorno</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Valor do Estorno (R$)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">R$</span>
              <input 
                type="text" 
                inputMode="numeric" 
                placeholder="0,00" 
                value={typeof amount === 'number' && !isNaN(amount) && amount > 0 ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} 
                onChange={e => { 
                  const digits = e.target.value.replace(/\D/g, ''); 
                  if (!digits) setAmount(''); 
                  else setAmount(Number(digits) / 100); 
                }} 
                className="w-full bg-[#1A1A1E] border border-white/10 focus:border-emerald-400 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-emerald-400 focus:outline-none" 
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Data da Compra</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Previsão</label>
              <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Cartão Utilizado</label>
            <input type="text" placeholder="Ex: Nubank, Inter..." value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Estabelecimento / Loja</label>
            <input type="text" placeholder="Ex: Amazon, Posto..." value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Status do Estorno</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`py-2 text-[10px] font-bold rounded-xl transition ${status === 'pendente' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                AGUARDANDO
              </button>
              <button
                type="button"
                onClick={() => setStatus('recebido')}
                className={`py-2 text-[10px] font-bold rounded-xl transition ${status === 'recebido' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                RECEBIDO
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Observações</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#1A1A1E] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none transition" />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              {editingBill && onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <button type="button" onClick={() => { onDelete(editingBill.id); onClose(); }} className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black rounded-lg transition shadow-md">Sim</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition">Não</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition border border-rose-500/20"><Trash2 className="w-4 h-4" /></button>
                )
              )}
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 bg-white/5 text-white/60 hover:text-white text-xs font-bold rounded-2xl transition">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-2xl transition shadow-lg flex items-center gap-2"><Check className="w-4 h-4 stroke-[3]" /><span>{editingBill ? 'Salvar' : 'Agendar'}</span></button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
