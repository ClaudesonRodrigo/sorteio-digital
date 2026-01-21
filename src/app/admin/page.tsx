"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Ticket, 
  TrendingUp, 
  Search, 
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  selectedNumbers: string[];
  totalValue: number;
  raffleTitle: string;
  raffleId: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  createdAt: any;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === "PAGO");
    const pendingOrders = orders.filter(o => o.status === "PENDENTE");
    return {
      totalOrders: orders.length,
      pendingCount: pendingOrders.length,
      revenue: paidOrders.reduce((acc, curr) => acc + curr.totalValue, 0),
      soldTicketsCount: paidOrders.reduce((acc, curr) => acc + curr.selectedNumbers.length, 0)
    };
  }, [orders]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedOrders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedOrders(newSet);
  };

  const handleApproveOrder = async (order: Order) => {
    const toastId = toast.loading(`Aprovando pagamento...`);
    try {
      await updateDoc(doc(db, "pedidos", order.id), { status: "PAGO" });
      const movePromises = order.selectedNumbers.map(async (num) => {
        await deleteDoc(doc(db, "rifas", order.raffleId, "pending_numbers", num));
        await setDoc(doc(db, "rifas", order.raffleId, "sold_numbers", num), {
          buyerName: order.customerName,
          buyerPhone: order.customerPhone,
          orderId: order.id,
          soldAt: serverTimestamp()
        });
      });
      await Promise.all(movePromises);
      toast.success("Pagamento confirmado!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao aprovar.", { id: toastId });
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm("Cancelar reserva?")) return;
    const toastId = toast.loading("Cancelando...");
    try {
      await updateDoc(doc(db, "pedidos", order.id), { status: "CANCELADO" });
      const clearPromises = order.selectedNumbers.map(num => 
        deleteDoc(doc(db, "rifas", order.raffleId, "pending_numbers", num))
      );
      await Promise.all(clearPromises);
      toast.success("Reserva cancelada!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao cancelar.", { id: toastId });
    }
  };

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(filter.toLowerCase()) || 
    o.customerPhone.includes(filter)
  );

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Dashboard Admin</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Controle de Vendas</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou zap..." 
              className="bg-[#121826] border border-slate-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-blue-500 transition-all w-full md:w-80 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Pedidos" value={stats.totalOrders} icon={<ShoppingBag size={24} />} color="blue" />
          <StatCard title="Faturamento" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
          <StatCard title="Cotas Vendidas" value={stats.soldTicketsCount} icon={<Ticket size={24} />} color="purple" />
          <StatCard title="Aguardando Pix" value={stats.pendingCount} icon={<Clock size={24} />} color="orange" />
        </div>

        <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-slate-900/30">
            <h2 className="text-lg font-black uppercase italic tracking-tight">Histórico de Reservas</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Rifa e Cotas</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const numbersToShow = isExpanded ? order.selectedNumbers : order.selectedNumbers.slice(0, 10);
                  const hasMore = order.selectedNumbers.length > 10;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/20 transition-all group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-white text-base leading-none mb-1">{order.customerName}</p>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">{order.customerPhone}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{order.raffleTitle}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-700" />
                          <span className="text-xs font-black text-blue-500">{order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {numbersToShow.map(n => (
                            <span key={n} className="bg-slate-900 border border-slate-700 text-[10px] font-black px-2 py-0.5 rounded-lg text-blue-400">{n}</span>
                          ))}
                          {hasMore && (
                            <button 
                              onClick={() => toggleExpand(order.id)}
                              className="text-[10px] font-black uppercase text-blue-500 hover:text-white transition-colors ml-1"
                            >
                              {isExpanded ? "[ Ver Menos ]" : `+ ${order.selectedNumbers.length - 10} números...`}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                          {order.status === "PENDENTE" ? (
                            <>
                              <button onClick={() => handleCancelOrder(order)} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all"><XCircle size={20} /></button>
                              <button onClick={() => handleApproveOrder(order)} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl transition-all"><CheckCircle2 size={18} /> Confirmar</button>
                            </>
                          ) : (
                            <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl", order.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                              {order.status === "PAGO" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {order.status}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'green' | 'purple' | 'orange' }) {
  const colors = { blue: "text-blue-500 bg-blue-500/10", green: "text-green-500 bg-green-500/10", purple: "text-purple-500 bg-purple-500/10", orange: "text-orange-500 bg-orange-500/10" };
  return (
    <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", colors[color])}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => <svg className={cn("animate-spin", className)} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;