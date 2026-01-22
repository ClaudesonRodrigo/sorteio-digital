"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SettingsSchema, type Settings } from "@/schemas/settings"; 
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<Settings>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      pixKey: "",
      whatsappNumber: "",
      adminName: "",
      maintenanceMode: false
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          reset({
            pixKey: data.pixKey || "",
            whatsappNumber: data.whatsappNumber || "",
            adminName: data.adminName || "",
            maintenanceMode: !!data.maintenanceMode
          });
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [reset]);

  const onSubmit: SubmitHandler<Settings> = async (data) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), data);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-blue-500">Configurações Globais</h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest italic">Chave Pix para Recebimento</label>
              <input
                {...register("pixKey")}
                className={cn(
                  "w-full bg-slate-900 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold",
                  errors.pixKey && "border-red-500"
                )}
              />
              {errors.pixKey && <p className="text-red-500 text-[10px] font-bold uppercase ml-1">{errors.pixKey.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest italic">WhatsApp de Suporte</label>
              <input
                {...register("whatsappNumber")}
                className={cn(
                  "w-full bg-slate-900 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold",
                  errors.whatsappNumber && "border-red-500"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest italic">Nome do Administrador</label>
              <input
                {...register("adminName")}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold"
              />
            </div>

            <div className="flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-slate-700/50 transition-all hover:bg-slate-900">
              <div className="flex flex-col">
                <span className="font-black text-xs uppercase italic tracking-tighter">Modo Manutenção</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">Bloqueia o acesso de clientes ao site</span>
              </div>
              <input 
                type="checkbox" 
                {...register("maintenanceMode")}
                className="w-6 h-6 rounded-lg border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-3xl font-black text-sm uppercase italic tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin mx-auto" /> : "SALVAR CONFIGURAÇÕES"}
          </button>
        </form>
      </div>
    </div>
  );
}