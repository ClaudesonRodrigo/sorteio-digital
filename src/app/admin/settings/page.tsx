"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SettingsSchema, Settings } from "@/schemas/settings"; // Importando ambos
import { Save, Loader2, Smartphone, Key, User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<Settings>({
    // @ts-ignore - Caso o VS Code ainda reclame por cache, mas o tipo está correto
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
          // Garante que os dados do Firestore preencham a interface corretamente
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
    setMessage("");
    try {
      await setDoc(doc(db, "settings", "global"), data);
      setMessage("Configurações salvas com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setMessage("Erro ao salvar configurações.");
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
          <h1 className="text-3xl font-black">Configurações Globais</h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl space-y-4">
            
            <div>
              <label className="text-sm font-bold text-slate-400 block mb-2">Chave Pix</label>
              <input
                {...register("pixKey")}
                className={cn(
                  "w-full bg-slate-900 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500",
                  errors.pixKey && "border-red-500"
                )}
              />
              {errors.pixKey && <p className="text-red-500 text-xs mt-1">{errors.pixKey.message}</p>}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-400 block mb-2">WhatsApp</label>
              <input
                {...register("whatsappNumber")}
                className={cn(
                  "w-full bg-slate-900 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500",
                  errors.whatsappNumber && "border-red-500"
                )}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-400 block mb-2">Nome do Admin</label>
              <input
                {...register("adminName")}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <span className="font-bold text-sm">Modo Manutenção</span>
              <input 
                type="checkbox" 
                {...register("maintenanceMode")}
                className="w-6 h-6 rounded border-slate-700 bg-slate-900 text-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg transition-all"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save className="inline mr-2" />}
            SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}