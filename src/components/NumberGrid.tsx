"use client";

import React, { useState, useMemo } from 'react';
import { cn, formatTicketNumber } from '@/lib/utils';
import { Zap, Search, Clock } from 'lucide-react';

interface NumberGridProps {
  totalTickets: number;
  soldTickets: string[];
  pendingTickets: string[]; 
  onSelect: (number: string) => void;
  onSelectMultiple: (numbers: string[]) => void; 
  selectedNumbers: string[];
}

export const NumberGrid = ({ 
  totalTickets, 
  soldTickets, 
  pendingTickets, 
  onSelect, 
  onSelectMultiple, 
  selectedNumbers 
}: NumberGridProps) => {
  const [search, setSearch] = useState("");

  const numbers = useMemo(() => {
    if (!totalTickets) return [];
    return Array.from({ length: totalTickets }, (_, i) => formatTicketNumber(i, totalTickets));
  }, [totalTickets]);

  const filteredNumbers = useMemo(() => {
    const list = search ? numbers.filter(n => n.includes(search)) : numbers;
    return list.slice(0, 300); // Mostramos um pouco mais para scroll suave
  }, [search, numbers]);

  const handleQuickBuy = (amount: number) => {
    const available = numbers.filter(n => 
      !soldTickets.includes(n) && 
      !pendingTickets.includes(n) && 
      !selectedNumbers.includes(n)
    );
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, amount);
    onSelectMultiple(selection);
  };

  const bundles = [5, 10, 20, 50, 100];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Compra Rápida: Grid otimizado para mobile */}
      <div className="bg-[#121826] p-5 md:p-6 rounded-4xl border border-slate-800 shadow-xl text-left">
        <div className="flex items-center gap-2 mb-4 text-blue-500 font-black uppercase tracking-widest text-[10px] md:text-xs">
          <Zap size={16} fill="currentColor" /> Compra Rápida
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
          {bundles.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickBuy(amount)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500 p-3 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group"
            >
              <span className="text-xl md:text-2xl font-black text-white group-hover:text-blue-500">+{amount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Cotas</span>
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Busca e Legenda: Empilha no mobile */}
      <div className="bg-[#121826] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar número..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-800 border border-slate-700" /> Livre</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600" /> Você</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" /> Reservado</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-900/40" /> Vendido</div>
        </div>
      </div>

      {/* Grid de Números: 5 colunas no mobile para melhor ergonomia */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-1.5 md:gap-2">
        {filteredNumbers.map((num) => {
          const isSold = soldTickets.includes(num);
          const isPending = pendingTickets.includes(num);
          const isSelected = selectedNumbers.includes(num);

          return (
            <button
              key={num}
              disabled={isSold || isPending}
              onClick={() => onSelect(num)}
              className={cn(
                "flex h-10 md:h-12 items-center justify-center rounded-lg md:rounded-xl border text-[11px] md:text-sm font-bold transition-all active:scale-75 relative overflow-hidden",
                isSold 
                  ? "bg-red-900/5 border-red-900/10 text-red-900/20 cursor-not-allowed" 
                  : isPending
                    ? "bg-orange-500/10 border-orange-500/20 text-orange-500 cursor-not-allowed"
                    : isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                      : "bg-[#121826] border-slate-800 text-slate-400"
              )}
            >
              {num}
              {isPending && <Clock size={6} className="absolute top-0.5 right-0.5 opacity-30" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};