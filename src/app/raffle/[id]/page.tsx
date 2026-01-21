"use client";

import React, { useState, useEffect, use } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { NumberGrid } from '@/components/NumberGrid';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Raffle } from '@/schemas/raffle';
import { Loader2, Ticket, Smartphone, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaffleDetails({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<string[]>([]);
  const [pendingNumbers, setPendingNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!raffleId) return;

    // 1. Busca os dados estáticos da Rifa
    const fetchRaffle = async () => {
      const docRef = doc(db, "rifas", raffleId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setRaffle({ id: snap.id, ...snap.data() } as Raffle);
      }
    };

    // 2. Listener em tempo real para números VENDIDOS (Vermelho)
    const soldRef = collection(db, "rifas", raffleId, "sold_numbers");
    const unsubSold = onSnapshot(soldRef, (snap) => {
      setSoldNumbers(snap.docs.map(doc => doc.id));
    });

    // 3. Listener em tempo real para números PENDENTES (Laranja)
    const pendingRef = collection(db, "rifas", raffleId, "pending_numbers");
    const unsubPending = onSnapshot(pendingRef, (snap) => {
      setPendingNumbers(snap.docs.map(doc => doc.id));
      setLoading(false); // Para o loading assim que os estados iniciais carregam
    });

    fetchRaffle();
    return () => {
      unsubSold();
      unsubPending();
    };
  }, [raffleId]);

  const handleSelect = (num: string) => {
    // Bloqueia seleção de números que já não estão disponíveis
    if (soldNumbers.includes(num) || pendingNumbers.includes(num)) return;
    
    setSelected(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleSelectMultiple = (nums: string[]) => {
    setSelected(prev => {
      const newSelections = nums.filter(n => !prev.includes(n));
      return [...prev, ...newSelections];
    });
  };

  // Função disparada pelo Modal após o sucesso da reserva
  const handleCheckoutSuccess = () => {
    setSelected([]); // Limpa o carrinho azul
    // Mantemos o modal aberto para o usuário ver o QR Code do PIX
  };

  if (loading) return (
    <div className="h-screen bg-[#0A0F1C] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="font-bold tracking-widest text-[10px] uppercase text-slate-500 italic">Sincronizando Cartela...</p>
    </div>
  );

  if (!raffle) return (
    <div className="h-screen bg-[#0A0F1C] flex flex-col items-center justify-center text-white p-20 text-center">
      <h2 className="font-black uppercase text-2xl mb-4">Sorteio Indisponível</h2>
      <button onClick={() => router.push('/')} className="text-blue-500 flex items-center gap-2 font-bold">
        <ArrowLeft size={18} /> Voltar ao Início
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-44">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho de Elite */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10 text-left">
          <div className="animate-in slide-in-from-left duration-500">
            <div className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4 shadow-lg shadow-blue-900/40">
              Sorteio Oficial
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic">
              {raffle.title}
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl">{raffle.description}</p>
          </div>
          
          <div className="bg-[#121826] border border-slate-800 p-6 rounded-3xl flex items-center gap-4 shadow-xl animate-in slide-in-from-right duration-500">
            <div className="bg-blue-600/20 p-3 rounded-2xl">
              <Ticket className="text-blue-500" size={32} />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Valor da Cota</p>
              <p className="text-3xl font-black text-blue-500 leading-tight">
                {raffle.ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </header>

        {/* Grade de Números */}
        <NumberGrid 
          totalTickets={raffle.totalTickets}
          soldTickets={soldNumbers}
          pendingTickets={pendingNumbers} 
          selectedNumbers={selected}
          onSelect={handleSelect}
          onSelectMultiple={handleSelectMultiple}
        />

        {/* Barra Flutuante de Checkout */}
        {selected.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-[#121826]/90 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-3xl flex items-center justify-between z-50 animate-in fade-in slide-in-from-bottom-10">
            <div className="flex items-center gap-4 text-left">
              <Smartphone className="text-blue-500 hidden sm:block" size={24} />
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Cotas</p>
                <p className="text-3xl font-black text-white leading-none mt-1">{selected.length}</p>
              </div>
            </div>
            
            <div className="text-right flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Subtotal</p>
                <p className="text-3xl font-black text-[#00E676] leading-none mt-1">
                  {(selected.length * raffle.ticketPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <button 
                onClick={() => setShowCheckout(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm transition-all shadow-xl active:scale-95 shadow-blue-900/20"
              >
                Pagar Agora
              </button>
            </div>
          </div>
        )}

        {/* Modal de Checkout */}
        {showCheckout && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="relative w-full max-w-md">
              <button 
                onClick={() => setShowCheckout(false)} 
                className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] tracking-[0.2em] bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-full transition-all"
              >
                FECHAR JANELA [X]
              </button>
              <CheckoutModal 
                totalValue={selected.length * raffle.ticketPrice}
                selectedNumbers={selected}
                raffleTitle={raffle.title}
                raffleId={raffleId}
                onSuccess={handleCheckoutSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}