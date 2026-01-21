"use client";

import React, { useState, useMemo } from 'react';
import { cn, formatTicketNumber } from '@/lib/utils';
import { Zap, Search } from 'lucide-react';

interface NumberGridProps {
  totalTickets: number;
  soldTickets: string[];
  onSelect: (number: string) => void;
  onSelectMultiple: (numbers: string[]) => void; // Para os pacotes
  selectedNumbers: string[];
}

export const NumberGrid = ({ totalTickets, soldTickets, onSelect, onSelectMultiple, selectedNumbers }: NumberGridProps) => {
  const [search, setSearch] = useState("");

  const numbers = useMemo(() => {
    if (!totalTickets) return [];
    return Array.from({ length: totalTickets }, (_, i) => formatTicketNumber(i, totalTickets));
  }, [totalTickets]);

  const filteredNumbers = useMemo(() => {
    const list = search 
      ? numbers.filter(n => n.includes(search)) 
      : numbers;
    
    // Limite de 200 para agilidade do cliente
    return list.slice(0, 200); 
  }, [search, numbers]);

  const handleQuickBuy = (amount: number) => {
    const available = numbers.filter(n => !soldTickets.includes(n) && !selectedNumbers.includes(n));
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, amount);
    onSelectMultiple(selection);
  };

  const bundles = [5, 10, 20, 50, 100];

  return (
    <div className="space-y-8">
      {/* Botões de Pacotes */}
      <div className="bg-[#121826] p-6 rounded-4xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-4 text-blue-500">
          <Zap size={20} fill="currentColor" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Compra Rápida</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {bundles.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickBuy(amount)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500 p-4 rounded-2xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 group"
            >
              <span className="text-2xl font-black text-white group-hover:text-blue-500">+{amount}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cotas</span>
            </button>
          ))}
        </div>
      </div>

      {/* Busca e Legenda */}
      <div className="bg-[#121826] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar número da sorte..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-800 border border-slate-700" /> Livre</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600" /> Seleção</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-900/40" /> Vendido</div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {filteredNumbers.map((num) => {
          const isSold = soldTickets.includes(num);
          const isSelected = selectedNumbers.includes(num);

          return (
            <button
              key={num}
              disabled={isSold}
              onClick={() => onSelect(num)}
              className={cn(
                "flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition-all active:scale-90",
                isSold 
                  ? "bg-red-900/10 border-red-900/20 text-red-900/40 cursor-not-allowed" 
                  : isSelected
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "bg-[#121826] border-slate-800 text-slate-400 hover:border-blue-500 hover:text-blue-500"
              )}
            >
              {num}
            </button>
          );
        })}
      </div>

      {numbers.length > 200 && !search && (
        <p className="text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
          Mostrando os primeiros 200 números. Use a busca ou pacotes.
        </p>
      )}
    </div>
  );
};