"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { RaffleSchema, LuckyNumber } from "@/schemas/raffle";
import { Save, Loader2, Plus, Trash2, Gift, Share2, Copy, Check, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Importamos o toast

type RaffleFormData = z.infer<typeof RaffleSchema>;

export default function NewRaffle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [luckyNumbers, setLuckyNumbers] = useState<LuckyNumber[]>([]);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RaffleFormData>({
    resolver: zodResolver(RaffleSchema) as any,
    defaultValues: {
      title: "", 
      description: "", 
      ticketPrice: 0.10,
      drawDate: "", 
      type: "CENTENA", 
      totalTickets: 1000, 
      status: "OPEN",
    },
  });

  const selectedType = watch("type");
  const shareLink = typeof window !== "undefined" && createdId ? `${window.location.origin}/raffle/${createdId}` : "";

  useEffect(() => {
    const totals = { DEZENA: 100, CENTENA: 1000, MILHAR: 10000 };
    setValue("totalTickets", totals[selectedType as keyof typeof totals]);
  }, [selectedType, setValue]);

  const addLuckyNumber = () => setLuckyNumbers([...luckyNumbers, { number: "", prize: "" }]);
  const removeLuckyNumber = (index: number) => setLuckyNumbers(luckyNumbers.filter((_, i) => i !== index));
  const updateLuckyNumber = (index: number, field: keyof LuckyNumber, value: string) => {
    const updated = [...luckyNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setLuckyNumbers(updated);
  };

  const onSubmit: SubmitHandler<RaffleFormData> = async (data) => {
    setLoading(true);
    const toastId = toast.loading("A processar a criação do sorteio...");
    
    try {
      const docRef = await addDoc(collection(db, "rifas"), {
        ...data, 
        luckyNumbers, 
        createdAt: serverTimestamp(),
      });
      setCreatedId(docRef.id);
      toast.success("Sorteio criado com sucesso! 🚀", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Falha ao salvar. Verifique a conexão.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdId) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-500">
          <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Share2 className="text-green-500" size={32} />
          </div>
          <h2 className="text-3xl font-black uppercase mb-2 italic">Pronto para Divulgar!</h2>
          <div className="bg-white p-4 rounded-3xl inline-block mb-8 shadow-xl">
            <QRCodeSVG value={shareLink} size={180} />
          </div>
          <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between gap-2 text-left mb-6 border border-slate-800">
            <span className="text-xs text-slate-400 truncate flex-1">{shareLink}</span>
            <button onClick={handleCopy}>
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-blue-500" />}
            </button>
          </div>
          <button onClick={() => router.push("/admin")} className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            <ArrowLeft size={18} /> Voltar à Gestão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none italic">Novo Sorteio</h1>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 p-6 rounded-3xl flex items-start gap-4 animate-in fade-in duration-500">
            <AlertCircle className="text-red-500 shrink-0" size={24} />
            <div className="text-left">
              <p className="text-red-500 font-black uppercase text-xs tracking-widest leading-none mb-2">Campos Pendentes:</p>
              <ul className="list-disc list-inside text-xs text-red-400 font-bold uppercase">
                {Object.entries(errors).map(([key, err]: any) => (
                  <li key={key}>{key}: {err.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800 space-y-6 shadow-2xl text-left">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">Título da Rifa</label>
              <input 
                {...register("title")} 
                className={cn(
                  "w-full bg-slate-900 border rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                  errors.title ? "border-red-500" : "border-slate-800"
                )} 
                placeholder="Ex: iPhone 16 Pro Max"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">Descrição e Regras</label>
              <textarea 
                {...register("description")} 
                rows={3}
                className={cn(
                  "w-full bg-slate-900 border rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none",
                  errors.description ? "border-red-500" : "border-slate-800"
                )} 
                placeholder="Detalhes do sorteio..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">Preço da Cota (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register("ticketPrice", { valueAsNumber: true })} 
                  className={cn(
                    "w-full bg-slate-900 border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white",
                    errors.ticketPrice ? "border-red-500" : "border-slate-800"
                  )} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">Data do Sorteio</label>
                <input 
                  type="date" 
                  {...register("drawDate")} 
                  className={cn(
                    "w-full bg-slate-900 border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white",
                    errors.drawDate ? "border-red-500" : "border-slate-800"
                  )} 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">Formato</label>
              <select {...register("type")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500">
                <option value="DEZENA">Dezena (100 números)</option>
                <option value="CENTENA">Centena (1.000 números)</option>
                <option value="MILHAR">Milhar (10.000 números)</option>
              </select>
            </div>
          </div>

          <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800 space-y-4 shadow-xl text-left">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2 text-white italic">
                <Gift className="text-blue-500" size={20} /> Cotas Premiadas
              </h2>
              <button 
                type="button" 
                onClick={addLuckyNumber} 
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            {luckyNumbers.map((ln, idx) => (
              <div key={idx} className="flex gap-2 animate-in slide-in-from-left-4 duration-300">
                <input 
                  placeholder="Nº" 
                  className="w-24 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-center font-bold focus:border-blue-500 outline-none text-white" 
                  value={ln.number} 
                  onChange={(e) => updateLuckyNumber(idx, "number", e.target.value)} 
                />
                <input 
                  placeholder="Prémio" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none text-white" 
                  value={ln.prize} 
                  onChange={(e) => updateLuckyNumber(idx, "prize", e.target.value)} 
                />
                <button type="button" onClick={() => removeLuckyNumber(idx)} className="text-slate-600 hover:text-red-500 p-2 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all text-white"
          >
            {loading ? <Loader2 className="animate-spin text-white" /> : <Save size={24} className="text-white" />} 
            SALVAR SORTEIO
          </button>
        </form>
      </div>
    </div>
  );
}