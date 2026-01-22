"use client";

import React, { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { Trophy, ArrowLeft, Hash, User, Smartphone, AlertTriangle, Dices, Loader2, CheckCircle2, Globe, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CheckRaffle({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [federalNumber, setFederalNumber] = useState(""); 
  const [fullFederalNumber, setFullFederalNumber] = useState(""); 
  const [winner, setWinner] = useState<any>(null);
  const [accumulated, setAccumulated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [randomDrawing, setRandomDrawing] = useState(false);

  useEffect(() => {
    const fetchRaffle = async () => {
      const snap = await getDoc(doc(db, "rifas", id));
      if (snap.exists()) setRaffle({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchRaffle();
  }, [id]);

  const fetchFederalAPI = async () => {
    setFetchingAPI(true);
    setWinner(null);
    setAccumulated(false);
    try {
      const response = await fetch("https://loteriascaixa-api.herokuapp.com/api/federal/latest");
      const data = await response.json();
      
      const fullResult = data.dezenas[0]; 
      setFullFederalNumber(fullResult);

      // PULO DO GATO: Lógica para Milhar (4 dígitos), Centena (3) ou Dezena (2)
      let result = "";
      if (raffle.totalTickets > 1000) {
        result = fullResult.slice(-4); // Milhar: pega 4 dígitos
      } else if (raffle.totalTickets > 100) {
        result = fullResult.slice(-3); // Centena: pega 3 dígitos
      } else {
        result = fullResult.slice(-2); // Dezena: pega 2 dígitos
      }
      
      setFederalNumber(result);
      toast.success(`Resultado extraído: ${result}`);
    } catch (error) {
      toast.error("Erro ao capturar dados da API.");
    } finally {
      setFetchingAPI(false);
    }
  };

  const handleCheckWinner = async () => {
    if (!federalNumber) return toast.error("Preencha o número.");
    setProcessing(true);
    setWinner(null);
    setAccumulated(false);

    try {
      const winnerSnap = await getDoc(doc(db, "rifas", id, "sold_numbers", federalNumber));
      if (winnerSnap.exists()) {
        setWinner({ number: federalNumber, ...winnerSnap.data() });
        toast.success("Ganhador encontrado!");
      } else {
        setAccumulated(true);
      }
    } catch (error) {
      toast.error("Erro na verificação.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRandomDraw = async () => {
    setRandomDrawing(true);
    const soldSnap = await getDocs(collection(db, "rifas", id, "sold_numbers"));
    if (soldSnap.empty) return toast.error("Sem vendas aprovadas.");
    
    const soldTickets = soldSnap.docs.map(doc => ({ number: doc.id, ...doc.data() }));
    const luckyWinner = soldTickets[Math.floor(Math.random() * soldTickets.length)];
    
    setTimeout(() => {
      setWinner(luckyWinner);
      setAccumulated(false);
      setRandomDrawing(false);
    }, 2500);
  };

  const handleFinalize = async () => {
    if (!winner) return;
    if (!confirm(`Finalizar sorteio?`)) return;

    try {
      await updateDoc(doc(db, "rifas", id), {
        status: "FINISHED",
        winner: {
          name: winner.buyerName,
          phone: winner.buyerPhone,
          number: winner.number,
          fullFederal: fullFederalNumber || "Sorteio Manual/Aleatório",
          finalizedAt: serverTimestamp()
        }
      });
      toast.success("Sorteio Finalizado!");
      router.push("/admin");
    } catch (error) {
      toast.error("Erro ao finalizar.");
    }
  };

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-10">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest"><ArrowLeft size={16} /> Voltar</button>

        <header className="space-y-2">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-blue-500">Conferir Resultado</h1>
          <p className="text-slate-500 text-xs font-black uppercase">{raffle?.title}</p>
        </header>

        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-2"><Hash className="text-blue-500" size={20} /> Loteria Federal</h2>
            <button onClick={fetchFederalAPI} disabled={fetchingAPI} className="text-[10px] font-black uppercase bg-blue-600/10 text-blue-500 px-5 py-2.5 rounded-full border border-blue-500/20 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
              {fetchingAPI ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />} Buscar Automático
            </button>
          </div>

          {fullFederalNumber && (
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between animate-in fade-in">
              <span className="text-[10px] font-black uppercase text-slate-400">1º Prêmio Oficial:</span>
              <span className="text-2xl font-black italic tracking-[0.2em]">{fullFederalNumber}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Número Ganhador Extraído</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-4xl font-black text-center outline-none focus:border-blue-500 tracking-[0.5em]"
                value={federalNumber}
                onChange={(e) => setFederalNumber(e.target.value)}
                placeholder="----"
              />
              <button onClick={handleCheckWinner} disabled={processing || !federalNumber} className="bg-blue-600 hover:bg-blue-700 px-10 py-6 rounded-2xl font-black uppercase text-xs">Verificar</button>
            </div>
          </div>
        </div>

        {accumulated && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-6">
            <AlertTriangle className="text-orange-500" size={48} />
            <h2 className="text-2xl font-black uppercase italic text-orange-500">Sorteio Acumulou!</h2>
            <button onClick={handleRandomDraw} disabled={randomDrawing} className="bg-orange-600 px-10 py-5 rounded-2xl font-black uppercase text-sm flex items-center gap-3"><Dices size={24} /> {randomDrawing ? "SORTEANDO..." : "SORTEIO ALEATÓRIO"}</button>
          </div>
        )}

        {winner && (
          <div className="bg-green-500/10 border border-green-500/20 p-10 rounded-[2.5rem] text-center space-y-8 animate-in zoom-in">
            <Trophy className="text-green-500 mx-auto" size={72} />
            <h2 className="text-4xl font-black uppercase italic text-green-500">Ganhador! Cota {winner.number}</h2>
            <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 text-left grid grid-cols-2 gap-6">
              <div><p className="text-[10px] text-slate-500 font-black uppercase">Nome</p><p className="text-xl font-bold truncate">{winner.buyerName}</p></div>
              <div><p className="text-[10px] text-slate-500 font-black uppercase">Zap</p><p className="text-xl font-bold">{winner.buyerPhone}</p></div>
            </div>
            <button onClick={handleFinalize} className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-sm">Finalizar Sorteio</button>
          </div>
        )}
      </div>
    </div>
  );
}