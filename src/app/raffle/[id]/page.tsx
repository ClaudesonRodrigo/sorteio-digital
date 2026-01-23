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
import { useRouter, useSearchParams } from 'next/navigation'; // Adicionado useSearchParams
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para ler a URL
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
    if (confirm("Remover todos os números?")) {
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
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-blue-500 transition-colors">
            <ArrowLeft size={16} /> Início
          </button>

          <Link href="/tickets" className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-[10px] font-black uppercase text-slate-300 hover:border-blue-500 transition-all shadow-lg">
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
                  <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!isFinished && raffle?.drawDate && <Countdown targetDate={raffle.drawDate} />}
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
          <div className="text-center bg-green-500/10 border border-green-500/20 p-12 rounded-[3rem] space-y-8">
            <Trophy className="text-green-500 mx-auto w-24 h-24" />
            <h2 className="text-5xl font-black uppercase italic text-green-500 tracking-tighter">Ganhador!</h2>
            <div className="inline-block bg-green-500 text-black px-10 py-4 rounded-full text-4xl font-black italic shadow-xl">
              COTA {raffle?.winner?.number}
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

        {/* CARRINHO COM SUPORTE A CAMBISTA */}
        {!isFinished && selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-50">
            {showCartDetails && (
              <div className="bg-[#121826] border border-white/10 rounded-t-[2.5rem] p-6 pb-10 -mb-8 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Números Selecionados</h4>
                  <button onClick={handleClearAll} className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1">
                    <Trash2 size={14} /> Limpar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {selected.map(num => (
                    <div key={num} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-500">{num}</span>
                      <X size={14} className="text-slate-600 cursor-pointer" onClick={() => handleSelect(num)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#121826]/95 backdrop-blur-xl border border-white/10 rounded-[3rem] p-5 md:p-8 flex items-center justify-between shadow-2xl relative z-10">
              <button onClick={() => setShowCartDetails(!showCartDetails)} className="text-left outline-none">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Cotas {showCartDetails ? '▲' : '▼'}</p>
                <p className="text-xl md:text-3xl font-black italic">{selected.length}</p>
                {cambistaId && <p className="text-[8px] text-blue-500 font-black uppercase mt-1">Ref: {cambistaId}</p>}
              </button>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</p>
                  <p className="text-xl md:text-3xl font-black text-[#00E676] italic">
                    {(selected.length * (raffle?.ticketPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <button onClick={() => setShowCheckout(true)} className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Pagar</button>
              </div>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <button onClick={() => setShowCheckout(false)} className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] bg-red-600 px-4 py-2 rounded-full">FECHAR [X]</button>
              {/* PASSAMOS O cambistaId PARA O MODAL */}
              <CheckoutModal 
                totalValue={selected.length * (raffle?.ticketPrice || 0)} 
                selectedNumbers={selected} 
                raffleTitle={raffle?.title || ""} 
                raffleId={raffleId} 
                cambistaId={cambistaId || undefined} 
                onSuccess={() => setSelected([])} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}