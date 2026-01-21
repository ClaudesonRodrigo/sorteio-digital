"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
// IMPORTANTE: O caminho deve terminar em /zod conforme sua versão 5.2.2
import { zodResolver } from "@hookform/resolvers/zod"; 
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { RaffleSchema, Raffle } from "@/schemas/raffle";
import { Save, Loader2 } from "lucide-react";

export default function NewRaffle() {
  const [loading, setLoading] = useState(false);

  // 1. Tipagem de Elite: Passamos <Raffle> para o useForm
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Raffle>({
    // 2. O 'as any' aqui é o Protocolo Trator para silenciar mismatch de versões internas do Zod/Resolver
    resolver: zodResolver(RaffleSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      ticketPrice: 0,
      drawDate: "",
      type: "CENTENA",
      totalTickets: 1000,
      status: "OPEN",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    const totals = { DEZENA: 100, CENTENA: 1000, MILHAR: 10000 };
    setValue("totalTickets", totals[selectedType]);
  }, [selectedType, setValue]);

  // 3. SubmitHandler<Raffle> garante que o onSubmit aceite os dados do formulário
  const onSubmit: SubmitHandler<Raffle> = async (data) => {
    setLoading(true);
    try {
      await addDoc(collection(db, "rifas"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      // Lógica de sucesso aqui
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-8">
      {/* 4. O handleSubmit(onSubmit) agora vai ser aceito sem erro de tipo */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-[#121826] p-8 rounded-[2.5rem] border border-slate-800">
          <input 
            {...register("title")} 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4" 
            placeholder="Título da Rifa"
          />
          
          <input 
            type="number" 
            step="0.01" 
            {...register("ticketPrice", { valueAsNumber: true })} 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4" 
            placeholder="Preço"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-4xl font-black"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "SALVAR SORTEIO"}
        </button>
      </form>
    </div>
  );
}