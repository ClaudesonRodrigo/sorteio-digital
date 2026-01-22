"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Countdown } from '@/components/Countdown';
import { Raffle } from '@/schemas/raffle';
import { Loader2, Ticket, Smartphone, Search, UserCheck, X, Share2 } from 'lucide-react';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<string[]>([]);
  const [pendingNumbers, setPendingNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [showLookup, setShowLookup] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [lookupResult, setLookupResult] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!raffleId) return;
    getDoc(doc(db, "rifas", raffleId)).then(snap => {
      if (snap.exists()) setRaffle({ id: snap.id, ...snap.data() } as Raffle);
    });

    const unsubSold = onSnapshot(collection(db, "rifas", raffleId, "sold_numbers"), (snap) => {
      setSoldNumbers(snap.docs.map(doc => doc.id));
    });

    const unsubPending = onSnapshot(collection(db, "rifas", raffleId, "pending_numbers"), (snap) => {
      setPendingNumbers(snap.docs.map(doc => doc.id));
      setLoading(false);
    });

    return () => { unsubSold(); unsubPending(); };
  }, [raffleId]);

  // Função de Partilha (O Pulo do Gato)
  const handleShare = () => {
    const shareData = {
      title: `Sorteio: ${raffle?.title}`,
      text: `Garanta sua cota por apenas ${raffle?.ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => toast.error("Erro ao partilhar."));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado! Envie no WhatsApp do Bugio.");
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = searchPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) return toast.error("Telefone inválido.");
    setSearching(true);
    try {
      const q = query(collection(db, "pedidos"), where("raffleId", "==", raffleId), where("customerPhone", "==", cleanPhone));
      const snap = await getDocs(q);
      setLookupResult(snap.empty ? [] : snap.docs.map(d => d.data()));
    } catch (error) {
      toast.error("Erro na consulta.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (num: string) => {
    if (soldNumbers.includes(num) || pendingNumbers.includes(num)) return;
    setSelected(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-44">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="text-left space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-900/40">Sorteio Oficial</span>
              <button onClick={() => setShowLookup(true)} className="bg-slate-800 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 border border-slate-700 hover:bg-slate-700 transition-all"><Search size={10} /> Meus Números</button>
              <button onClick={handleShare} className="bg-blue-600/10 text-blue-500 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"><Share2 size={10} /> Partilhar</button>
            </div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{raffle?.title}</h1>
            {raffle?.drawDate && (
              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Sorteio em:</p>
                <Countdown targetDate={raffle.drawDate} />
              </div>
            )}
            <p className="text-slate-500 text-lg font-medium italic">{raffle?.description}</p>
          </div>
          <div className="bg-[#121826] p-6 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-2xl">
            <Ticket className="text-blue-500" size={32} />
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase">Cota</p>
              <p className="text-3xl font-black text-blue-500 italic">{raffle?.ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
          </div>
        </header>

        <NumberGrid totalTickets={raffle?.totalTickets || 0} soldTickets={soldNumbers} pendingTickets={pendingNumbers} selectedNumbers={selected} onSelect={handleSelect} onSelectMultiple={(nums) => setSelected(prev => [...new Set([...prev, ...nums])])} />

        {showLookup && (
          <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 relative">
              <button onClick={() => { setShowLookup(false); setLookupResult(null); }} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
              <h2 className="text-2xl font-black uppercase italic mb-6">Consultar Meus Números</h2>
              <form onSubmit={handleLookup} className="space-y-4 mb-8">
                <input type="tel" placeholder="(79) 99999-9999" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
                <button disabled={searching} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">{searching ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />} VERIFICAR</button>
              </form>
              {lookupResult && (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {lookupResult.length === 0 ? <p className="text-center text-red-500 text-xs font-bold uppercase">Nenhum pedido encontrado.</p> : lookupResult.map((res, i) => (
                    <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                      <div className="flex justify-between mb-2"><span className="text-[8px] font-black uppercase text-slate-500">Reserva #{i+1}</span><span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase", res.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500")}>{res.status}</span></div>
                      <div className="flex flex-wrap gap-1">{res.selectedNumbers.map((n: string) => (<span key={n} className="bg-blue-600/10 border border-blue-600/20 text-blue-500 text-[10px] font-black px-2 py-0.5 rounded-lg">{n}</span>))}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-[#121826]/90 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 flex items-center justify-between z-50">
            <div className="text-left"><p className="text-[10px] text-slate-500 font-black uppercase">Cotas</p><p className="text-3xl font-black italic">{selected.length}</p></div>
            <div className="flex items-center gap-6">
              <div className="text-right"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</p><p className="text-3xl font-black text-[#00E676] italic">{(selected.length * (raffle?.ticketPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
              <button onClick={() => setShowCheckout(true)} className="bg-blue-600 px-10 py-5 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Pagar Agora</button>
            </div>
          </div>
        )}

        {showCheckout && (
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