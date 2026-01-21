"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { RaffleSchema, Raffle, LuckyNumber } from "@/schemas/raffle";
import { Save, Loader2, Plus, Trash2, Gift, Share2, Copy, Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function NewRaffle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [luckyNumbers, setLuckyNumbers] = useState<LuckyNumber[]>([]);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Raffle>({
    resolver: zodResolver(RaffleSchema) as any,
    defaultValues: {
      title: "", description: "", ticketPrice: 0, 
      drawDate: "", type: "CENTENA", totalTickets: 1000, status: "OPEN",
    },
  });

  const selectedType = watch("type");
  const shareLink = typeof window !== "undefined" && createdId ? `${window.location.origin}/raffle/${createdId}` : "";

  useEffect(() => {
    const totals = { DEZENA: 100, CENTENA: 1000, MILHAR: 10000 };
    setValue("totalTickets", totals[selectedType]);
  }, [selectedType, setValue]);

  const addLuckyNumber = () => setLuckyNumbers([...luckyNumbers, { number: "", prize: "" }]);
  const removeLuckyNumber = (index: number) => setLuckyNumbers(luckyNumbers.filter((_, i) => i !== index));
  const updateLuckyNumber = (index: number, field: keyof LuckyNumber, value: string) => {
    const updated = [...luckyNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setLuckyNumbers(updated);
  };

  const onSubmit: SubmitHandler<Raffle> = async (data) => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "rifas"), {
        ...data, luckyNumbers, createdAt: serverTimestamp(),
      });
      setCreatedId(docRef.id);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  if (createdId) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Share2 className="text-green-500" size={32} /></div>
          <h2 className="text-3xl font-black uppercase mb-2">Rifa Criada!</h2>
          <div className="bg-white p-4 rounded-2xl inline-block mb-8"><QRCodeSVG value={shareLink} size={180} /></div>
          <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between gap-2 text-left mb-6 border border-slate-800">
            <span className="text-xs text-slate-400 truncate flex-1">{shareLink}</span>
            <button onClick={() => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-blue-500" />}
            </button>
          </div>
          <button onClick={() => router.push("/admin")} className="w-full bg-slate-800 py-4 rounded-xl font-bold flex items-center justify-center gap-2"><ArrowLeft size={18} /> Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black uppercase mb-10">Nova Rifa</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800 space-y-6">
            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Título</label><input {...register("title")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none" /></div>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Preço</label><input type="number" step="0.01" {...register("ticketPrice", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Data</label><input type="date" {...register("drawDate")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none" /></div>
            </div>
            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Tipo</label><select {...register("type")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white appearance-none"><option value="DEZENA">Dezena</option><option value="CENTENA">Centena</option><option value="MILHAR">Milhar</option></select></div>
          </div>
          <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-black uppercase flex items-center gap-2"><Gift className="text-blue-500" /> Cotas Premiadas</h2><button type="button" onClick={addLuckyNumber} className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={16} /></button></div>
            {luckyNumbers.map((ln, idx) => (
              <div key={idx} className="flex gap-2"><input placeholder="Nº" className="w-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-center" value={ln.number} onChange={(e) => updateLuckyNumber(idx, "number", e.target.value)} /><input placeholder="Prêmio" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={ln.prize} onChange={(e) => updateLuckyNumber(idx, "prize", e.target.value)} /><button type="button" onClick={() => removeLuckyNumber(idx)} className="text-red-500 p-2"><Trash2 size={18} /></button></div>
            ))}
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 py-6 rounded-4xl font-black text-xl flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" /> : <Save />} SALVAR SORTEIO</button>
        </form>
      </div>
    </div>
  );
}