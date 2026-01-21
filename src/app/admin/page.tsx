"use client";

import React, { useState } from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { useRaffles } from "@/hooks/useRaffles";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { Raffle } from "@/schemas/raffle";
import { 
  DollarSign, Clock, Ticket, TrendingUp, 
  ExternalLink, Share2, Edit, Trash2, CheckCircle, XCircle, User, Smartphone, X, Printer, Copy, Check 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export default function AdminDashboard() {
  const { stats, loading: loadingStats } = useDashboardStats();
  const { raffles } = useRaffles();
  const { orders, approveOrder, loading: loadingOrders } = useAdminOrders();
  const [shareRaffle, setShareRaffle] = useState<Raffle | null>(null);
  const [copied, setCopied] = useState(false);

  // Redução de código: Unificamos a lógica de exclusão e confirmação para ser mais direta
  const handleApprove = async (order: any) => {
    if (!order.raffleId) return alert("Erro: Pedido sem ID de sorteio.");
    if (!confirm(`Confirmar pagamento de ${order.customerName}?`)) return;
    
    const res = await approveOrder(order);
    if (res.success) alert("Pagamento confirmado e números liberados!");
    else alert("Erro ao confirmar pagamento.");
  };

  const handleDeleteRaffle = async (id: string) => {
    if (!confirm("🚨 ATENÇÃO: Excluir esta rifa apagará todos os registros de vendas. Confirmar?")) return;
    try {
      await deleteDoc(doc(db, "rifas", id));
      alert("Sorteio removido com sucesso.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Gestão de Vendas</h1>
          <p className="text-slate-500 font-medium tracking-tight mt-2">Controle em tempo real - Aracaju/SE</p>
        </div>
        <Link href="/admin/raffles/new" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl font-black uppercase text-sm text-white shadow-xl shadow-blue-900/20">
          Novo Sorteio
        </Link>
      </header>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <DollarSign className="text-green-500 mb-4" size={24} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Vendas Confirmadas</p>
          <h3 className="text-3xl font-black mt-2 text-white">
            {loadingStats ? "..." : stats.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <Clock className="text-amber-500 mb-4" size={24} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Aguardando Pix</p>
          <h3 className="text-3xl font-black mt-2 text-white">{loadingStats ? "..." : stats.pendingOrders}</h3>
        </div>
        <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <TrendingUp className="text-blue-500 mb-4" size={24} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Rifas Ativas</p>
          <h3 className="text-3xl font-black mt-2 text-white">{loadingStats ? "..." : stats.activeRaffles}</h3>
        </div>
      </div>

      {/* Tabela de Pedidos Pendentes (Onde você confirma o pagamento) */}
      <section className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Vendas Pendentes</h2>
          <span className="bg-amber-500/10 text-amber-500 px-4 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">Ação Necessária</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest bg-slate-900/50">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Sorteio / Números</th>
                <th className="px-8 py-5 text-right">Valor</th>
                <th className="px-8 py-5 text-center">Confirmar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold flex items-center gap-2 text-slate-100"><User size={14} className="text-blue-500"/> {order.customerName}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Smartphone size={14}/> {order.customerPhone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-300">{order.raffleTitle}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {order.selectedNumbers.map(n => (
                        <span key={n} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono text-blue-400 font-bold">{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-[#00E676] text-lg">
                    {order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => handleApprove(order)} 
                      className="bg-green-600 hover:bg-green-700 p-3 rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-90"
                      title="Aprovar Pagamento"
                    >
                      <CheckCircle size={22} className="text-white" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loadingOrders && (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em]">Nenhum pedido aguardando conferência.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gestão de Sorteios (CRUD) */}
      <section className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-slate-900/30">
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Seus Sorteios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5">Sorteio</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-white">
              {raffles.map((raffle) => (
                <tr key={raffle.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors leading-none">{raffle.title}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{raffle.type} • Data: {raffle.drawDate}</p>
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
                      <Link href={`/raffle/${raffle.id}`} target="_blank" className="p-3 text-slate-400 hover:text-white" title="Link Público"><ExternalLink size={20} /></Link>
                      <button onClick={() => setShareRaffle(raffle)} className="p-3 text-slate-400 hover:text-blue-500" title="QR Code"><Share2 size={20} /></button>
                      <Link href={`/admin/raffles/${raffle.id}/edit`} className="p-3 text-slate-400 hover:text-amber-500" title="Editar"><Edit size={20} /></Link>
                      <button onClick={() => handleDeleteRaffle(raffle.id)} className="p-3 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Divulgação */}
      {shareRaffle && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-slate-800 w-full max-w-md p-10 rounded-[3rem] text-center relative animate-in zoom-in duration-300">
            <button onClick={() => setShareRaffle(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={28} /></button>
            <h3 className="text-2xl font-black uppercase mb-8 tracking-tighter text-white">Divulgar Rifa</h3>
            <div className="bg-white p-6 rounded-[2.5rem] inline-block mb-8 shadow-2xl border-8 border-white">
              <QRCodeSVG value={`${window.location.origin}/raffle/${shareRaffle.id}`} size={220} level="H" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 mb-8">
              <span className="text-xs text-slate-400 truncate text-left">{window.location.origin}/raffle/{shareRaffle.id}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/raffle/${shareRaffle.id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-blue-500">
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <button onClick={() => window.print()} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl">
              <Printer size={20} /> Imprimir QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}