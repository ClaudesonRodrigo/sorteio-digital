"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { Raffle } from '@/schemas/raffle';
import { Loader2, Gift, Ticket, Smartphone } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  // Desembrulhando params assíncronos (React 19)
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastWonLucky, setLastWonLucky] = useState<{number: string, prize: string} | null>(null);

  useEffect(() => {
    if (!raffleId) return;

    const fetchRaffle = async () => {
      const docRef = doc(db, "rifas", raffleId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setRaffle({ id: snap.id, ...snap.data() } as Raffle);
      }
    };

    // Monitoramento Tempo Real
    const soldRef = collection(db, "rifas", raffleId, "sold_numbers");
    const unsubSold = onSnapshot(soldRef, (snap) => {
      setSoldNumbers(snap.docs.map(doc => doc.id));
      setLoading(false);
    });

    fetchRaffle();
    return () => unsubSold();
  }, [raffleId]);

  const handleSelect = (num: string) => {
    const lucky = raffle?.luckyNumbers?.find(ln => ln.number === num);
    if (lucky && !selected.includes(num)) {
      setLastWonLucky({ number: num, prize: lucky.prize });
      setTimeout(() => setLastWonLucky(null), 6000);
    }
    setSelected(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  if (loading) return (
    <div className="h-screen bg-[#0A0F1C] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="font-bold tracking-widest text-[10px] uppercase text-slate-500">Sincronizando Cartela...</p>
    </div>
  );

  if (!raffle) return <div className="text-white p-20 text-center font-black uppercase">Sorteio Indisponível.</div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-44">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div>
            <div className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4 shadow-lg shadow-blue-900/40">
              Sorteio Oficial
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">{raffle.title}</h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl">{raffle.description}</p>
          </div>
          
          <div className="bg-[#121826] border border-slate-800 p-6 rounded-3xl flex items-center gap-4 shadow-xl">
            <div className="bg-blue-600/20 p-3 rounded-2xl">
              <Ticket className="text-blue-500" size={32} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Valor da Cota</p>
              <p className="text-3xl font-black text-blue-500 leading-tight">
                {raffle.ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </header>

        {/* Notificação Animada de Cota Premiada */}
        {lastWonLucky && (
          <div className="mb-10 bg-[#00E676] border-4 border-white/20 p-8 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-top-12 duration-500 shadow-2xl shadow-green-900/20">
            <Gift className="text-white shrink-0" size={48} />
            <div className="flex-1">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-black">VOCÊ ENCONTROU UM PRÊMIO!</h3>
              <p className="text-green-900 text-lg font-bold">O número <span className="bg-black text-white px-2 rounded">{lastWonLucky.number}</span> vale <span className="underline">{lastWonLucky.prize}</span>!</p>
            </div>
          </div>
        )}

        <NumberGrid 
          totalTickets={raffle.totalTickets}
          soldTickets={soldNumbers}
          selectedNumbers={selected}
          onSelect={handleSelect}
        />

        {/* Checkout de Elite */}
        {selected.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-[#121826]/90 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-3xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-10 duration-700 z-50">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl hidden sm:block">
                <Smartphone className="text-white" size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selecionados</p>
                <p className="text-3xl font-black text-white leading-none">{selected.length}</p>
              </div>
            </div>
            
            <div className="text-right flex items-center gap-6">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Valor Total</p>
                <p className="text-3xl font-black text-[#00E676] leading-none">
                  {(selected.length * raffle.ticketPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm transition-all shadow-xl shadow-blue-900/30 active:scale-95">
                Pagar Agora
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}