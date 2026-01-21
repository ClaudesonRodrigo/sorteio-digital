"use client";

import React from 'react';
import { Calendar, Ticket, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Raffle } from '@/schemas/raffle';

interface RaffleCardProps {
  raffle: Raffle;
  className?: string;
}

export const RaffleCard = ({ raffle, className }: RaffleCardProps) => {
  const isOpen = raffle.status === "OPEN";

  // Função para formatar a data com segurança
  const formatDate = (date: any) => {
    if (!date) return "--/--/--";
    // Se for string do formulário (AAAA-MM-DD)
    if (typeof date === "string") {
      return date.split("-").reverse().join("/");
    }
    // Se for objeto Date ou Timestamp do Firebase
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      {/* Badge de Status */}
      <div className={cn(
        "absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
        isOpen ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      )}>
        {isOpen ? <CheckCircle2 size={12} /> : <Clock size={12} />}
        {raffle.status}
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-800 line-clamp-1 uppercase">{raffle.title}</h3>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{raffle.description}</p>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Calendar size={16} className="text-blue-500" />
            <span>{formatDate(raffle.drawDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Ticket size={16} className="text-blue-500" />
            <span>{raffle.totalTickets} números</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-black">Cota</span>
            <span className="text-xl font-black text-blue-600">
              {Number(raffle.ticketPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          <button className={cn(
            "rounded-lg px-4 py-2 text-xs font-black uppercase transition-all active:scale-95",
            isOpen ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}>
            {isOpen ? "Comprar" : "Finalizado"}
          </button>
        </div>
      </div>
    </div>
  );
};