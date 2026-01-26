"use client";

import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useSettings } from "@/hooks/useSettings";
import { 
  Copy, 
  Smartphone, 
  User, 
  Loader2, 
  MessageCircle, 
  QrCode,
  ArrowRight,
  ShieldCheck,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  totalValue: number;
  selectedNumbers: string[];
  raffleTitle: string;
  raffleId: string;
  cambistaId?: string | null;
  onSuccess: () => void;
}

type Step = "FORM" | "PIX";

export const CheckoutModal = ({ 
  totalValue, 
  selectedNumbers, 
  raffleTitle, 
  raffleId, 
  cambistaId, 
  onSuccess 
}: CheckoutModalProps) => {
  const { pixKey, whatsapp } = useSettings();
  const [step, setStep] = useState<Step>("FORM");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  // MÁSCARA DE TELEFONE (UX DE ELITE)
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleCopyPix = () => {
    if (!pixKey) return toast.error("Chave PIX não configurada.");
    navigator.clipboard.writeText(pixKey);
    toast.success("Chave PIX copiada!");
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = formData.phone.replace(/\D/g, "");
    const cleanName = formData.name.trim();

    if (cleanName.length < 3) return toast.error("Informe seu nome completo");
    if (cleanPhone.length !== 11) return toast.error("WhatsApp inválido com DDD");

    setLoading(true);
    try {
      // 1. Cria o Pedido Principal
      const orderRef = await addDoc(collection(db, "pedidos"), {
        customerName: cleanName,
        customerPhone: cleanPhone,
        selectedNumbers,
        totalValue,
        raffleId,
        raffleTitle,
        cambistaId: cambistaId || null,
        status: "PENDENTE",
        createdAt: serverTimestamp(),
      });
      
      // 2. Cria as Reservas Temporárias
      const reservePromises = selectedNumbers.map(num => 
        setDoc(doc(db, "rifas", raffleId, "pending_numbers", num), {
          orderId: orderRef.id,
          customerPhone: cleanPhone,
          expiresAt: new Date(Date.now() + 30 * 60000)
        })
      );
      
      await Promise.all(reservePromises);
      
      setStep("PIX");
      toast.success("Reserva realizada! Conclua o pagamento.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 w-full max-w-[95vw] md:max-w-md mx-auto">
      {step === "FORM" ? (
        <form onSubmit={handleProcessCheckout} className="space-y-6">
          <div className="text-center space-y-2 mb-6 md:mb-8">
            <div className="bg-blue-600/10 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
              <ShieldCheck className="text-blue-500" size={28} />
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Finalizar Reserva</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Seus dados estão protegidos</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="text"
                placeholder="Seu Nome Completo"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="tel"
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
              />
            </div>
          </div>

          {/* RESUMO BLINDADO: Não estoura no mobile */}
          <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800 pb-2">
              <span>Resumo do Pedido</span>
              <span className="text-blue-500 italic">{selectedNumbers.length} Cotas</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {selectedNumbers.slice(0, 10).map(n => (
                  <span key={n} className="bg-blue-600/10 text-blue-500 text-[9px] font-black px-2 py-1 rounded-lg border border-blue-500/10 tracking-tighter">
                    {n}
                  </span>
                ))}
                {selectedNumbers.length > 10 && (
                  <span className="text-[10px] text-slate-600 font-black self-center">
                    +{selectedNumbers.length - 10}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total</span>
                <p className="text-xl md:text-2xl font-black text-[#00E676] italic tracking-tighter">
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>Reservar Agora <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
              <QrCode className="text-green-500" size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Pagamento PIX</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Reserva expira em <span className="text-orange-500">30 minutos</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Copia e Cola</p>
            <p className="text-[11px] font-bold text-white break-all bg-black/30 p-3 rounded-xl border border-white/5 select-all">
              {pixKey || "Chave não configurada"}
            </p>
            <button 
              onClick={handleCopyPix}
              className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-6 py-3 rounded-xl mx-auto transition-all font-black uppercase text-[10px] tracking-widest border border-blue-500/20"
            >
              <Copy size={14} /> Copiar Chave
            </button>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => {
                const text = `Oi! Fiz uma reserva de ${selectedNumbers.length} cotas na rifa "${raffleTitle}". Segue o comprovante!`;
                window.open(`https://wa.me/${whatsapp || "5579999999999"}?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="w-full bg-[#075E54] hover:bg-[#0C7A6D] py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <MessageCircle size={20} /> Enviar Comprovante
            </button>
            <button 
              onClick={onSuccess}
              className="w-full text-slate-500 py-2 font-black uppercase text-[9px] tracking-[0.3em] hover:text-white transition-colors"
            >
              Já paguei, fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};