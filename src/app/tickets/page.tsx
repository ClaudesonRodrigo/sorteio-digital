"use client";

import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Search, Ticket, Loader2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyTickets() {
  const [phone, setPhone] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collection(db, "pedidos"), 
        where("customerPhone", "==", phone),
        where("status", "==", "PAGO")
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => doc.data());
      setTickets(results);
    } catch (error) {
      console.error("Erro ao buscar bilhetes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="mx-auto max-w-2xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Meus Bilhetes</h1>
          <p className="text-slate-400 mt-2">Consulte suas participações pelo número do WhatsApp.</p>
        </header>

        {/* Formulário de Busca */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative group">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="(79) 9XXXX-XXXX"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-bold"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 p-3 rounded-xl transition-all disabled:bg-slate-700"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
          </div>
        </form>

        {/* Resultados */}
        <div className="space-y-4">
          {tickets.map((order, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-blue-400 font-black uppercase text-xs tracking-widest">{order.raffleTitle}</h3>
                  <p className="text-slate-500 text-[10px]">{new Date(order.createdAt?.toDate()).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Pago</div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {order.selectedNumbers.map((num: string) => (
                  <div key={num} className="bg-slate-900 border border-slate-700 w-12 h-12 flex items-center justify-center rounded-lg font-mono font-bold text-blue-500">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {searched && !loading && tickets.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
              <Ticket className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-500 font-medium">Nenhum bilhete pago encontrado para este número.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}