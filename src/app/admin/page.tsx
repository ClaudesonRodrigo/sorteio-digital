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
  Search, 
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Loader2
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
    return {
      totalOrders: orders.length,
      pendingCount: orders.filter(o => o.status === "PENDENTE").length,
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
    const toastId = toast.loading(`Aprovando pedido...`);
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
    if (!confirm("Cancelar reserva? Os números serão libertados.")) return;
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
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Painel Admin</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="bg-[#121826] border border-slate-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-blue-500 w-full md:w-80"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pedidos" value={stats.totalOrders} icon={<ShoppingBag size={24} />} color="blue" />
          <StatCard title="Faturamento" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
          <StatCard title="Vendidos" value={stats.soldTicketsCount} icon={<Ticket size={24} />} color="purple" />
          <StatCard title="Pendentes" value={stats.pendingCount} icon={<Clock size={24} />} color="orange" />
        </div>

        <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Números</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);
                const numbers = isExpanded ? order.selectedNumbers : order.selectedNumbers.slice(0, 10);
                return (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-8 py-6">
                      <p className="font-bold">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {numbers.map(n => (
                          <span key={n} className="bg-slate-900 border border-slate-700 text-[10px] font-black px-2 py-0.5 rounded text-blue-400">{n}</span>
                        ))}
                        {order.selectedNumbers.length > 10 && (
                          <button onClick={() => toggleExpand(order.id)} className="text-[10px] font-black text-blue-500 uppercase">
                            {isExpanded ? "[ Ver menos ]" : `+ ${order.selectedNumbers.length - 10} números`}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {order.status === "PENDENTE" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleCancelOrder(order)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><XCircle size={18} /></button>
                          <button onClick={() => handleApproveOrder(order)} className="bg-blue-600 px-4 py-2 rounded-lg text-xs font-black uppercase">Aprovar</button>
                        </div>
                      ) : (
                        <span className={cn("text-[10px] font-black uppercase", order.status === "PAGO" ? "text-green-500" : "text-red-500")}>{order.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = { blue: "bg-blue-500/10 text-blue-500", green: "bg-green-500/10 text-green-500", purple: "bg-purple-500/10 text-purple-500", orange: "bg-orange-500/10 text-orange-500" };
  return (
    <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem]">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", colors[color])}>{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{title}</p>
      <p className="text-3xl font-black italic">{value}</p>
    </div>
  );
}