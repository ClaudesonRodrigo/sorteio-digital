"use client";

import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Copy, Check, MessageCircle, Loader2, Smartphone } from 'lucide-react';
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface CheckoutModalProps {
  totalValue: number;
  selectedNumbers: string[];
  raffleTitle: string;
  raffleId: string;
  onSuccess: () => void;
}

export const CheckoutModal = ({ totalValue, selectedNumbers, raffleTitle, raffleId, onSuccess }: CheckoutModalProps) => {
  const [step, setStep] = useState<'info' | 'pix'>('info');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  
  // PULO DO GATO: Mantemos uma cópia local para o valor não zerar no Modal
  const [frozenData] = useState({
    numbers: [...selectedNumbers],
    value: totalValue
  });

  const pixKey = "SUA_CHAVE_PIX_AQUI"; 

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Criar o Pedido
      await addDoc(collection(db, "pedidos"), {
        customerName: formData.name,
        customerPhone: formData.phone,
        selectedNumbers: frozenData.numbers,
        totalValue: frozenData.value,
        raffleTitle,
        raffleId, 
        status: "PENDENTE",
        createdAt: serverTimestamp(),
      });

      // 2. Reservar os números (Laranja)
      const batchPromises = frozenData.numbers.map(num => 
        setDoc(doc(db, "rifas", raffleId, "pending_numbers", num), {
          reservedAt: serverTimestamp(),
          customerPhone: formData.phone
        })
      );
      await Promise.all(batchPromises);

      // 3. Sucesso
      toast.success("Reserva realizada! Pague o PIX para confirmar.");
      setStep('pix');
      
      // Só limpamos o pai DEPOIS que já mudamos para a tela de PIX
      onSuccess(); 
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar reserva.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const message = `Olá! Fiz um pedido no *${raffleTitle}*%0A*Cotas:* ${frozenData.numbers.join(", ")}%0A*Total:* R$ ${frozenData.value.toFixed(2)}%0A*Nome:* ${formData.name}`;
    window.open(`https://wa.me/5579996337995?text=${message}`, '_blank');
  };

  if (step === 'info') {
    return (
      <div className="bg-[#121826] text-white p-8 rounded-[2.5rem] shadow-2xl max-w-md mx-auto border border-slate-800 animate-in zoom-in duration-300">
        <h2 className="text-2xl font-black uppercase mb-6 tracking-tighter text-center italic">Dados da Reserva</h2>
        <form onSubmit={handleConfirmOrder} className="space-y-4 text-left">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome Completo</label>
            <input required placeholder="Seu nome" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">WhatsApp</label>
            <input required type="tel" placeholder="(79) 9XXXX-XXXX" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Smartphone size={18} />} GERAR PIX
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] text-white p-8 rounded-[2.5rem] shadow-2xl max-w-md mx-auto border border-slate-800 text-center">
      <h2 className="text-3xl font-black uppercase mb-2 text-[#00E676] italic">Pagamento PIX</h2>
      <p className="text-slate-500 text-sm mb-8">Valor total: <span className="text-white font-bold">R$ {frozenData.value.toFixed(2)}</span></p>
      
      <div className="bg-white p-6 rounded-4xl inline-block w-full mb-6 border-4 border-white shadow-xl">
        <QRCodeSVG value={pixKey} size={250} className="mx-auto" />
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => { navigator.clipboard.writeText(pixKey); setCopied(true); toast.success("Copiado!"); setTimeout(() => setCopied(false), 2000); }} 
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-bold border border-slate-700"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />} {copied ? "COPIADO!" : "COPIAR CHAVE PIX"}
        </button>
        
        <button onClick={handleWhatsAppRedirect} className="w-full bg-[#075E54] hover:bg-[#0C7A6D] flex items-center justify-center gap-2 py-5 rounded-xl font-black text-sm uppercase shadow-lg">
          <MessageCircle size={24} /> Enviar Comprovante
        </button>
      </div>
    </div>
  );
};