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
  Plus,
  Edit,
  Trophy, 
  Loader2,
  Eye,
  Share2,
  Printer,
  X,
  Download,
  Users
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Interfaces
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

interface Raffle {
  id: string;
  title: string;
  status: string;
  ticketPrice: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [printRaffle, setPrintRaffle] = useState<Raffle | null>(null);

  useEffect(() => {
    const qOrders = query(collection(db, "pedidos"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const qRaffles = query(collection(db, "rifas"), orderBy("createdAt", "desc"));
    const unsubRaffles = onSnapshot(qRaffles, (snap) => {
      setRaffles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Raffle)));
      setLoading(false);
    });

    return () => { unsubOrders(); unsubRaffles(); };
  }, []);

  // SUPERPODER 1: Ranking de Baleias (Top Compradores)
  const topBuyers = useMemo(() => {
    const buyersMap = new Map();
    orders.filter(o => o.status === "PAGO").forEach(order => {
      const current = buyersMap.get(order.customerPhone) || { name: order.customerName, total: 0, tickets: 0 };
      buyersMap.set(order.customerPhone, {
        name: order.customerName,
        total: current.total + (order.totalValue || 0),
        tickets: current.tickets + order.selectedNumbers.length
      });
    });
    return Array.from(buyersMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === "PAGO");
    return {
      totalOrders: orders.length,
      pendingCount: orders.filter(o => o.status === "PENDENTE").length,
      revenue: paidOrders.reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
      soldTicketsCount: paidOrders.reduce((acc, curr) => acc + curr.selectedNumbers.length, 0)
    };
  }, [orders]);

  // SUPERPODER 2: Exportação CSV (Modo Live)
  const exportToCSV = () => {
    const paidOrders = orders.filter(o => o.status === "PAGO");
    if (paidOrders.length === 0) return toast.error("Nenhum pedido pago para exportar.");

    const headers = ["Cliente", "Telefone", "Sorteio", "Cotas", "Valor"];
    const rows = paidOrders.map(o => [
      o.customerName,
      o.customerPhone,
      o.raffleTitle,
      o.selectedNumbers.join("-"),
      o.totalValue
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `sorteio_digital_live_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Lista de sorteio exportada!");
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
      toast.error("Erro ao aprovar.");
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm("Cancelar reserva?")) return;
    try {
      await updateDoc(doc(db, "pedidos", order.id), { status: "CANCELADO" });
      const clearPromises = order.selectedNumbers.map(num => 
        deleteDoc(doc(db, "rifas", order.raffleId, "pending_numbers", num))
      );
      await Promise.all(clearPromises);
      toast.success("Reserva liberada!");
    } catch (error) {
      toast.error("Erro ao cancelar.");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(filter.toLowerCase()) || o.customerPhone.includes(filter);
    const matchesStatus = statusFilter === "TODOS" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-blue-500 leading-none">Painel de <span className="text-white">Elite</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 italic">Gerenciamento Estratégico - Aracaju</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportToCSV}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all active:scale-95"
            >
              <Download size={16} /> Exportar Live
            </button>
            <button 
              onClick={() => router.push('/admin/raffles/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              <Plus size={18} /> Nova Rifa
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Pedidos" value={stats.totalOrders} icon={<ShoppingBag size={24} />} color="blue" />
            <StatCard title="Faturamento" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
            <StatCard title="Cotas Vendidas" value={stats.soldTicketsCount} icon={<Ticket size={24} />} color="purple" />
            <StatCard title="Aguardando Pix" value={stats.pendingCount} icon={<Clock size={24} />} color="orange" />
          </div>

          {/* SIDEBAR: Ranking de Baleias */}
          <div className="bg-[#121826] border border-blue-500/20 p-6 rounded-[2.5rem] shadow-2xl shadow-blue-900/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 flex items-center gap-2">
              <Users size={14} /> Top Compradores
            </h3>
            <div className="space-y-4">
              {topBuyers.map((buyer, i) => (
                <div key={buyer.name} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0">
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic text-white line-clamp-1">{i+1}. {buyer.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{buyer.tickets} cotas</p>
                  </div>
                  <p className="text-xs font-black text-green-500 italic">{buyer.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LISTAGEM DE RIFAS (Mantida conforme sua versão estável) */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-3">
            <Ticket className="text-blue-500" size={24} /> Meus Sorteios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <div key={raffle.id} className={cn(
                "bg-[#121826] border p-8 rounded-[2.5rem] transition-all relative group",
                raffle.status === "FINISHED" ? "border-green-500/20 opacity-90" : "border-slate-800 hover:border-slate-700 shadow-xl"
              )}>
                <div className="absolute top-6 right-6 flex gap-2">
                  {raffle.status !== "FINISHED" ? (
                    <button 
                      onClick={() => router.push(`/admin/raffles/${raffle.id}/edit`)} 
                      className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-lg border border-slate-800"
                    >
                      <Edit size={16} />
                    </button>
                  ) : (
                    <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                      <CheckCircle2 size={10} /> Finalizada
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black uppercase italic mb-1 pr-12 tracking-tight line-clamp-1">{raffle.title}</h3>
                
                <div className="grid grid-cols-3 gap-2 my-6">
                  <button onClick={() => router.push(`/raffle/${raffle.id}`)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"><Eye size={18} /><span className="text-[8px] font-black uppercase">Ver</span></button>
                  <button onClick={() => {
                    const url = `${window.location.origin}/raffle/${raffle.id}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(`🏆 *${raffle.title}*\n🔗 Garanta aqui: ${url}`)}`, '_blank');
                  }} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-green-500 transition-all"><Share2 size={18} /><span className="text-[8px] font-black uppercase">Zap</span></button>
                  <button onClick={() => setPrintRaffle(raffle)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-orange-500 transition-all"><Printer size={18} /><span className="text-[8px] font-black uppercase">QR</span></button>
                </div>

                <button 
                  onClick={() => router.push(`/admin/raffles/${raffle.id}/check`)}
                  className={cn(
                    "w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg",
                    raffle.status === "FINISHED" ? "bg-green-600 text-white shadow-green-900/20" : "bg-blue-600 text-white shadow-blue-900/20"
                  )}
                >
                  <Trophy size={14} /> {raffle.status === "FINISHED" ? "Ver Ganhador" : "Verificar Sorteio"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SUPERPODER 3: Filtros de Status Rápido */}
        <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-slate-900/30 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-lg font-black uppercase italic flex items-center gap-3 tracking-tight">
                <Clock className="text-orange-500" size={20} /> Controle de Vendas
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar cliente ou zap..." 
                  className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-blue-500 transition-all w-full md:w-64 font-bold"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["TODOS", "PENDENTE", "PAGO", "CANCELADO"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                    statusFilter === status 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Sorteio / Cotas</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition-all text-sm group">
                    <td className="px-8 py-6">
                      <p className="font-black uppercase italic tracking-tighter group-hover:text-blue-500 transition-colors">{order.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{order.customerPhone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{order.raffleTitle}</p>
                      <div className="flex flex-wrap gap-1">
                        {order.selectedNumbers.slice(0, 10).map(n => <span key={n} className="bg-slate-900 border border-slate-800 text-[10px] font-black px-2 py-0.5 rounded text-blue-500">{n}</span>)}
                        {order.selectedNumbers.length > 10 && <span className="text-[9px] font-black text-slate-600">+{order.selectedNumbers.length - 10}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {order.status === "PENDENTE" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleCancelOrder(order)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={16} /></button>
                          <button onClick={() => handleApproveOrder(order)} className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all">Aprovar</button>
                        </div>
                      ) : (
                        <span className={cn(
                          "text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest",
                          order.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>{order.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {printRaffle && (
          <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white text-black p-10 rounded-[3rem] w-full max-w-sm text-center relative shadow-2xl">
              <button onClick={() => setPrintRaffle(null)} className="absolute -top-12 right-0 text-white flex items-center gap-2 uppercase font-black text-[10px]"><X size={20}/> Fechar</button>
              <h2 className="text-2xl font-black uppercase italic mb-8">Sorteio Digital</h2>
              <div className="bg-white p-4 rounded-3xl border-4 border-black inline-block mb-8">
                <QRCodeSVG value={`${window.location.origin}/raffle/${printRaffle.id}`} size={220} level="H" />
              </div>
              <p className="font-black text-sm uppercase mb-6 italic tracking-tighter">{printRaffle.title}</p>
              <button onClick={() => window.print()} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"><Printer size={18} /> Imprimir QR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = { 
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/10", 
    green: "text-green-500 bg-green-500/10 border-green-500/10", 
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/10", 
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/10" 
  };
  return (
    <div className={cn("bg-[#121826] border p-8 rounded-[2.5rem] shadow-xl transition-all hover:scale-[1.02]", colors[color])}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner")}>{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">{title}</p>
      <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  );
}