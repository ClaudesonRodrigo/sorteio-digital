"use client";

import React from "react";
import { useRaffles } from "@/hooks/useRaffles";
import { RaffleCard } from "@/components/RaffleCard";
import { Ticket, Trophy, ShieldCheck, Loader2, Search } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { raffles, loading } = useRaffles();

  // Filtramos apenas as rifas que não foram finalizadas para a vitrine principal
  const activeRaffles = raffles.filter(r => r.status !== "FINISHED");

  if (loading) {
    return (
      <div className="h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      {/* HERO SECTION - FOCO EM CONVERSÃO */}
      <section className="relative py-20 px-6 overflow-hidden border-b border-slate-800/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-full mb-4">
            <ShieldCheck className="text-blue-500" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Plataforma 100% Segura</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            Escolha sua <span className="text-blue-500">Sorte</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base font-medium">
            Os melhores prêmios com as menores cotas do Brasil. Participe agora e mude sua realidade!
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link 
              href="/tickets" 
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 transition-all active:scale-95"
            >
              <Search size={18} className="text-blue-500" /> Consultar Meus Números
            </Link>
          </div>
        </div>
      </section>

      {/* GRID DE RIFAS */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Sorteios em Andamento</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aproveite as cotas disponíveis</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">
            <Trophy size={14} /> {activeRaffles.length} Prêmios Ativos
          </div>
        </div>

        {activeRaffles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeRaffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
            <Ticket className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase italic tracking-widest">Nenhum sorteio ativo no momento.</p>
          </div>
        )}
      </main>

      {/* FOOTER SIMPLES */}
      <footer className="py-10 border-t border-slate-900 text-center">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">
          © 2026 Sorteio Digital | Aracaju - SE
        </p>
      </footer>
    </div>
  );
}