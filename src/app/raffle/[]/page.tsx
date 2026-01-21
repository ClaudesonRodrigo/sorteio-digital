"use client";

import { useState } from 'react';
import { NumberGrid } from '@/components/NumberGrid';

export default function RaffleDetails({ params }: { params: { id: string } }) {
  const [selected, setSelected] = useState<string[]>([]);
  
  // Mock para exemplo (Isso virá do useRaffleById)
  const raffleType = 1000; // Centena
  const sold = ["086", "123", "586"];

  const handleSelect = (num: string) => {
    setSelected(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Escolha seus números</h1>
          <p className="text-slate-500">Cada bilhete é uma chance de ganhar pela Federal!</p>
        </div>

        <NumberGrid 
          totalTickets={raffleType}
          soldTickets={sold}
          selectedNumbers={selected}
          onSelect={handleSelect}
        />

        {/* Floating Checkout Bar */}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Selecionados</p>
              <p className="text-lg font-black text-blue-600">{selected.length} bilhetes</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">
              Pagar via PIX
            </button>
          </div>
        )}
      </div>
    </div>
  );
}