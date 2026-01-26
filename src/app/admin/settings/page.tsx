"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  Settings, 
  Smartphone, 
  QrCode, 
  Save, 
  Loader2, 
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    pixKey: "",
    whatsapp: "",
    platformName: "Sorteio Digital",
  });

  // CARREGAMENTO INICIAL
  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const docRef = doc(db, "settings", "global");
      await setDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success("Definições atualizadas com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao gravar no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0F1C]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-blue-500">
            <Settings size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sistema de Configuração</span>
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Definições de <span className="text-blue-500">Elite</span></h1>
          <p className="text-slate-500 text-sm font-medium">Gere as informações vitais da tua plataforma de sorteios.</p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          {/* CARD DE PAGAMENTO */}
          <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <QrCode size={120} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20">
                  <DollarSign size={24} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Recebimento via PIX</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Esta chave será exibida no checkout</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chave PIX Principal (Copia e Cola)</label>
                <div className="relative group">
                  <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text"
                    required
                    placeholder="Chave PIX (E-mail, CPF ou Aleatória)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({...formData, pixKey: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD DE SUPORTE */}
          <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20">
                  <Smartphone size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Atendimento & Suporte</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">WhatsApp para envio de comprovantes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número do WhatsApp</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: 5579999999999"
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value.replace(/\D/g, "")})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Plataforma</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text"
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                      value={formData.platformName}
                      onChange={(e) => setFormData({...formData, platformName: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DICA DE SEGURANÇA */}
          <div className="flex items-start gap-4 bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl italic">
            <AlertCircle className="text-blue-500 shrink-0" size={20} />
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              <span className="text-blue-500 font-black uppercase tracking-widest text-[10px] block mb-1">Dica do Tech Lead:</span>
              Garante que a chave PIX está correta antes de salvar. Qualquer erro aqui impedirá os teus clientes de concluírem o pagamento. O número do WhatsApp deve conter apenas números, incluindo o 55 e o DDD.
            </p>
          </div>

          {/* BOTÃO DE SALVAR */}
          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : (
              <><Save size={18} /> Gravar Configurações</>
            )}
          </button>
        </form>

        <footer className="text-center pt-8 border-t border-slate-800">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">Aracaju - Sergipe | Protocolo Trator 2026</p>
        </footer>
      </div>
    </div>
  );
}

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}