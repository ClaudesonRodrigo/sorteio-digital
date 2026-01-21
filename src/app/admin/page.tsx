"use client";

import React, { useState } from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRaffles } from "@/hooks/useRaffles";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { Raffle } from "@/schemas/raffle";
import { 
  DollarSign, Clock, Ticket, TrendingUp, 
  Eye, Edit, Trash2, Share2, X, Copy, Check, Printer, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export default function AdminDashboard() {
  const { stats, loading: loadingStats } = useDashboardStats();
  const { raffles, loading: loadingRaffles } = useRaffles();
  const [shareRaffle, setShareRaffle] = useState<Raffle | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("🚨 ATENÇÃO: Excluir esta rifa apagará todos os registros de vendas. Confirmar?")) return;
    try {
      await deleteDoc(doc(db, "rifas", id));
      alert("Sorteio removido com sucesso.");
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir sorteio.");
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/raffle/${id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Central de Controle</h1>
          <p className="text-slate-500 font-medium">Gestão de Sorteios Digital - Aracaju/SE</p>
        </div>
        <Link 
          href="/admin/raffles/new" 
          className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20 uppercase text-sm"
        >
          <Ticket size={20} /> Novo Sorteio
        </Link>
      </header>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <DollarSign className="text-green-500 mb-4" size={28} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Arrecadado</p>
          <h3 className="text-3xl font-black mt-1">
            {loadingStats ? "..." : stats.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <Clock className="text-amber-500 mb-4" size={28} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aguardando Pagamento</p>
          <h3 className="text-3xl font-black mt-1">{loadingStats ? "..." : stats.pendingOrders}</h3>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <TrendingUp className="text-blue-500 mb-4" size={28} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sorteios Ativos</p>
          <h3 className="text-3xl font-black mt-1">{loadingStats ? "..." : stats.activeRaffles}</h3>
        </div>
      </div>

      {/* Tabela de Gestão */}
      <section className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
          <h2 className="text-xl font-black uppercase tracking-tight">Sorteios Cadastrados</h2>
          <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            {raffles.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="px-8 py-5">Informações do Sorteio</th>
                <th className="px-8 py-5 text-center">Tipo</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Ações de Comando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {raffles.map((raffle) => (
                <tr key={raffle.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors">{raffle.title}</p>
                    <p className="text-xs text-slate-500 font-medium">Extração: {raffle.drawDate}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400">
                      {raffle.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      raffle.status === "OPEN" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {raffle.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-1">
                      {/* BOTÃO VISUALIZAR (Link Público) */}
                      <Link 
                        href={`/raffle/${raffle.id}`} 
                        target="_blank"
                        className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        title="Ver Página do Cliente"
                      >
                        <ExternalLink size={20} />
                      </Link>

                      <button 
                        onClick={() => setShareRaffle(raffle)} 
                        className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        title="Divulgar / QR Code"
                      >
                        <Share2 size={20} />
                      </button>

                      <Link 
                        href={`/admin/raffles/${raffle.id}/edit`} 
                        className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                        title="Editar Configurações"
                      >
                        <Edit size={20} />
                      </Link>

                      <Link 
                        href={`/admin/raffles/${raffle.id}/check`} 
                        className="p-3 text-slate-400 hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-all"
                        title="Conferir Ganhador"
                      >
                        <Eye size={20} />
                      </Link>

                      <button 
                        onClick={() => handleDelete(raffle.id)} 
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Excluir Sorteio"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Divulgação e Impressão de QR Code */}
      {shareRaffle && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-slate-800 w-full max-w-md p-10 rounded-[3rem] text-center relative animate-in zoom-in duration-300 shadow-3xl">
            <button onClick={() => setShareRaffle(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
              <X size={28} />
            </button>
            
            <h3 className="text-2xl font-black uppercase mb-8 tracking-tighter">Divulgar Sorteio</h3>
            
            <div className="bg-white p-6 rounded-[2.5rem] inline-block mb-8 shadow-2xl border-8 border-white">
              <QRCodeSVG 
                value={`${window.location.origin}/raffle/${shareRaffle.id}`} 
                size={220}
                level="H"
                includeMargin={false}
              />
              <p className="text-black font-black mt-4 text-[10px] uppercase tracking-[0.3em]">{shareRaffle.title}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 mb-8 text-left">
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Link de Venda</p>
                <p className="text-xs text-slate-400 truncate">{window.location.origin}/raffle/{shareRaffle.id}</p>
              </div>
              <button 
                onClick={() => copyLink(shareRaffle.id)} 
                className="bg-blue-600/10 p-3 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <button 
              onClick={() => window.print()} 
              className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl"
            >
              <Printer size={20} /> Imprimir QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}