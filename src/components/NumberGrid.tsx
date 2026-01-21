"use client";

import React, { useState, useMemo } from 'react';
import { cn, formatTicketNumber } from '@/lib/utils';

interface NumberGridProps {
  totalTickets: number;
  soldTickets: string[];
  onSelect: (number: string) => void;
  selectedNumbers: string[];
}

export const NumberGrid = ({ totalTickets, soldTickets, onSelect, selectedNumbers }: NumberGridProps) => {
  const [search, setSearch] = useState("");

  // Gerar números de forma eficiente
  const numbers = useMemo(() => {
    // Se totalTickets for 0 ou nulo, retorna array vazio para não quebrar
    if (!totalTickets) return [];
    return Array.from({ length: totalTickets }, (_, i) => formatTicketNumber(i, totalTickets));
  }, [totalTickets]);

  // Filtrar números (Essencial para Milhar - 10.000 números)
  const filteredNumbers = useMemo(() => {
    const list = search 
      ? numbers.filter(n => n.includes(search)) 
      : numbers;
    
    // Limitamos a exibição inicial para 400 itens para o navegador não travar
    // O usuário usa a busca para achar números específicos fora dos primeiros 400
    return list.slice(0, 400); 
  }, [search, numbers]);

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="bg-[#121826] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="🔍 Buscar número (ex: 085)"
          className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-800 border border-slate-700" /> Livre</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600" /> Selecionado</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-900/40" /> Vendido</div>
        </div>
      </div>

      {/* Grid */}
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

      {numbers.length > 400 && !search && (
        <p className="text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
          Mostrando primeiros 400 números. Use a busca para encontrar outros.
        </p>
      )}
    </div>
  );
};