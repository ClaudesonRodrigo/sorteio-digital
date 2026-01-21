"use client";

import React, { useState, use } from "react"; // Importamos o 'use' para o React 19
import { fetchFederalResult, extractWinnerNumber } from "@/services/lotteryService";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, Trophy, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Tipagem de Elite para o Next.js 16
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CheckWinner({ params }: PageProps) {
  // Desembrulhando o ID da Rifa conforme a nova regra do Next.js
  const resolvedParams = use(params);
  const raffleId = resolvedParams.id;

  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [winner, setWinner] = useState<any>(null);

  const handleCheck = async () => {
    setChecking(true);
    setWinner(null);
    try {
      // 1. Busca os dados da Rifa
      const raffleRef = doc(db, "rifas", raffleId);
      const raffleSnap = await getDoc(raffleRef);
      
      if (!raffleSnap.exists()) {
        alert("Sorteio não encontrado no banco de dados.");
        return;
      }
      const raffleData = raffleSnap.data();

      // 2. Busca o resultado oficial da Loteria Federal
      const fed = await fetchFederalResult();
      if (!fed) {
        alert("Não foi possível conectar com a API da Caixa. Tente novamente em instantes.");
        return;
      }

      // Pegamos o 1º prêmio (index 0)
      const firstPrize = fed.dezenas[0];
      const winningTicket = extractWinnerNumber(firstPrize, raffleData.type);

      // 3. Verifica se o número foi vendido (subcoleção sold_numbers)
      const ticketsRef = collection(db, "rifas", raffleId, "sold_numbers");
      const q = query(ticketsRef, where("number", "==", winningTicket));
      const ticketSnap = await getDocs(q);

      setResult({
        concurso: fed.concurso,
        firstPrize,
        winningTicket,
        drawDate: fed.data
      });

      if (!ticketSnap.empty) {
        setWinner(ticketSnap.docs[0].data());
      } else {
        setWinner("ACUMULOU");
      }
    } catch (error) {
      console.error("Erro na conferência:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 font-bold uppercase text-xs">
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>

        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Conferir Resultado</h1>
          <p className="text-slate-500 mb-10">Sincronização oficial com a Loteria Federal.</p>
          
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/10 active:scale-95"
          >
            {checking ? <Loader2 className="animate-spin" /> : <Search />}
            {checking ? "BUSCANDO DADOS..." : "VERIFICAR GANHADOR"}
          </button>
        </div>

        {result && (
          <div className="mt-12 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] text-center">
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">
                Resultado Federal - Concurso {result.concurso} ({result.drawDate})
              </p>
              
              <div className="flex flex-col items-center">
                <span className="text-slate-600 text-xs font-bold uppercase mb-1">1º Prêmio Extraído</span>
                <span className="text-3xl font-mono text-slate-400 tracking-widest">{result.firstPrize}</span>
              </div>

              <div className="mt-8 bg-blue-600/10 border border-blue-500/20 p-8 rounded-3xl">
                <span className="text-blue-500 text-xs font-black uppercase tracking-widest block mb-2">Número Ganhador</span>
                <span className="text-7xl font-black text-white">{result.winningTicket}</span>
              </div>
            </div>

            {winner && (
              <div className={cn(
                "p-8 rounded-[2.5rem] text-center border animate-in slide-in-from-top-4 duration-700",
                winner === "ACUMULOU" ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20"
              )}>
                {winner === "ACUMULOU" ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-black text-amber-500 uppercase">Acumulou!</p>
                    <p className="text-slate-500 text-sm">Nenhum cliente comprou esta cota ainda.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Trophy className="text-yellow-500" size={48} />
                    <p className="text-2xl font-black text-green-500 uppercase">Temos um Ganhador!</p>
                    <div className="bg-slate-900/50 p-4 rounded-2xl w-full">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Contato do Sortudo</p>
                      <p className="text-xl font-black text-white">{winner.buyerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}