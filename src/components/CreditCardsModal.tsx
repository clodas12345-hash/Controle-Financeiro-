import React, { useState } from 'react';
import { X, Plus, Trash2, CreditCard as CardIcon, Save, Search, Camera } from 'lucide-react';
import { CreditCard } from '../types';
import { BankLogo } from './BankLogo';


const getCardStyle = (name: string) => {
  if (!name) return 'bg-gradient-to-br from-slate-700 to-slate-900 text-white';
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  
  if (normalized.includes('nubank') || normalized.includes('nu')) return 'bg-gradient-to-br from-[#8A05BE] to-[#5a0380] text-white';
  if (normalized.includes('itau')) return 'bg-gradient-to-br from-[#EC7000] to-[#E84E1B] text-white';
  if (normalized.includes('bradesco')) return 'bg-gradient-to-br from-[#CC092F] to-[#8C001A] text-white';
  if (normalized.includes('santander')) return 'bg-gradient-to-br from-[#CC0000] to-[#800000] text-white';
  if (normalized.includes('caixa')) return 'bg-gradient-to-br from-[#005CA9] to-[#003B73] text-white';
  if (normalized.includes('bancodobrasil') || normalized.includes('bb')) return 'bg-gradient-to-br from-[#F9D308] to-[#D4B506] text-slate-900';
  if (normalized.includes('inter')) return 'bg-gradient-to-br from-[#FF7A00] to-[#CC6200] text-white';
  if (normalized.includes('c6')) return 'bg-gradient-to-br from-[#242424] to-[#000000] text-white';
  if (normalized.includes('xp')) return 'bg-gradient-to-br from-[#000000] to-[#1a1a1a] text-[#FFD700]';
  if (normalized.includes('btg')) return 'bg-gradient-to-br from-[#002B49] to-[#001726] text-white';
  if (normalized.includes('picpay')) return 'bg-gradient-to-br from-[#11C76F] to-[#0B8A4D] text-white';
  if (normalized.includes('pagbank')) return 'bg-gradient-to-br from-[#00B962] to-[#008A49] text-white';
  if (normalized.includes('neon')) return 'bg-gradient-to-br from-[#00E5C9] to-[#00A38C] text-[#000000]';
  
  return 'bg-gradient-to-br from-slate-700 to-slate-800 text-white';
};

const TOP_BANKS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 
  'Banco do Brasil', 'Inter', 'C6 Bank', 'XP', 'BTG Pactual', 
  'PicPay', 'PagBank', 'Safra', 'Original', 'Neon'
];

interface CreditCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCards: CreditCard[];
  onSave: (cards: CreditCard[]) => void;
}

export const CreditCardsModal: React.FC<CreditCardsModalProps> = ({ isOpen, onClose, creditCards, onSave }) => {
  const [cards, setCards] = useState<CreditCard[]>(creditCards || []);
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setCards(creditCards || []);
    }
  }, [isOpen, creditCards]);

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

  const handleAddCard = () => {
    const newCard: CreditCard = {
      id: Math.random().toString(36).substring(2, 9),
      name: '',
      bestDay: 1,
    };
    setCards([...cards, newCard]);
  };

  const handleUploadLogo = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpdateCard(id, 'customLogo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCard = (id: string) => {
    console.log('Removing card:', id);
    setCards(cards.filter(c => c.id !== id));
  };

  const handleUpdateCard = (id: string, field: keyof CreditCard, value: any) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    console.log('Saving cards:', cards);
    const validCards = cards.filter(c => c.name.trim() !== '');
    onSave(validCards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#18181B] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <CardIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Meus Cartões</h3>
              <p className="text-xs text-slate-400 font-medium">Configure os melhores dias para compra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
            O <strong>Melhor dia</strong> é o dia em que a sua fatura fecha. Compras feitas a partir deste dia só serão pagas na fatura do mês seguinte.
          </p>

          <div className="space-y-3">
            {cards.map((card, index) => (
              <div key={card.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="shrink-0 flex self-center sm:self-auto pt-4 sm:pt-0 relative group">
                   <label className="cursor-pointer block relative" title="Alterar logo do cartão">
                     <BankLogo name={card.name} customLogo={card.customLogo} className="w-12 h-12 group-hover:opacity-75 transition" />
                     <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                       <Camera className="w-5 h-5 text-white/90" />
                     </div>
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) handleUploadLogo(card.id, file);
                       }}
                     />
                   </label>
                </div>
                
                <div className="flex-1 w-full space-y-1 relative">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-1">Nome do Cartão</label>
                  <input
                    type="text"
                    value={card.name}
                    onChange={(e) => {
                      handleUpdateCard(card.id, 'name', e.target.value);
                      setShowSuggestions(card.id);
                    }}
                    onFocus={() => setShowSuggestions(card.id)}
                    placeholder="Ex: Nubank, Itaú..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                  {showSuggestions === card.id && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {TOP_BANKS.filter(b => b.toLowerCase().includes(card.name.toLowerCase())).map(bank => (
                        <button key={bank} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-purple-600/50" onClick={() => { handleUpdateCard(card.id, 'name', bank); setShowSuggestions(null); }}>{bank}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-28 space-y-1 shrink-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-1">Melhor Dia</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={card.bestDay}
                    onChange={(e) => handleUpdateCard(card.id, 'bestDay', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <button
                  onClick={() => handleRemoveCard(card.id)}
                  className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition self-end sm:self-auto shrink-0 mb-1"
                  title="Remover Cartão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {cards.length === 0 && (
              <div className="text-center p-8 bg-white/5 border border-white/5 border-dashed rounded-2xl">
                <p className="text-sm text-slate-400 mb-4">Nenhum cartão configurado.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAddCard}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-purple-400 font-semibold rounded-xl border border-white/10 border-dashed transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Cartão
          </button>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#18181B] shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            <Save className="w-5 h-5" />
            Salvar Cartões
          </button>
        </div>
      </div>
    </div>
  );
};
