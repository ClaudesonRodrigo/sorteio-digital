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
  Trash2,
  Trophy, 
  Loader2,
  Eye,
  Share2,
  Printer,
  X
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

  const handleShare = (raffleId: string, title: string) => {
    const url = `${window.location.origin}/raffle/${raffleId}`;
    const text = `🚀 *SORTEIO NO AR!* \n\n🏆 ${title}\n\nGaranta sua cota aqui: \n🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(filter.toLowerCase()) || 
    o.customerPhone.includes(filter)
  );

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-blue-500">Dashboard Admin</h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic">Sorteio Digital - Aracaju</p>
          </div>
          <button 
            onClick={() => router.push('/admin/raffles/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} /> Nova Rifa
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Pedidos" value={stats.totalOrders} icon={<ShoppingBag size={24} />} color="blue" />
          <StatCard title="Faturamento" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
          <StatCard title="Cotas Vendidas" value={stats.soldTicketsCount} icon={<Ticket size={24} />} color="purple" />
          <StatCard title="Aguardando Pix" value={stats.pendingCount} icon={<Clock size={24} />} color="orange" />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-3">
            <Ticket className="text-blue-500" size={24} /> Gerenciar Sorteios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <div key={raffle.id} className={cn(
                "bg-[#121826] border p-8 rounded-[2.5rem] hover:border-slate-700 transition-all relative group",
                raffle.status === "FINISHED" ? "border-green-500/20 opacity-90" : "border-slate-800"
              )}>
                <div className="absolute top-6 right-6 flex gap-2">
                  {/* TRAVA DE SEGURANÇA: Não permite editar se estiver finalizada */}
                  {raffle.status !== "FINISHED" ? (
                    <button 
                      onClick={() => router.push(`/admin/raffles/${raffle.id}/edit`)} 
                      className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-lg border border-slate-800"
                    >
                      <Edit size={16} />
                    </button>
                  ) : (
                    <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-green-900/20">
                      <CheckCircle2 size={10} /> Finalizada
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black uppercase italic mb-1 pr-12 tracking-tight line-clamp-1">{raffle.title}</h3>
                
                <div className="grid grid-cols-3 gap-2 my-6">
                  <button onClick={() => router.push(`/raffle/${raffle.id}`)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"><Eye size={18} /><span className="text-[8px] font-black uppercase">Ver</span></button>
                  <button onClick={() => handleShare(raffle.id, raffle.title)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-green-500 transition-all"><Share2 size={18} /><span className="text-[8px] font-black uppercase">Zap</span></button>
                  <button onClick={() => setPrintRaffle(raffle)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-orange-500 transition-all"><Printer size={18} /><span className="text-[8px] font-black uppercase">Print</span></button>
                </div>

                <button 
                  onClick={() => router.push(`/admin/raffles/${raffle.id}/check`)}
                  className={cn(
                    "w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg",
                    raffle.status === "FINISHED" ? "bg-green-600 text-white" : "bg-blue-600/10 border border-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white"
                  )}
                >
                  <Trophy size={14} /> {raffle.status === "FINISHED" ? "Ver Ganhador" : "Verificar Sorteio"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-3 tracking-tight">
              <Clock className="text-orange-500" size={20} /> Aprovação de Pagamentos
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-blue-500 transition-all w-64"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Sorteio / Números</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const numbers = isExpanded ? order.selectedNumbers : order.selectedNumbers.slice(0, 10);
                  const hasMore = order.selectedNumbers.length > 10;
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/20 transition-all text-sm">
                      <td className="px-8 py-6">
                        <p className="font-bold">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.customerPhone}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{order.raffleTitle}</p>
                        <div className="flex flex-wrap gap-1">
                          {numbers.map(n => <span key={n} className="bg-slate-900 border border-slate-700 text-[10px] font-black px-2 py-0.5 rounded text-blue-400">{n}</span>)}
                          {hasMore && <button onClick={() => toggleExpand(order.id)} className="text-[10px] font-black text-blue-500 ml-1">{isExpanded ? "[-]" : `+${order.selectedNumbers.length - 10}`}</button>}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {order.status === "PENDENTE" ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleCancelOrder(order)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle size={18} /></button>
                            <button onClick={() => handleApproveOrder(order)} className="bg-blue-600 px-4 py-2 rounded-lg text-xs font-black uppercase">Aprovar</button>
                          </div>
                        ) : (
                          <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase", order.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{order.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {printRaffle && (
          <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white text-black p-10 rounded-[3rem] w-full max-w-sm text-center relative">
              <button onClick={() => setPrintRaffle(null)} className="absolute -top-12 right-0 text-white flex items-center gap-2 uppercase font-black text-[10px]"><X size={20}/> Fechar</button>
              <h2 className="text-2xl font-black uppercase italic mb-8">Sorteio Federal</h2>
              <div className="bg-white p-4 rounded-3xl border-4 border-black inline-block mb-8">
                <QRCodeSVG value={`${window.location.origin}/raffle/${printRaffle.id}`} size={220} level="H" />
              </div>
              <p className="font-black text-sm uppercase mb-6">{printRaffle.title}</p>
              <button onClick={() => window.print()} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3"><Printer size={18} /> Imprimir QR Code</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = { blue: "text-blue-500 bg-blue-500/10", green: "text-green-500 bg-green-500/10", purple: "text-purple-500 bg-purple-500/10", orange: "text-orange-500 bg-orange-500/10" };
  return (
    <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", colors[color])}>{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  );
}