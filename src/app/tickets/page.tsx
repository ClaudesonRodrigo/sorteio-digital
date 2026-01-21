"use client";

import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Search, Ticket, Loader2, Smartphone, CheckCircle2, Clock, ExternalLink, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyTickets() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Limpa formatação básica se houver
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) return;
    
    setLoading(true);
    setSearched(true);
    try {
      // Busca todos os pedidos do cliente, independente do status
      const q = query(
        collection(db, "pedidos"), 
        where("customerPhone", "==", phone),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(results);
    } catch (error) {
      console.error("Erro ao buscar bilhetes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 pb-20">
      <div className="mx-auto max-w-2xl">
        <header className="text-center mb-10">
          <div className="bg-blue-600/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Ticket className="text-blue-500" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Consultar Meus Números</h1>
          <p className="text-slate-500 mt-2 font-medium">Digite seu WhatsApp para localizar suas cotas.</p>
        </header>

        {/* Formulário de Busca */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative group">
            <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="(79) 9XXXX-XXXX"
              className="w-full bg-[#121826] border border-slate-800 rounded-4xl py-6 pl-14 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-bold placeholder:text-slate-700 shadow-2xl"
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

        {/* Listagem de Resultados */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-blue-400 font-black uppercase text-xs tracking-[0.2em] mb-1">{order.raffleTitle}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('pt-BR') : 'Data não disponível'}
                  </p>
                </div>
                
                {order.status === "PAGO" ? (
                  <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Confirmado
                  </div>
                ) : (
                  <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                    <Clock size={12} /> Aguardando Pix
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {order.selectedNumbers.map((num: string) => (
                  <div key={num} className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-xl font-mono font-black text-sm border transition-all",
                    order.status === "PAGO" 
                      ? "bg-blue-600/10 border-blue-500/30 text-blue-500" 
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  )}>
                    {num}
                  </div>
                ))}
              </div>

              {/* Ações para o cliente */}
              <div className="pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Total da Reserva</p>
                  <p className="text-xl font-black text-white">
                    {order.totalValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                
                {order.status === "PENDENTE" && (
                  <button 
                    onClick={() => window.open(`https://wa.me/5579996337995`, '_blank')}
                    className="bg-[#075E54] hover:bg-[#0C7A6D] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <MessageCircle size={16} /> Enviar Comprovante
                  </button>
                )}
              </div>
            </div>
          ))}

          {searched && !loading && orders.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-[3rem] bg-[#121826]/30 shadow-inner">
              <Ticket className="mx-auto text-slate-800 mb-4 opacity-20" size={64} />
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhuma participação encontrada</p>
              <p className="text-slate-600 text-xs mt-2">Verifique o número digitado e tente novamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}