"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Countdown } from '@/components/Countdown';
import { Raffle } from '@/schemas/raffle';
import { Loader2, Ticket, Trophy, ArrowLeft, Search, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;

  const [raffle, setRaffle] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<string[]>([]);
  const [pendingNumbers, setPendingNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCartDetails, setShowCartDetails] = useState(false); // Controle da visualização do carrinho

  useEffect(() => {
    if (!raffleId) return;

    const unsubRaffle = onSnapshot(doc(db, "rifas", raffleId), (snap) => {
      if (snap.exists()) setRaffle({ id: snap.id, ...snap.data() });
    });

    const unsubSold = onSnapshot(collection(db, "rifas", raffleId, "sold_numbers"), (snap) => {
      setSoldNumbers(snap.docs.map(doc => doc.id));
    });

    const unsubPending = onSnapshot(collection(db, "rifas", raffleId, "pending_numbers"), (snap) => {
      setPendingNumbers(snap.docs.map(doc => doc.id));
      setLoading(false);
    });

    return () => { unsubRaffle(); unsubSold(); unsubPending(); };
  }, [raffleId]);

  const totalSold = soldNumbers.length;
  const progress = raffle ? Math.min((totalSold / raffle.totalTickets) * 100, 100) : 0;

  const handleSelect = (num: string) => {
    if (raffle?.status === "FINISHED") return; 
    if (soldNumbers.includes(num) || pendingNumbers.includes(num)) return;
    setSelected(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const handleClearAll = () => {
    if (confirm("Deseja remover todos os números selecionados?")) {
      setSelected([]);
      setShowCartDetails(false);
    }
  };

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  const isFinished = raffle?.status === "FINISHED";

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-4 md:p-6 pb-44">
      <div className="mx-auto max-w-5xl">
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/")} 
            className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-blue-500 transition-colors"
          >
            <ArrowLeft size={16} /> Início
          </button>

          <Link 
            href="/tickets" 
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-[10px] font-black uppercase text-slate-300 hover:border-blue-500 transition-all shadow-lg"
          >
            <Search size={14} className="text-blue-500" />
            Meus Números
          </Link>
        </div>

        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="text-left space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                isFinished ? "bg-green-600 text-white" : "bg-blue-600 text-white animate-pulse"
              )}>
                {isFinished ? "Sorteio Realizado" : "Sorteio Oficial"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">{raffle?.title}</h1>
            
            {!isFinished && (
              <div className="max-w-md space-y-2 mt-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                  <span>Cotas Vendidas</span>
                  <span className="text-blue-500">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                  {totalSold} de {raffle?.totalTickets} cotas reservadas
                </p>
              </div>
            )}

            {!isFinished && raffle?.drawDate && <Countdown targetDate={raffle.drawDate} />}
            
            <p className="text-slate-500 text-sm md:text-lg font-medium italic">{raffle?.description}</p>
          </div>
          
          {!isFinished && (
            <div className="bg-[#121826] p-5 md:p-6 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-2xl">
              <Ticket className="text-blue-500 w-7 h-7 md:w-8 md:h-8" />
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Cota</p>
                <p className="text-2xl md:text-3xl font-black text-blue-500 italic">
                  {Number(raffle?.ticketPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          )}
        </header>

        {isFinished ? (
          <div className="space-y-12 animate-in fade-in duration-700 text-center">
            <div className="bg-green-500/10 border border-green-500/20 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] space-y-8">
              <Trophy className="text-green-500 mx-auto w-20 h-20 md:w-24 md:h-24" />
              <h2 className="text-3xl md:text-5xl font-black uppercase italic text-green-500 tracking-tighter">Ganhador!</h2>
              <div className="inline-block bg-green-500 text-black px-8 md:px-10 py-3 md:py-4 rounded-full text-2xl md:text-4xl font-black italic tracking-widest shadow-xl">
                COTA {raffle?.winner?.number}
              </div>
            </div>
          </div>
        ) : (
          <NumberGrid 
            totalTickets={raffle?.totalTickets || 0} 
            soldTickets={soldNumbers} 
            pendingTickets={pendingNumbers} 
            selectedNumbers={selected} 
            onSelect={handleSelect} 
            onSelectMultiple={(nums) => setSelected(prev => [...new Set([...prev, ...nums])])} 
          />
        )}

        {/* CARRINHO EDITÁVEL FLUTUANTE */}
        {!isFinished && selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-50 animate-in slide-in-from-bottom-10 duration-500">
            
            {/* Detalhes do Carrinho (Aparece ao clicar no resumo) */}
            {showCartDetails && (
              <div className="bg-[#121826] border border-white/10 rounded-t-[2.5rem] p-6 pb-10 -mb-8 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Números Selecionados</h4>
                  <button onClick={handleClearAll} className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all">
                    <Trash2 size={14} /> Limpar Tudo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 scrollbar-hide">
                  {selected.map(num => (
                    <div key={num} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 group transition-all hover:border-blue-500">
                      <span className="font-mono font-bold text-sm text-blue-500">{num}</span>
                      <button 
                        onClick={() => handleSelect(num)}
                        className="text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de Resumo Principal */}
            <div className="bg-[#121826]/95 backdrop-blur-xl border border-white/10 rounded-4xl md:rounded-[3rem] p-5 md:p-8 flex items-center justify-between shadow-2xl relative z-10">
              <button 
                onClick={() => setShowCartDetails(!showCartDetails)}
                className="text-left group outline-none"
              >
                <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                  Cotas {showCartDetails ? '▲' : '▼'}
                </p>
                <p className="text-xl md:text-3xl font-black italic group-hover:text-blue-500 transition-colors">{selected.length}</p>
              </button>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</p>
                  <p className="text-xl md:text-3xl font-black text-[#00E676] italic">
                    {(selected.length * (raffle?.ticketPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCheckout(true)} 
                  className="bg-blue-600 px-8 md:px-12 py-3 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-sm shadow-xl shadow-blue-900/40 active:scale-95 transition-all"
                >
                  Pagar
                </button>
              </div>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 z-60 bg-black/90 md:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <button onClick={() => setShowCheckout(false)} className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] bg-red-600 px-4 py-2 rounded-full shadow-lg">FECHAR [X]</button>
              <CheckoutModal totalValue={selected.length * (raffle?.ticketPrice || 0)} selectedNumbers={selected} raffleTitle={raffle?.title || ""} raffleId={raffleId} onSuccess={() => setSelected([])} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}