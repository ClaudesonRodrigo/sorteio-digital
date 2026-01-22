"use client";

import React from 'react';
import { Calendar, Ticket, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Raffle } from '@/schemas/raffle';
import { useRouter } from 'next/navigation';

interface RaffleCardProps {
  raffle: Raffle;
  className?: string;
}

export const RaffleCard = ({ raffle, className }: RaffleCardProps) => {
  const router = useRouter();
  const isOpen = raffle.status === "OPEN";

  const formatDate = (date: any) => {
    if (!date) return "--/--/--";
    if (typeof date === "string") return date.split("-").reverse().join("/");
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div 
      onClick={() => isOpen && router.push(`/raffle/${raffle.id}`)}
      className={cn(
        "group relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-[#121826] p-8 transition-all hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer shadow-inner",
        !isOpen && "opacity-75 grayscale-[0.5]",
        className
      )}
    >
      {/* Badge de Status */}
      <div className={cn(
        "absolute right-6 top-6 flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg",
        isOpen ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
      )}>
        {isOpen ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Em Aberto
          </>
        ) : (
          <>
            <Clock size={12} />
            Finalizado
          </>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-black text-white line-clamp-1 uppercase italic tracking-tighter group-hover:text-blue-500 transition-colors">
          {raffle.title}
        </h3>
        <p className="mt-3 text-sm text-slate-500 font-medium line-clamp-2 italic leading-relaxed">
          {raffle.description}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
            <Calendar size={14} className="text-blue-500" />
            <span>{formatDate(raffle.drawDate)}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
            <Ticket size={14} className="text-blue-500" />
            <span>{raffle.totalTickets} Cotas</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-900/80 p-6 rounded-4xl border border-slate-800 group-hover:border-blue-900/50 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Cota Individual</span>
            <span className="text-3xl font-black text-white italic tracking-tighter">
              {Number(raffle.ticketPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-black/20",
            isOpen ? "bg-blue-600 text-white group-hover:scale-110 group-hover:rotate-12" : "bg-slate-800 text-slate-600"
          )}>
            <ArrowRight size={24} strokeWidth={3} />
          </div>
        </div>
      </div>
      
      {/* Detalhe de luz no fundo */}
      <div className="absolute -bottom-12 -right-12 h-32 w-32 bg-blue-600/5 blur-[50px] rounded-full group-hover:bg-blue-600/10 transition-all" />
    </div>
  );
};