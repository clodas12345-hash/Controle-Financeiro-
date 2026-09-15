import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CreditCard as CardIcon, Calendar, CheckCircle2 } from 'lucide-react';
import { CreditCard } from '../types';
import { BankLogo } from './BankLogo';

interface BestCardWidgetProps {
  creditCards: CreditCard[];
  onOpenManage: () => void;
}


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

export const BestCardWidget: React.FC<BestCardWidgetProps> = ({ creditCards, onOpenManage, onOpenNfc }) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [queryDate, setQueryDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const queryDay = new Date(queryDate + 'T00:00:00').getDate() || 1;

  const getDaysSince = (day: number) => {
    let diff = queryDay - day;
    if (diff < 0) diff += 31; // using 31 for better month wrap
    return diff;
  };
  const sortedCards = [...creditCards].sort((a, b) => getDaysSince(a.bestDay) - getDaysSince(b.bestDay));
  const bestCard = sortedCards[0];

  const getCardContainerStyle = (name: string) => {
    if (!name) return 'bg-[#18181B] border-white/10';
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    
    if (normalized.includes('nubank') || normalized.includes('nu')) return 'bg-gradient-to-br from-[#8A05BE]/50 via-[#26103D] to-[#12051E] border-[#8A05BE] shadow-[0_0_35px_rgba(138,5,190,0.5)]';
    if (normalized.includes('itau')) return 'bg-gradient-to-br from-[#EC7000]/50 via-[#331C08] to-[#1A0D03] border-[#EC7000] shadow-[0_0_35px_rgba(236,112,0,0.5)]';
    if (normalized.includes('bradesco')) return 'bg-gradient-to-br from-[#CC092F]/50 via-[#330810] to-[#1A0306] border-[#CC092F] shadow-[0_0_35px_rgba(204,9,47,0.5)]';
    if (normalized.includes('santander')) return 'bg-gradient-to-br from-[#CC0000]/50 via-[#330505] to-[#1A0202] border-[#CC0000] shadow-[0_0_35px_rgba(204,0,0,0.5)]';
    if (normalized.includes('caixa')) return 'bg-gradient-to-br from-[#005CA9]/50 via-[#0A223A] to-[#040D17] border-[#005CA9] shadow-[0_0_35px_rgba(0,92,169,0.5)]';
    if (normalized.includes('bancodobrasil') || normalized.includes('bb')) return 'bg-gradient-to-br from-[#F9D308]/40 via-[#332C03] to-[#1A1601] border-[#F9D308] shadow-[0_0_35px_rgba(249,211,8,0.4)]';
    if (normalized.includes('inter')) return 'bg-gradient-to-br from-[#FF7A00]/50 via-[#331E05] to-[#1A0F02] border-[#FF7A00] shadow-[0_0_35px_rgba(255,122,0,0.5)]';
    if (normalized.includes('digio')) return 'bg-gradient-to-br from-[#00A4E4]/50 via-[#052C3D] to-[#02151E] border-[#00A4E4] shadow-[0_0_35px_rgba(0,164,228,0.5)]';
    if (normalized.includes('c6')) return 'bg-gradient-to-br from-zinc-700/60 via-zinc-900 to-black border-zinc-500 shadow-[0_0_35px_rgba(255,255,255,0.2)]';
    if (normalized.includes('xp')) return 'bg-gradient-to-br from-yellow-400/40 via-zinc-900 to-black border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.4)]';
    if (normalized.includes('btg')) return 'bg-gradient-to-br from-[#002B49]/70 via-[#0A1A28] to-[#040A10] border-[#004B7C] shadow-[0_0_35px_rgba(0,75,124,0.5)]';
    if (normalized.includes('picpay')) return 'bg-gradient-to-br from-[#11C76F]/50 via-[#08331D] to-[#031A0E] border-[#11C76F] shadow-[0_0_35px_rgba(17,199,111,0.5)]';
    if (normalized.includes('pagbank')) return 'bg-gradient-to-br from-[#00B962]/50 via-[#02331C] to-[#011A0E] border-[#00B962] shadow-[0_0_35px_rgba(0,185,98,0.5)]';
    if (normalized.includes('neon')) return 'bg-gradient-to-br from-[#00E5C9]/50 via-[#02332E] to-[#011A17] border-[#00E5C9] shadow-[0_0_35px_rgba(0,229,201,0.5)]';
    
    return 'bg-[#18181B] border-white/20';
  };

  return (
    <div className={`rounded-3xl p-5 sm:p-6 border relative flex flex-col h-full transition-all duration-500 ${getCardContainerStyle(bestCard?.name || '')}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <CardIcon className="w-5 h-5" />
          </div>
          <h3 className="text-white font-bold text-sm">Cartões por Melhor Dia</h3>
        </div>
        <button
          onClick={onOpenManage}
          className="text-[10px] sm:text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition border border-purple-500/20"
        >
          Gerenciar
        </button>
      </div>

      {/* Query Date Calendar Box */}
      <div className="mb-4 bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-200">Escolha a data da compra:</span>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            <input
              type="date"
              value={queryDate}
              onChange={(e) => e.target.value && setQueryDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
        {bestCard && (
          <div className="text-[11px] text-slate-200 bg-white/5 px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between">
            <span>Recomendado para o dia {queryDay}: <strong className="text-white font-bold">{bestCard.name}</strong></span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">Melhor dia: {bestCard.bestDay}</span>
          </div>
        )}
      </div>

      <div className="relative flex-1">
        {selectedCardId ? (
          <div className="flex flex-col h-full justify-center space-y-6 animate-fadeIn">
            {(() => {
              const card = creditCards.find(c => c.id === selectedCardId);
              if (!card) return null;
              return (
                <>
                  <div className={`w-full rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative border border-white/20 ${getCardStyle(card.name)} h-40`}>
                    <div className="flex justify-between items-start">
                      <BankLogo name={card.name} customLogo={card.customLogo} className="w-10 h-10 rounded-lg shadow-sm" />
                      <div className="text-right">
                        <span className="text-[10px] opacity-75 uppercase tracking-widest font-semibold block">Melhor Dia</span>
                        <span className="text-lg font-bold">Dia {card.bestDay}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="font-bold tracking-widest text-xl drop-shadow-md truncate max-w-[200px]">{card.name}</p>
                      <div className="opacity-40">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCardId(null)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 border border-white/10"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                </>
              );
            })()}
          </div>
        ) : sortedCards.length > 0 ? (
          <div className="space-y-[-70px] pt-4 transition-all group/stack">
            {sortedCards.map((card, index) => (
              <div 
                key={card.id} 
                className={`h-32 rounded-2xl p-4 flex flex-col justify-between shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.5)] relative border border-white/20 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl cursor-pointer ${getCardStyle(card.name)} ${index === 0 ? 'ring-4 ring-purple-400/50 animate-pulse z-10' : 'opacity-0 pointer-events-none group-hover/stack:opacity-100 group-hover/stack:pointer-events-auto group-hover/stack:translate-y-2'}`}
                style={{ zIndex: sortedCards.length - index }}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className="flex justify-between items-start">
                  <BankLogo name={card.name} customLogo={card.customLogo} className="w-8 h-8 rounded-md shadow-sm" />
                  <div className="text-right">
                    <span className="text-[9px] opacity-75 uppercase tracking-widest font-semibold block">Melhor Dia</span>
                    <span className="text-sm font-bold">Dia {card.bestDay}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <p className="font-bold tracking-widest text-base drop-shadow-md truncate max-w-[150px]">{card.name}</p>
                  {index === 0 ? (
                    <div className="bg-emerald-500/20 text-emerald-100 text-[10px] px-2 py-1 rounded-lg border border-emerald-500/30 font-bold uppercase tracking-wider backdrop-blur-md">
                      Melhor Agora
                    </div>
                  ) : (
                    <div className="opacity-40">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 bg-white/5 border border-white/5 border-dashed rounded-2xl text-center gap-2">
            <CardIcon className="w-6 h-6 text-slate-500" />
            <p className="text-xs text-slate-400">Nenhum cartão cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
