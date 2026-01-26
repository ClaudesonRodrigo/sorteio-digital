"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Countdown } from '@/components/Countdown';
import { Loader2, Ticket, Trophy, ArrowLeft, Search, Trash2, X, Share2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;
  
  // CAPTURA DO CAMBISTA: Pega o valor de ?ref=...
  const cambistaId = searchParams.get('ref');

  const [raffle, setRaffle] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<string[]>([]);
  const [pendingNumbers, setPendingNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCartDetails, setShowCartDetails] = useState(false);

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
    if (confirm("Remover todos os números selecionados?")) {
      setSelected([]);
      setShowCartDetails(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link do sorteio copiado!");
  };

  if (loading) return (
    <div className="h-screen bg-[#0A0F1C] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  const isFinished = raffle?.status === "FINISHED";

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white pb-44">
      {/* NAVEGAÇÃO DE ELITE - VOLTA PARA A VITRINE */}
      <nav className="sticky top-0 z-50 bg-[#0A0F1C]/80 backdrop-blur-md border-b border-slate-800/50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 group-hover:border-blue-500 transition-all">
              <ChevronLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block italic">Ver Vitrine de Prêmios</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/tickets" 
              className="flex items-center gap-2 bg-blue-600/10 text-blue-500 px-4 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg"
            >
              <Search size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Meus Números</span>
            </Link>
            <button 
              onClick={handleShare}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:text-blue-500 transition-all shadow-md"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 md:px-6 mt-8 md:mt-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="text-left space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-full mb-2">
              <ShieldCheck className="text-blue-500" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 italic">
                {isFinished ? "Sorteio Encerrado" : "Sorteio Oficial Aracaju"}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">{raffle?.title}</h1>
            
            {!isFinished && (
              <div className="max-w-md space-y-2 mt-6">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                  <span>Progresso de Vendas</span>
                  <span className="text-blue-500 font-black italic">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!isFinished && raffle?.drawDate && <Countdown targetDate={raffle.drawDate} />}
          </div>
          
          {!isFinished && (
            <div className="bg-[#121826] p-6 rounded-[2.5rem] border border-slate-800 flex items-center gap-5 shadow-2xl transition-transform hover:scale-105">
              <div className="bg-blue-600/10 p-3 rounded-2xl">
                <Ticket className="text-blue-500 w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Cota Individual</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">
                  {Number(raffle?.ticketPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          )}
        </header>

        {isFinished ? (
          <div className="text-center bg-green-500/5 border border-green-500/20 p-16 rounded-[3rem] space-y-8 shadow-2xl animate-in zoom-in-95">
            <Trophy className="text-green-500 mx-auto w-24 h-24 drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
            <div className="space-y-2">
              <h2 className="text-5xl font-black uppercase italic text-green-500 tracking-tighter">Ganhador Revelado!</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Parabéns ao novo dono do prêmio</p>
            </div>
            <div className="inline-block bg-green-500 text-black px-12 py-5 rounded-full text-5xl font-black italic shadow-[0_10px_30px_rgba(34,197,94,0.4)]">
              COTA {raffle?.winner?.number}
            </div>
          </div>
        ) : (
          <div className="bg-[#121826] border border-slate-800 rounded-[3rem] p-2 md:p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
             <NumberGrid 
                totalTickets={raffle?.totalTickets || 0} 
                soldTickets={soldNumbers} 
                pendingTickets={pendingNumbers} 
                selectedNumbers={selected} 
                onSelect={handleSelect} 
                onSelectMultiple={(nums) => setSelected(prev => [...new Set([...prev, ...nums])])} 
              />
          </div>
        )}

        {/* CARRINHO DE ELITE - 100% PRESERVADO */}
        {!isFinished && selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-50 animate-in slide-in-from-bottom-10 duration-500">
            {showCartDetails && (
              <div className="bg-[#121826] border-x border-t border-white/10 rounded-t-[3rem] p-8 pb-12 -mb-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Cotas Selecionadas</h4>
                  <button onClick={handleClearAll} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={14} /> Limpar Tudo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {selected.map(num => (
                    <div key={num} className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 group hover:border-blue-500 transition-all">
                      <span className="font-black text-sm text-blue-500 italic">{num}</span>
                      <X size={14} className="text-slate-600 cursor-pointer hover:text-red-500 transition-colors" onClick={() => handleSelect(num)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#121826]/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-6 md:p-10 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10">
              <button onClick={() => setShowCartDetails(!showCartDetails)} className="text-left outline-none group">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 italic">
                  Sua Reserva {showCartDetails ? '▲' : '▼'}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl md:text-5xl font-black italic tracking-tighter text-white">{selected.length}</p>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Cotas</span>
                </div>
                {cambistaId && (
                  <div className="flex items-center gap-1 mt-2 bg-blue-600/10 px-2 py-0.5 rounded-lg w-fit border border-blue-500/10">
                    <span className="text-[8px] text-blue-500 font-black uppercase italic tracking-widest">Ref: {cambistaId}</span>
                  </div>
                )}
              </button>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 italic">Total a Pagar</p>
                  <p className="text-3xl font-black text-[#00E676] italic tracking-tighter">
                    {(selected.length * (raffle?.ticketPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCheckout(true)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_25px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
                >
                  Pagar Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md shadow-2xl">
              <button 
                onClick={() => setShowCheckout(false)} 
                className="absolute -top-14 right-0 text-white font-black uppercase text-[10px] tracking-widest bg-slate-900 border border-slate-800 px-6 py-3 rounded-full hover:bg-red-600 hover:border-red-500 transition-all flex items-center gap-2 shadow-xl"
              >
                <X size={16} /> Fechar Janela
              </button>
              <CheckoutModal 
                totalValue={selected.length * (raffle?.ticketPrice || 0)} 
                selectedNumbers={selected} 
                raffleTitle={raffle?.title || ""} 
                raffleId={raffleId} 
                cambistaId={cambistaId || undefined} 
                onSuccess={() => {
                  setSelected([]);
                  setShowCheckout(false);
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}