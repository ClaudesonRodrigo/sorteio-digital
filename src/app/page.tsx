"use client";

import { RaffleCard } from "@/components/RaffleCard";
import { useRaffles } from "@/hooks/useRaffles";
import { Loader2, Ticket } from "lucide-react";
import { Raffle } from "@/schemas/raffle";

export default function Home() {
  const { raffles, loading } = useRaffles();

  return (
    <main className="min-h-screen bg-[#0A0F1C] p-6 md:p-12 text-white">
      <div className="mx-auto max-w-7xl space-y-12">
        
        {/* Header de Elite */}
        <header className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/40">
              <Ticket size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                Sorteios <span className="text-blue-500">Ativos</span>
              </h1>
              <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-[0.3em]">
                Resultados baseados na Loteria Federal oficial
              </p>
            </div>
          </div>
          <div className="h-1 w-20 bg-blue-600 rounded-full" />
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
              Sincronizando com o banco...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in zoom-in duration-500">
            {raffles.map((raffle: Raffle, index: number) => (
              <RaffleCard key={raffle.id || `raffle-${index}`} raffle={raffle} />
            ))}
          </div>
        )}

        {!loading && raffles.length === 0 && (
          <div className="rounded-[3rem] border-2 border-dashed border-slate-800 p-20 text-center animate-in fade-in duration-1000">
            <Ticket className="mx-auto text-slate-800 mb-6" size={64} />
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest italic">
              Nenhum sorteio disponível no momento.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}