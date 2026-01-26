"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { 
  Ticket, 
  Search, 
  Loader2, 
  ArrowLeft, 
  Smartphone, 
  Calendar,
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  selectedNumbers: string[];
  totalValue: number;
  raffleTitle: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  createdAt: any;
}

export default function TicketsPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // MÁSCARA PADRÃO ELITE
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      return toast.error("Introduza um número de WhatsApp válido");
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "pedidos"),
        where("customerPhone", "==", cleanPhone)
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      // Ordenação manual por data (caso o índice composto do Firebase ainda não esteja pronto)
      results.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

      setOrders(results);
      setHasSearched(true);
      if (results.length === 0) toast.error("Nenhum pedido encontrado para este número.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao procurar bilhetes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors mb-4 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Voltar para os Sorteios</span>
            </Link>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Meus <span className="text-blue-500">Números</span></h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Consulte as suas reservas e compras</p>
          </div>
          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl hidden md:block">
            <Ticket className="text-blue-500" size={32} />
          </div>
        </header>

        {/* BUSCA */}
        <section className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="tel"
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-lg"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-900/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Search size={18} /> Procurar</>}
            </button>
          </form>
        </section>

        {/* RESULTADOS */}
        <div className="space-y-6">
          {hasSearched ? (
            orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-800/50 pb-6 mb-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{order.raffleTitle}</p>
                      <h3 className="text-xl font-black uppercase italic tracking-tight">Pedido #{order.id.slice(-6).toUpperCase()}</h3>
                    </div>
                    <div className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest h-fit border text-center",
                      order.status === "PAGO" ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                      order.status === "CANCELADO" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                      "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    )}>
                      {order.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-500 italic">
                        <Calendar size={16} />
                        <span className="text-[10px] font-black uppercase">Data: {order.createdAt?.toDate().toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Números Escolhidos:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.selectedNumbers.map(num => (
                          <span key={num} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-black text-blue-500">
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 flex flex-col justify-center items-center text-center">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 italic">Total Pago</p>
                      <p className="text-3xl font-black text-white italic tracking-tighter">
                        {order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 space-y-6">
                <ShoppingBag className="mx-auto text-slate-700" size={48} />
                <div className="space-y-2">
                  <p className="text-slate-500 font-black uppercase italic tracking-widest text-sm">Não encontramos compras para este número.</p>
                  <Link href="/" className="text-blue-500 font-black uppercase text-[10px] tracking-widest hover:underline underline-offset-4">
                    Quero participar de um sorteio agora
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12 opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Aguardando consulta...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}