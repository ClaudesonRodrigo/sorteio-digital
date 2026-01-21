"use client";

import React, { useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';

interface CheckoutModalProps {
  totalValue: number;
  selectedNumbers: string[];
  raffleTitle: string;
}

export const CheckoutModal = ({ totalValue, selectedNumbers, raffleTitle }: CheckoutModalProps) => {
  const { pixKey } = useSettings();
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");

  // URL para gerar QR Code estático (exemplo didático)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=pay-to-${pixKey}-amount-${totalValue}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppRedirect = () => {
    const message = `Olá! Acabei de fazer o pagamento do sorteio: ${raffleTitle}. %0A*Números:* ${selectedNumbers.join(", ")} %0A*Valor:* R$ ${totalValue.toFixed(2)}`;
    window.open(`https://wa.me/55799XXXX-XXXX?text=${message}`, '_blank'); // Troque pelo seu número de Aracaju
  };

  return (
    <div className="bg-[#121826] text-white p-6 rounded-3xl shadow-2xl max-w-md mx-auto border border-slate-800">
      <div className="text-center mb-6">
        <p className="text-slate-400 text-sm uppercase font-bold tracking-widest">Valor Total</p>
        <h2 className="text-4xl font-black text-[#00E676]">R$ {totalValue.toFixed(2)}</h2>
      </div>

      <div className="bg-[#1A2235] p-6 rounded-2xl border border-dashed border-slate-700 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 text-blue-400 font-bold">
          <span className="p-1 bg-blue-500/20 rounded text-[10px]">PIX</span>
          Pagamento via Pix
        </div>

        <img src={qrCodeUrl} alt="QR Code Pix" className="mx-auto rounded-lg mb-4 bg-white p-2" />

        <button 
          onClick={copyToClipboard}
          className="w-full flex items-center justify-center gap-2 bg-[#2D3748] hover:bg-[#3D4A61] py-3 rounded-xl font-bold transition-all mb-2"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
          {copied ? "Copiado!" : "Copiar Chave Pix"}
        </button>
        <p className="text-slate-500 text-xs">Copia a chave e pague no seu app de banco.</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase ml-1">Seu WhatsApp (para confirmação)</label>
          <input 
            type="text" 
            placeholder="(79) 9XXXX-XXXX"
            className="w-full bg-[#1A2235] border border-slate-700 rounded-xl p-4 mt-1 outline-none focus:border-blue-500 transition-all"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button 
          onClick={handleWhatsAppRedirect}
          className="w-full bg-[#075E54] hover:bg-[#0C7A6D] flex items-center justify-center gap-2 py-4 rounded-xl font-black text-lg transition-all"
        >
          <MessageCircle size={24} />
          Enviar Comprovante
        </button>
      </div>
    </div>
  );
};