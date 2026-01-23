"use client";

import { RaffleCard } from "@/components/RaffleCard";
import { useRaffles } from "@/hooks/useRaffles";
import { Loader2 } from "lucide-react";
import { Raffle } from "@/schemas/raffle";

export default function Home() {
  const { raffles, loading } = useRaffles();

  return (
    <main className="min-h-screen bg-[#0A0F1C] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 md:mb-12 mt-12 md:mt-0 px-2 md:px-0">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic leading-none">
            Sorteios <span className="text-blue-600">Ativos</span>
          </h1>
          <p className="text-slate-500 mt-2 text-xs md:text-sm font-medium uppercase tracking-widest">
            Resultados baseados na Loteria Federal oficial.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="mt-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Buscando prêmios...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {raffles.map((raffle: Raffle, index: number) => (
              <RaffleCard key={raffle.id || `raffle-${index}`} raffle={raffle} />
            ))}
          </div>
        )}

        {!loading && raffles.length === 0 && (
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-800 p-12 text-center mt-10">
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhum sorteio encontrado no momento.</p>
          </div>
        )}
      </div>
    </main>
  );
}