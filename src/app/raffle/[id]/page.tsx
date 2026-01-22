"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Countdown } from '@/components/Countdown';
import { Raffle } from '@/schemas/raffle';
import { Loader2, Ticket, Search, Trophy, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;

  const [raffle, setRaffle] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<string[]>([]);
  const [pendingNumbers, setPendingNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!raffleId) return;

    // Listener para dados da rifa (Status, Título, etc)
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

  const handleSelect = (num: string) => {
    if (raffle?.status === "FINISHED") return; // Trava total
    if (soldNumbers.includes(num) || pendingNumbers.includes(num)) return;
    setSelected(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  const isFinished = raffle?.status === "FINISHED";

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-44">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="text-left space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                isFinished ? "bg-green-600 text-white" : "bg-blue-600 text-white animate-pulse"
              )}>
                {isFinished ? "Sorteio Realizado" : "Sorteio Oficial"}
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{raffle?.title}</h1>
            
            {!isFinished && raffle?.drawDate && <Countdown targetDate={raffle.drawDate} />}
            
            <p className="text-slate-500 text-lg font-medium italic">{raffle?.description}</p>
          </div>
          
          {!isFinished && (
            <div className="bg-[#121826] p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
              <Ticket className="text-blue-500" size={32} />
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase">Cota</p>
                <p className="text-3xl font-black text-blue-500 italic">{raffle?.ticketPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            </div>
          )}
        </header>

        {/* SEÇÃO DO GANHADOR - SÓ APARECE SE FINISHED */}
        {isFinished ? (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="bg-green-500/10 border border-green-500/20 p-12 rounded-[3rem] text-center space-y-8">
              <div className="relative inline-block">
                <Trophy className="text-green-500 mx-auto" size={100} />
                <CheckCircle2 className="text-green-400 absolute -bottom-2 -right-2 bg-[#0A0F1C] rounded-full" size={40} />
              </div>
              <div>
                <h2 className="text-5xl font-black uppercase italic text-green-500 tracking-tighter mb-4">Ganhador Encontrado!</h2>
                <div className="inline-block bg-green-500 text-black px-10 py-4 rounded-full text-4xl font-black italic tracking-widest shadow-xl shadow-green-900/40">
                  COTA {raffle?.winner?.number}
                </div>
              </div>
              <div className="max-w-md mx-auto bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Nome do Sortudo</p>
                <p className="text-2xl font-black text-white italic truncate">{raffle?.winner?.name}</p>
                <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold italic">
                  <Calendar size={16} /> Sorteio oficial realizado via {raffle?.winner?.fullFederal ? 'Federal' : 'Sorteio Aleatório'}
                </div>
              </div>
            </div>

            {/* A Grade fica aqui embaixo mas desativada visualmente se você quiser manter a transparência de quem comprou */}
            <div className="opacity-40 pointer-events-none grayscale">
               <h3 className="text-center font-black uppercase italic text-slate-500 mb-6">Confira os números vendidos deste sorteio</h3>
               <NumberGrid totalTickets={raffle?.totalTickets || 0} soldTickets={soldNumbers} pendingTickets={pendingNumbers} selectedNumbers={[]} onSelect={() => {}} onSelectMultiple={() => {}} />
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

        {/* Barra de Pagamento - SÓ APARECE SE NÃO ESTIVER FINISHED */}
        {!isFinished && selected.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-[#121826]/90 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 flex items-center justify-between z-50">
            <div className="text-left"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Cotas</p><p className="text-3xl font-black italic">{selected.length}</p></div>
            <div className="flex items-center gap-6">
              <div className="text-right"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</p><p className="text-3xl font-black text-[#00E676] italic">{(selected.length * (raffle?.ticketPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
              <button onClick={() => setShowCheckout(true)} className="bg-blue-600 px-10 py-5 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Pagar Agora</button>
            </div>
          </div>
        )}

        {showCheckout && !isFinished && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <button onClick={() => setShowCheckout(false)} className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] bg-red-600 px-4 py-2 rounded-full">FECHAR [X]</button>
              <CheckoutModal totalValue={selected.length * (raffle?.ticketPrice || 0)} selectedNumbers={selected} raffleTitle={raffle?.title || ""} raffleId={raffleId} onSuccess={() => setSelected([])} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}