"use client";

import { RaffleCard } from "@/components/RaffleCard";
import { useRaffles } from "@/hooks/useRaffles";
import { Loader2 } from "lucide-react";
import { Raffle } from "@/schemas/raffle";

export default function Home() {
  const { raffles, loading } = useRaffles();

  return (
    <main className="min-h-screen bg-[#0A0F1C] p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Sorteios Ativos
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Resultados baseados na Loteria Federal oficial.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="mt-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Buscando prêmios...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {raffles.map((raffle: Raffle, index: number) => (
              // Usamos o raffle.id e garantimos que ele não seja undefined para o React
              <RaffleCard key={raffle.id || `raffle-${index}`} raffle={raffle} />
            ))}
          </div>
        )}

        {!loading && raffles.length === 0 && (
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-800 p-12 text-center">
            <p className="text-slate-500 font-bold uppercase text-xs">Nenhum sorteio encontrado no momento.</p>
          </div>
        )}
      </div>
    </main>
  );
}