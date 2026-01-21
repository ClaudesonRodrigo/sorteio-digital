"use client";

import React from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRaffles } from "@/hooks/useRaffles"; // Usando o hook que já criamos
import { DollarSign, Clock, Ticket, TrendingUp, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { stats, loading: loadingStats } = useDashboardStats();
  const { raffles, loading: loadingRaffles } = useRaffles();

  const cards = [
    {
      label: "Vendas Totais",
      value: stats.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Pedidos Pendentes",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Rifas no Ar",
      value: stats.activeRaffles,
      icon: Ticket,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Comando Central</h1>
          <p className="text-slate-500 font-medium">Aracaju, Sergipe - Monitoramento em Tempo Real</p>
        </div>
        <Link 
          href="/admin/raffles/new" 
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
          <Ticket size={20} /> Nova Rifa
        </Link>
      </header>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-[#121826] border border-slate-800 p-8 rounded-4xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", card.bg)}>
                <card.icon className={card.color} size={24} />
              </div>
              <TrendingUp className="text-slate-700" size={20} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{card.label}</p>
            <h3 className="text-3xl font-black mt-1">{loadingStats ? "..." : card.value}</h3>
          </div>
        ))}
      </div>

      {/* Lista de Rifas Criadas */}
      <section className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tight">Gerenciar Sorteios</h2>
          <span className="text-xs text-slate-500 font-bold uppercase">Total: {raffles.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-4">Sorteio</th>
                <th className="px-8 py-4 text-center">Tipo</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {raffles.map((raffle) => (
                <tr key={raffle.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{raffle.title}</p>
                    <p className="text-xs text-slate-500">Data: {typeof raffle.drawDate === 'string' ? raffle.drawDate : 'Data Pendente'}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-md text-[10px] font-bold text-slate-400">
                      {raffle.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      raffle.status === "OPEN" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {raffle.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link 
                      href={`/admin/raffles/${raffle.id}/check`}
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-blue-600 p-2 px-4 rounded-lg text-xs font-bold transition-all"
                    >
                      <Eye size={14} /> Conferir
                    </Link>
                  </td>
                </tr>
              ))}

              {raffles.length === 0 && !loadingRaffles && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-600 italic">
                    Nenhuma rifa cadastrada no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}