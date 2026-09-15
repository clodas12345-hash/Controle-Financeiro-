import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, X, Check, Loader2, Bot, Wand2, GripVertical } from 'lucide-react';
import { Transaction, TransactionCategory, CategoryScope, PaymentMethod, TransactionType } from '../types';
import { formatBRL } from '../lib/storage';

interface AiAssistantProps {
  onSaveTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantProps> = ({ onSaveTransaction, isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [successItem, setSuccessItem] = useState<{ description: string; amount: number; type: string } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);

  // Position for draggable floating button (null = default CSS fixed positioning)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setShowManualModal(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowManualModal(false);
        if (onClose) onClose();
      }
    };
    if (showManualModal || isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showManualModal, isOpen, onClose]);

  // Manual fallback modal states
  const [promptText, setPromptText] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editType, setEditType] = useState<TransactionType>('despesa');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Outros');
  const [editScope, setEditScope] = useState<CategoryScope>('geral');
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 10));
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('PIX');
  const [editNotes, setEditNotes] = useState('');
  
  // Keep microphone active to prevent repeated browser prompts
  const persistentStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (persistentStreamRef.current) {
        persistentStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const samplePrompts = [
    'Abasteci 40 litros de gasolina por R$ 250 no posto Ipiranga',
    'Gastei R$ 185 na Fatura de Cartão com PIX',
    'Paguei a conta de luz da Enel de R$ 210',
    'Recebi meu salário de R$ 6.500 via transferência',
  ];

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const currX = position ? position.x : Math.max(20, window.innerWidth - 80);
    const currY = position ? position.y : 20;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currX,
      initialY: currY,
    };
    e.stopPropagation();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const currX = position ? position.x : Math.max(20, window.innerWidth - 80);
      const currY = position ? position.y : 20;
      setIsDragging(true);
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialX: currX,
        initialY: currY,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(20, Math.min(window.innerWidth - 80, dragRef.current.initialX + dx));
      const newY = Math.max(20, Math.min(window.innerHeight - 80, dragRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      const newX = Math.max(20, Math.min(window.innerWidth - 80, dragRef.current.initialX + dx));
      const newY = Math.max(20, Math.min(window.innerHeight - 80, dragRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const processAndSaveText = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setTranscriptText(text);

    try {
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success && data.parsed) {
        const d = data.parsed.data;
        const newTx = {
          description: d.description || text,
          amount: Number(d.amount) || 50,
          type: (d.type || 'despesa') as TransactionType,
          category: (d.category || 'Outros') as TransactionCategory,
          scope: (d.scope || 'geral') as CategoryScope,
          date: d.date || new Date().toISOString().slice(0, 10),
          paymentMethod: (d.paymentMethod || 'PIX') as PaymentMethod,
          paid: true,
          notes: d.notes || text,
        };

        onSaveTransaction(newTx);
        setSuccessItem({
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
        });

        setTimeout(() => {
          setSuccessItem(null);
        }, 4000);
      }
    } catch (err) {
      console.error('AI voice parse error:', err);
    } finally {
      setIsLoading(false);
      setTranscriptText('');
    }
  };

  const startListening = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setShowManualModal(true);
      return;
    }

    if (isListening) return;

    try {
      if (!persistentStreamRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          persistentStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permErr) {
          console.error('Microphone permission denied:', permErr);
          setShowManualModal(true);
          return;
        }
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSuccessItem(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscriptText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setShowManualModal(true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcriptText.trim()) {
          processAndSaveText(transcriptText);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setShowManualModal(true);
    }
  };

  const handleManualParse = async () => {
    if (!promptText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: promptText }),
      });
      const data = await res.json();
      if (data.success && data.parsed) {
        setParsedResult(data.parsed);
        const d = data.parsed.data;
        setEditDesc(d.description || promptText);
        setEditAmount(d.amount || 0);
        setEditType(d.type || 'despesa');
        setEditCategory(d.category || 'Outros');
        setEditScope(d.scope || 'geral');
        setEditDate(d.date || new Date().toISOString().slice(0, 10));
        setEditPaymentMethod(d.paymentMethod || 'PIX');
        setEditNotes(d.notes || promptText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmManualSave = () => {
    if (!editDesc || editAmount <= 0) return;
    onSaveTransaction({
      description: editDesc,
      amount: Number(editAmount),
      type: editType,
      category: editCategory,
      scope: editScope,
      date: editDate,
      paymentMethod: editPaymentMethod,
      paid: true,
      notes: editNotes,
    });
    setShowManualModal(false);
    if (onClose) onClose();
    setParsedResult(null);
    setPromptText('');
    setSuccessItem({
      description: editDesc,
      amount: Number(editAmount),
      type: editType,
    });
    setTimeout(() => setSuccessItem(null), 4000);
  };

  const handleCloseManualModal = () => {
    setShowManualModal(false);
    if (onClose) onClose();
  };

  if (!isOpen && !showManualModal) return null;

  return (
    <>
      {/* Draggable Floating Container */}
      <div
        style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
        className={`fixed z-50 flex flex-col items-end gap-2 select-none touch-none ${
          !position ? 'top-6 right-6 sm:top-8 sm:right-8' : ''
        }`}
      >
        {/* Live Listening Banner / Waveform */}
        {isListening && (
          <div className="absolute left-0 bottom-20 bg-[#121214]/95 border border-emerald-500/50 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn w-72">
            <div className="relative flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute"></div>
              <Mic className="w-5 h-5 text-emerald-400 relative z-10 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                Ouvindo agora...
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </p>
              <p className="text-[11px] text-emerald-300 truncate italic">
                {transcriptText || 'Fale o que gastou ou recebeu...'}
              </p>
            </div>
          </div>
        )}

        {/* Loading Banner */}
        {isLoading && !isListening && (
          <div className="absolute left-0 bottom-20 bg-[#121214]/95 border border-cyan-500/50 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <div>
              <p className="text-xs font-bold text-white">IA processando voz...</p>
              <p className="text-[10px] text-white/50 truncate max-w-[180px]">{transcriptText}</p>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {successItem && (
          <div className="absolute left-0 bottom-20 bg-emerald-950/95 border border-emerald-500/60 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn w-72">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-300">Registrado por IA!</p>
              <p className="text-[11px] text-white/90 font-medium truncate">
                {successItem.description} ({successItem.type === 'receita' ? '+' : '-'} {formatBRL(successItem.amount)})
              </p>
            </div>
          </div>
        )}

        {/* Floating Capsule with Drag Handle */}
        <div className="flex items-center gap-1 bg-[#121214]/90 backdrop-blur-md border border-white/20 p-1.5 rounded-full shadow-2xl">
          {/* Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="p-2 cursor-grab active:cursor-grabbing text-white/40 hover:text-white transition flex items-center justify-center"
            title="Arraste para mover o botão"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {isExpanded && (
            <>
              {/* Text input modal opener */}
              <button
                onClick={() => {
                  setShowManualModal(true);
                  setParsedResult(null);
                  setPromptText('');
                }}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white p-2.5 rounded-full transition"
                title="Digitar transação com IA"
              >
                <Bot className="w-4 h-4" />
              </button>

              {/* Instant Voice Mic Button */}
              <button
                onClick={startListening}
                className={`flex items-center gap-2 font-bold px-4 py-3 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:opacity-90'
                }`}
                title="Clique e fale instantaneamente"
              >
                {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4 text-slate-950" />}
                <span className="text-xs tracking-wider uppercase font-black">
                  {isListening ? 'Ouvindo...' : 'Falar IA'}
                </span>
              </button>
            </>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 text-emerald-400 hover:text-emerald-300 transition"
            title={isExpanded ? 'Retrair' : 'Expandir'}
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Manual / Text Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn" onClick={() => { setShowManualModal(false); if (onClose) onClose(); }}>
          <div className="bg-[#121214] border border-emerald-500/30 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6 shrink-0 bg-[#161618]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Assistente IA por Texto
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Gemini</span>
                  </h3>
                  <p className="text-xs text-white/50">Digite sua despesa ou receita em linguagem natural</p>
                </div>
              </div>
              <button
                onClick={handleCloseManualModal}
                className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">

            {!parsedResult ? (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Ex: Abasteci 42 litros de gasolina no posto Shell por R$ 265 no cartão de crédito..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Sugestões rápidas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {samplePrompts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPromptText(s);
                        }}
                        className="text-xs bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/10 text-white/80 px-3 py-1.5 rounded-xl transition text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleManualParse}
                    disabled={isLoading || !promptText.trim()}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald-500/25 text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Interpretando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Processar com IA
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs text-emerald-300 font-medium">Dados extraídos com sucesso pela IA</p>
                      <p className="text-[11px] text-white/50">Revise os campos antes de confirmar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setParsedResult(null)}
                    className="text-xs text-white/60 hover:text-white underline"
                  >
                    Voltar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Tipo</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as TransactionType)}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="despesa">Despesa (-)</option>
                      <option value="receita">Receita (+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Categoria</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as TransactionCategory)}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {[
                        'Moradia',
                        'Condomínio',
                        'Energia',
                        'Fatura de Cartão',
                        'Internet/TV',
                        'Combustível',
                        'Manutenção Carro',
                        'IPVA/Licenciamento',
                        'Seguro do Carro',
                        'Financiamento',
                        'Saúde',
                        'Lazer/Restaurante',
                        'Salário/Renda',
                        'Investimento',
                        'Outros',
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Escopo</label>
                    <select
                      value={editScope}
                      onChange={(e) => setEditScope(e.target.value as CategoryScope)}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="geral">Geral</option>
                      <option value="casa">Casa</option>
                      <option value="carro">Carro</option>
                      <option value="pagamentos">Pagamentos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Pagamento</label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {['PIX', 'Cartão de Crédito', 'Boleto', 'Débito', 'Dinheiro', 'Transferência', 'SEM PAGAMENTO'].map((pm) => (
                        <option key={pm} value={pm}>
                          {pm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Data</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Observações</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-[#1A1A1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs text-white/60 hover:text-white transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmManualSave}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 text-xs"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar e Inserir
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
