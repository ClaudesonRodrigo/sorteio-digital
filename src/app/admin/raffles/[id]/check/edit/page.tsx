"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RaffleSchema, RaffleFormData } from "@/schemas/raffle";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Calendar, Info, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export default function EditRaffle({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;

  // 1. Tipagem direta no useForm garante que o handleSubmit saiba o que esperar
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RaffleFormData>({
    resolver: zodResolver(RaffleSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      status: "OPEN",
      type: "DEZENA",
      ticketPrice: 0,
      totalTickets: 0,
      drawDate: "",
    },
  });

  // 2. Carregamento dos dados com limpeza rigorosa
  useEffect(() => {
    const fetchRaffle = async () => {
      try {
        const snap = await getDoc(doc(db, "rifas", id));
        if (!snap.exists()) {
          toast.error("Rifa não encontrada.");
          router.push("/admin");
          return;
        }

        const data = snap.data();
        const formattedDate = data.drawDate ? data.drawDate.slice(0, 16) : "";

        // Resetamos apenas os campos que o RaffleFormData conhece (Memória Técnica)
        reset({
          title: data.title || "",
          status: data.status || "OPEN",
          type: data.type || "DEZENA",
          description: data.description || "",
          ticketPrice: Number(data.ticketPrice) || 0,
          totalTickets: Number(data.totalTickets) || 0,
          drawDate: formattedDate,
          luckyNumbers: data.luckyNumbers || [],
        });
      } catch (err) {
        toast.error("Erro ao carregar dados.");
      }
    };
    fetchRaffle();
  }, [id, reset, router]);

  // 3. onSubmit tipado apenas com o dado de entrada (Solução da sua pesquisa)
  const onSubmit = async (data: RaffleFormData) => {
    try {
      const docRef = doc(db, "rifas", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Rifa atualizada com sucesso!");
      router.push("/admin");
    } catch (err) {
      toast.error("Erro ao salvar alterações.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <button onClick={() => router.push("/admin")} className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-all font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>

        <header>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-blue-500">Configurar Sorteio</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">ID: {id}</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-[#121826] border border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Título do Prémio</label>
            <input {...register("title")} className={cn("w-full bg-slate-900 border rounded-2xl p-5 text-white outline-none transition-all", errors.title ? "border-red-500" : "border-slate-800 focus:border-blue-500")} />
            {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Status</label>
              <select {...register("status")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black uppercase text-xs cursor-pointer">
                <option value="OPEN">Aberto</option>
                <option value="DRAWING">Sorteando</option>
                <option value="FINISHED">Finalizado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic flex items-center gap-1 tracking-widest">Modalidade <Layers size={12}/></label>
              <select {...register("type")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black uppercase text-xs cursor-pointer">
                <option value="DEZENA">Dezena</option>
                <option value="CENTENA">Centena</option>
                <option value="MILHAR">Milhar</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic flex items-center gap-1 tracking-widest">Descrição <Info size={12} className="text-blue-500" /></label>
            <textarea {...register("description")} rows={3} className={cn("w-full bg-slate-900 border rounded-2xl p-5 text-white outline-none transition-all resize-none", errors.description ? "border-red-500" : "border-slate-800 focus:border-blue-500")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Valor da Cota (R$)</label>
              <input type="number" step="0.01" {...register("ticketPrice")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black italic text-lg shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Qtd. de Cotas</label>
              <input type="number" {...register("totalTickets")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black italic text-lg shadow-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Data do Sorteio Federal</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="datetime-local" {...register("drawDate")} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 pl-14 text-white outline-none focus:border-blue-500 font-bold" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl font-black uppercase text-sm flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            CONSOLIDAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}