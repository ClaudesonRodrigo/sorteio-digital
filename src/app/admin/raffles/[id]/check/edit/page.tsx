"use client";

import React, { useState, useEffect, use } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { RaffleSchema, Raffle, LuckyNumber } from "@/schemas/raffle";
import { Save, Loader2, Plus, Trash2, Gift, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PageProps { params: Promise<{ id: string }>; }

export default function EditRaffle({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [luckyNumbers, setLuckyNumbers] = useState<LuckyNumber[]>([]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<Raffle>({
    resolver: zodResolver(RaffleSchema) as any,
  });

  useEffect(() => {
    const fetchRaffle = async () => {
      const snap = await getDoc(doc(db, "rifas", resolvedParams.id));
      if (snap.exists()) {
        const data = snap.data() as Raffle;
        reset(data);
        setLuckyNumbers(data.luckyNumbers || []);
      }
      setFetching(false);
    };
    fetchRaffle();
  }, [resolvedParams.id, reset]);

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
      await updateDoc(doc(db, "rifas", resolvedParams.id), { ...data, luckyNumbers });
      router.push("/admin");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 mb-6 hover:text-white transition-colors">
          <ArrowLeft size={18} /> Voltar ao Painel
        </Link>
        <h1 className="text-3xl font-black uppercase mb-10 tracking-tight">Editar Sorteio</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800 space-y-6">
            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Título</label><input {...register("title")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Preço</label><input type="number" step="0.01" {...register("ticketPrice", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 outline-none" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Status</label><select {...register("status")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white appearance-none"><option value="OPEN">Aberto</option><option value="DRAWING">Sorteando</option><option value="FINISHED">Finalizado</option><option value="CANCELED">Cancelado</option></select></div>
          </div>
          <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-black uppercase flex items-center gap-2"><Gift className="text-blue-500" /> Cotas Premiadas</h2><button type="button" onClick={addLuckyNumber} className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={16} /></button></div>
            {luckyNumbers.map((ln, idx) => (
              <div key={idx} className="flex gap-2"><input placeholder="Nº" className="w-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-center font-bold" value={ln.number} onChange={(e) => updateLuckyNumber(idx, "number", e.target.value)} /><input placeholder="Prêmio" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" value={ln.prize} onChange={(e) => updateLuckyNumber(idx, "prize", e.target.value)} /><button type="button" onClick={() => removeLuckyNumber(idx)} className="text-red-500 p-2"><Trash2 size={18} /></button></div>
            ))}
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 py-6 rounded-4xl font-black text-xl flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" /> : <Save />} SALVAR ALTERAÇÕES</button>
        </form>
      </div>
    </div>
  );
}