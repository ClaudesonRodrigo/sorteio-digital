"use client";

import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  CheckCircle2, 
  Copy, 
  Smartphone, 
  User, 
  Loader2, 
  MessageCircle, 
  QrCode,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  totalValue: number;
  selectedNumbers: string[];
  raffleTitle: string;
  raffleId: string;
  cambistaId?: string | null; // Captura automática do parceiro/cambista
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
  const [step, setStep] = useState<Step>("FORM");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  // Chave PIX (Pode ser alterada futuramente para vir do useSettings)
  const PIX_KEY = "79996337995"; 

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.phone.length < 10) {
      return toast.error("Preencha os dados corretamente");
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        selectedNumbers,
        totalValue,
        raffleId,
        raffleTitle,
        cambistaId: cambistaId || null, // Vínculo com o cambista se existir
        status: "PENDENTE",
        createdAt: serverTimestamp(),
      };

      // 1. Salva o pedido principal
      const orderRef = await addDoc(collection(db, "pedidos"), orderData);
      
      // 2. Reserva os números como pendentes no banco para evitar compras duplicadas
      const reservePromises = selectedNumbers.map(num => 
        setDoc(doc(db, "rifas", raffleId, "pending_numbers", num), {
          orderId: orderRef.id,
          customerPhone: formData.phone,
          expiresAt: new Date(Date.now() + 30 * 60000) // Expira em 30 minutos
        })
      );
      
      await Promise.all(reservePromises);
      
      setStep("PIX");
      toast.success("Reserva realizada! Conclua o pagamento.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar sua reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
      {step === "FORM" ? (
        <form onSubmit={handleProcessCheckout} className="space-y-6">
          <div className="text-center space-y-2 mb-8">
            <div className="bg-blue-600/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
              <ShieldCheck className="text-blue-500" size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Finalizar Reserva</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Informe seus dados para o sorteio</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="text"
                placeholder="Nome Completo"
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
                placeholder="WhatsApp com DDD"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Resumo do Pedido</span>
              <span className="text-blue-500">{selectedNumbers.length} Cotas</span>
            </div>
            <div className="flex justify-between items-end">
              <div className="flex flex-wrap gap-1 max-w-[70%]">
                {selectedNumbers.slice(0, 5).map(n => (
                  <span key={n} className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-500/10">{n}</span>
                ))}
                {selectedNumbers.length > 5 && <span className="text-[10px] text-slate-600 font-bold">+{selectedNumbers.length - 5}</span>}
              </div>
              <p className="text-2xl font-black text-[#00E676] italic">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
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
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed px-4">
              Sua reserva expira em <span className="text-orange-500">30 minutos</span>. Pague agora para garantir seus números.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Chave PIX (Celular)</p>
            <p className="text-xl font-black text-white tracking-widest">{PIX_KEY}</p>
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
                const text = `Oi! Acabei de fazer uma reserva de ${selectedNumbers.length} cotas na rifa "${raffleTitle}". Vou enviar o comprovante!`;
                window.open(`https://wa.me/5579996337995?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="w-full bg-[#075E54] hover:bg-[#0C7A6D] py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <MessageCircle size={20} /> Enviar Comprovante
            </button>
            <button 
              onClick={onSuccess}
              className="w-full text-slate-500 py-2 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              Já paguei, fechar janela
            </button>
          </div>
        </div>
      )}
    </div>
  );
};