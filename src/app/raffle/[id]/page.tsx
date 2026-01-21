"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Raffle } from '@/schemas/raffle';
import { Loader2, Ticket, Smartphone, Search, UserCheck, X } from 'lucide-react';
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
  const [lookupResult, setLookupResult] = useState<{ numbers: string[], status: string }[] | null>(null);
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

  // FUNÇÃO DE ELITE: Limpa o telefone e busca no banco
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove tudo que não for número (O Pulo do Gato)
    const cleanPhone = searchPhone.replace(/\D/g, "");
    
    if (cleanPhone.length < 10) {
      return toast.error("Digite o DDD + Número completo.");
    }
    
    setSearching(true);
    setLookupResult(null);

    try {
      const q = query(
        collection(db, "pedidos"), 
        where("raffleId", "==", raffleId), 
        where("customerPhone", "==", cleanPhone)
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setLookupResult([]);
        toast.info("Nenhuma reserva encontrada.");
      } else {
        const results = snap.docs.map(doc => ({
          numbers: doc.data().selectedNumbers,
          status: doc.data().status
        }));
        setLookupResult(results);
        toast.success("Pedidos encontrados!");
      }
    } catch (error) {
      console.error("Erro na consulta:", error);
      toast.error("Erro técnico na consulta. Verifique as regras do Firebase.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (num: string) => {
    if (soldNumbers.includes(num) || pendingNumbers.includes(num)) return;
    setSelected(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  if (loading) return (
    <div className="h-screen bg-[#0A0F1C] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="font-bold uppercase text-[10px] text-slate-500 italic">Sincronizando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-44">
      <div className="mx-auto max-w-5xl">
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="text-left animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-900/40">Sorteio Oficial</span>
              <button 
                onClick={() => setShowLookup(true)}
                className="bg-slate-800 hover:bg-slate-700 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700 shadow-xl"
              >
                <Search size={12} className="text-blue-500" /> Meus Números
              </button>
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic">{raffle?.title}</h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl">{raffle?.description}</p>
          </div>
          
          <div className="bg-[#121826] border border-slate-800 p-6 rounded-3xl flex items-center gap-4 shadow-xl animate-in slide-in-from-right duration-500">
            <div className="bg-blue-600/20 p-3 rounded-2xl"><Ticket className="text-blue-500" size={32} /></div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Cota</p>
              <p className="text-3xl font-black text-blue-500 leading-tight">{raffle?.ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
          </div>
        </header>

        <NumberGrid 
          totalTickets={raffle?.totalTickets || 0}
          soldTickets={soldNumbers}
          pendingTickets={pendingNumbers} 
          selectedNumbers={selected}
          onSelect={handleSelect}
          onSelectMultiple={(nums) => setSelected(prev => [...new Set([...prev, ...nums])])}
        />

        {/* Modal de Busca (Meus Números) */}
        {showLookup && (
          <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 relative animate-in zoom-in duration-300 shadow-2xl">
              <button 
                onClick={() => { setShowLookup(false); setLookupResult(null); }} 
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Consultar Pedidos</h2>
              <p className="text-slate-500 text-sm mb-6">Digite seu WhatsApp para encontrar suas cotas.</p>

              <form onSubmit={handleLookup} className="space-y-4 mb-8">
                <input 
                  type="tel" 
                  placeholder="(79) 99999-9999" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                />
                <button 
                  disabled={searching} 
                  className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  {searching ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={18} />} 
                  {searching ? "BUSCANDO..." : "VERIFICAR MEUS NÚMEROS"}
                </button>
              </form>

              {lookupResult && (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {lookupResult.length === 0 ? (
                    <div className="text-center py-6 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
                      <p className="text-red-500 font-black uppercase text-[10px] tracking-widest">Nenhum registro encontrado</p>
                    </div>
                  ) : (
                    lookupResult.map((res, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">Reserva #{i+1}</span>
                          <span className={cn(
                            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter", 
                            res.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                          )}>
                            {res.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {res.numbers.map(n => (
                            <span key={n} className="bg-blue-600/10 border border-blue-600/20 text-blue-500 text-[10px] font-black px-2 py-1 rounded-lg">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barra de Checkout Flutuante */}
        {selected.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-[#121826]/90 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-3xl flex items-center justify-between z-50 animate-in fade-in slide-in-from-bottom-10">
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Cotas</p>
              <p className="text-3xl font-black text-white leading-none mt-1">{selected.length}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Total</p>
                <p className="text-3xl font-black text-[#00E676] leading-none mt-1">
                  {(selected.length * (raffle?.ticketPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <button 
                onClick={() => setShowCheckout(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95"
              >
                Pagar Agora
              </button>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-md">
              <button 
                onClick={() => setShowCheckout(false)} 
                className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] bg-red-600/80 px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
              >
                FECHAR [X]
              </button>
              <CheckoutModal 
                totalValue={selected.length * (raffle?.ticketPrice || 0)} 
                selectedNumbers={selected} 
                raffleTitle={raffle?.title || ""} 
                raffleId={raffleId} 
                onSuccess={() => setSelected([])} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}