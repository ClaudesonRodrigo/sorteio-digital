"use client";

import React, { useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RaffleSchema, RaffleFormData } from "@/schemas/raffle";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRaffle({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params); // Pulo do Gato: Unwrapping params no Next 15

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RaffleFormData>({
    resolver: zodResolver(RaffleSchema),
    mode: "onChange",
  });

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

        // PULO DO GATO: Formatação para o input datetime-local
        // O input exige YYYY-MM-DDTHH:mm, então cortamos o ISO
        const formattedDate = data.drawDate ? data.drawDate.slice(0, 16) : "";

        reset({
          title: data.title || "",
          status: data.status || "OPEN",
          description: data.description || "",
          ticketPrice: data.ticketPrice || 0,
          totalTickets: data.totalTickets || 0,
          drawDate: formattedDate,
        });
      } catch (err) {
        toast.error("Erro ao carregar rifa.");
      }
    };

    fetchRaffle();
  }, [id, reset, router]);

  const onSubmit = async (data: RaffleFormData) => {
    try {
      await updateDoc(doc(db, "rifas", id), {
        ...data,
        // Salvamos como ISO string padrão para facilitar filtros no futuro
        drawDate: new Date(data.drawDate).toISOString(),
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
        
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>

        <header className="animate-in fade-in slide-in-from-left duration-500">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
            Editar Sorteio
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
            ID: {id}
          </p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#121826] border border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8"
        >
          {/* Título */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest italic">Título da Rifa</label>
            <input
              {...register("title")}
              className={cn(
                "w-full bg-slate-900 border rounded-2xl p-5 text-white outline-none transition-all",
                errors.title ? "border-red-500" : "border-slate-800 focus:border-blue-500"
              )}
            />
            {errors.title && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-2">{errors.title.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest italic">Status do Sorteio</label>
            <select 
              {...register("status")} 
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black uppercase text-xs cursor-pointer"
            >
              <option value="OPEN">Aberto</option>
              <option value="DRAWING">Sorteando</option>
              <option value="FINISHED">Finalizado</option>
              <option value="CANCELED">Cancelado</option>
            </select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest flex items-center gap-1 italic">
              Descrição <Info size={12} className="text-blue-500" />
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className={cn(
                "w-full bg-slate-900 border rounded-2xl p-5 text-white outline-none transition-all resize-none",
                errors.description ? "border-red-500" : "border-slate-800 focus:border-blue-500"
              )}
            />
            {errors.description && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-2">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest italic">Preço da Cota (R$)</label>
              <input
                type="number"
                step="0.01"
                {...register("ticketPrice", { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black italic"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest italic">Total de Cotas</label>
              <input
                type="number"
                {...register("totalTickets", { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-black italic"
              />
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest italic">Data do Sorteio Federal</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="datetime-local"
                {...register("drawDate")}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 pl-14 text-white outline-none focus:border-blue-500 font-bold"
              />
            </div>
            {errors.drawDate && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 mt-2">{errors.drawDate.message}</p>}
          </div>

          <button
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl font-black uppercase text-sm flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            CONSOLIDAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}