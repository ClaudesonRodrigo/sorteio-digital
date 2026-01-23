"use client";

import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { Search, Ticket, Loader2, Smartphone, CheckCircle2, Clock, MessageCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Interface para evitar erro de Property 'raffleId' does not exist
interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  selectedNumbers: string[];
  totalValue: number;
  raffleTitle: string;
  raffleId: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  createdAt: any;
}

export default function MyTickets() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return toast.error("Informe um WhatsApp válido");
    }
    
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collection(db, "pedidos"), 
        where("customerPhone", "==", phone),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const rawOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

      // FILTRO DE SEGURANÇA: Só exibe bilhetes de rifas que NÃO estão finalizadas
      const validOrders = [];
      
      for (const order of rawOrders) {
        if (!order.raffleId) continue;
        
        const raffleSnap = await getDoc(doc(db, "rifas", order.raffleId));
        if (raffleSnap.exists()) {
          const raffleData = raffleSnap.data();
          // Bloqueio de consulta para rifas finalizadas
          if (raffleData.status !== "FINISHED") {
            validOrders.push({
              ...order,
              raffleTitle: raffleData.title
            });
          }
        }
      }

      setOrders(validOrders);
    } catch (error) {
      console.error("Erro ao buscar bilhetes:", error);
      toast.error("Erro na busca de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-20">
      <div className="mx-auto max-w-2xl">
        <button 
          onClick={() => router.push("/")}
          className="mb-8 flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-blue-500 transition-colors active:scale-95"
        >
          <ArrowLeft size={16} /> Voltar ao Início
        </button>

        <header className="text-center mb-10">
          <div className="bg-blue-600/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-xl">
            <Ticket className="text-blue-500" size={40} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">Meus Números</h1>
          <p className="text-slate-500 mt-3 font-medium text-sm">Consulte as cotas de seus sorteios ativos.</p>
        </header>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative group">
            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="(79) 9XXXX-XXXX"
              className="w-full bg-[#121826] border border-slate-800 rounded-4xl py-6 pl-16 pr-6 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-bold placeholder:text-slate-700 shadow-2xl"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-2xl transition-all disabled:bg-slate-800 shadow-xl active:scale-95 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin text-white" size={24} /> : <Search className="text-white" size={24} />}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <h3 className="text-blue-500 font-black uppercase text-xs tracking-widest mb-1 italic">{order.raffleTitle}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">
                    ID: {order.id.slice(0, 8)}
                  </p>
                </div>
                
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5",
                  order.status === "PAGO" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                )}>
                  {order.status === "PAGO" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {order.status === "PAGO" ? "Confirmado" : "Pendente"}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {order.selectedNumbers.map((num: string) => (
                  <div key={num} className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-xl font-mono font-black text-sm border transition-all shadow-inner",
                    order.status === "PAGO" ? "bg-blue-600 text-white border-blue-400" : "bg-slate-900 border-slate-800 text-slate-500"
                  )}>
                    {num}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Pago</p>
                  <p className="text-2xl font-black text-white italic">{(order.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                
                {order.status === "PENDENTE" && (
                  <button 
                    onClick={() => window.open(`https://wa.me/5579996337995`, '_blank')}
                    className="w-full sm:w-auto bg-[#075E54] hover:bg-[#0C7A6D] text-white px-8 py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-green-900/10"
                  >
                    <MessageCircle size={20} /> Comprovante
                  </button>
                )}
              </div>
            </div>
          ))}

          {searched && !loading && orders.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-[3rem] bg-[#121826]/30">
              <Ticket className="mx-auto text-slate-800 mb-6 opacity-20" size={80} />
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Nenhum sorteio ativo encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}