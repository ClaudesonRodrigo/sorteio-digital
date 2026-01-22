"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Trophy, Calendar, Ticket, ArrowLeft, Loader2, Phone, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function WinnersPage() {
  const router = useRouter();
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const q = query(
          collection(db, "rifas"),
          where("status", "==", "FINISHED")
        );
        
        const snap = await getDocs(q);
        
        // Mapeamos os dados com tipagem any para permitir a ordenação sem erros de propriedade
        const data = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as any[];

        // Ordenação robusta: verifica se finalizedAt existe antes de acessar seconds
        data.sort((a, b) => {
          const dateA = a.winner?.finalizedAt?.seconds || 0;
          const dateB = b.winner?.finalizedAt?.seconds || 0;
          return dateB - dateA;
        });

        setWinners(data);
      } catch (error) {
        console.error("Erro ao carregar Hall da Fama:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-left">
            <button 
              onClick={() => router.push('/')} 
              className="flex items-center gap-2 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest mb-6 transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
            </button>
            <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none mb-2 text-blue-500">
              Hall da Fama
            </h1>
            <p className="text-slate-500 text-lg font-medium italic">Confira os ganhadores oficiais do Sorteio Digital</p>
          </div>
          
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl flex items-center gap-4 shadow-xl">
            <Trophy className="text-blue-500" size={40} />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-slate-400">Total de</p>
              <p className="text-3xl font-black text-blue-500 italic leading-none">{winners.length} Prêmios</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {winners.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-[#121826] border border-slate-800 rounded-[3rem] space-y-4">
              <Ticket className="text-slate-700 mx-auto opacity-20" size={64} />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest italic">Aguardando a finalização do primeiro sorteio.</p>
            </div>
          ) : (
            winners.map((raffle) => (
              <div 
                key={raffle.id} 
                className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-blue-500 transition-all group animate-in fade-in slide-in-from-bottom-5"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="bg-green-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Sorteio Concluído
                    </span>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase">
                        {raffle.winner?.finalizedAt 
                          ? new Date(raffle.winner.finalizedAt.seconds * 1000).toLocaleDateString('pt-BR') 
                          : "Data não disponível"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black uppercase italic leading-tight group-hover:text-blue-500 transition-colors">
                    {raffle.title}
                  </h3>

                  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-inner">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-900/40">
                        {raffle.winner?.number}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1 italic">Vencedor(a)</p>
                        <p className="text-lg font-black truncate italic text-white leading-none">
                          {raffle.winner?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Phone size={12} />
                        <span className="text-[10px] font-bold">
                          {raffle.winner?.phone ? raffle.winner.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) *****-$3") : "(00) *****-0000"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Hash size={12} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {raffle.winner?.fullFederal ? "Federal" : "Aleatório"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-slate-500 text-[10px] font-medium italic line-clamp-2">
                      {raffle.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}