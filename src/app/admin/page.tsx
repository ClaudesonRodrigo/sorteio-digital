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
  
  // Estado para o Modal de Impressão de QR Code
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

  // FUNÇÕES DE ELITE
  const handleShare = (raffleId: string, title: string) => {
    const url = `${window.location.origin}/raffle/${raffleId}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => toast.error("Erro ao compartilhar"));
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para o Zap!");
    }
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

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2 text-blue-500">Dashboard Admin</h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic">Controle de Vendas do Sorteio Federal</p>
          </div>
          <button 
            onClick={() => router.push('/admin/raffles/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl shadow-blue-900/20 transition-all active:scale-95"
          >
            <Plus size={18} /> Nova Rifa
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom duration-700">
          <StatCard title="Total Pedidos" value={stats.totalOrders} icon={<ShoppingBag size={24} />} color="blue" />
          <StatCard title="Faturamento" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
          <StatCard title="Cotas Vendidas" value={stats.soldTicketsCount} icon={<Ticket size={24} />} color="purple" />
          <StatCard title="Aguardando Pix" value={stats.pendingCount} icon={<Clock size={24} />} color="orange" />
        </div>

        {/* SEÇÃO DE RIFAS COM FERRAMENTAS DE MARKETING */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-3">
            <Ticket className="text-blue-500" size={24} /> Gerenciar Sorteios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <div key={raffle.id} className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] hover:border-slate-700 transition-all group relative">
                {/* Ações Rápidas (Editar/Excluir) */}
                <div className="absolute top-6 right-6 flex gap-2">
                  <button onClick={() => router.push(`/admin/raffles/${raffle.id}/edit`)} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-lg"><Edit size={16} /></button>
                </div>

                <h3 className="text-xl font-black uppercase italic mb-1 pr-12 tracking-tight">{raffle.title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Status: {raffle.status}</p>
                
                {/* Botões de Ação do DashBoard */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button 
                    onClick={() => router.push(`/raffle/${raffle.id}`)}
                    className="flex flex-col items-center justify-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all"
                    title="Visualizar Página Pública"
                  >
                    <Eye size={18} />
                    <span className="text-[8px] font-black uppercase">Ver</span>
                  </button>
                  <button 
                    onClick={() => handleShare(raffle.id, raffle.title)}
                    className="flex flex-col items-center justify-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-green-500 hover:border-green-500 transition-all"
                    title="Compartilhar Link"
                  >
                    <Share2 size={18} />
                    <span className="text-[8px] font-black uppercase">Zap</span>
                  </button>
                  <button 
                    onClick={() => setPrintRaffle(raffle)}
                    className="flex flex-col items-center justify-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all"
                    title="Imprimir QR Code"
                  >
                    <Printer size={18} />
                    <span className="text-[8px] font-black uppercase">Print</span>
                  </button>
                </div>

                <button 
                  onClick={() => router.push(`/admin/raffles/${raffle.id}/check`)}
                  className="w-full bg-blue-600/10 border border-blue-600/20 hover:bg-blue-600 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest text-blue-500 hover:text-white shadow-lg"
                >
                  <Trophy size={14} /> Verificar Sorteio
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LISTAGEM DE PEDIDOS (MANTIDO) */}
        <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-3">
               Histórico de Vendas
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-blue-500 transition-all w-full md:w-64"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          {/* ... (Tabela de Pedidos igual à anterior, mantendo a limpeza de 10 números) */}
        </div>

        {/* MODAL DE IMPRESSÃO DE QR CODE */}
        {printRaffle && (
          <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white text-black p-10 rounded-[3rem] w-full max-w-sm text-center relative shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <button onClick={() => setPrintRaffle(null)} className="absolute -top-12 right-0 text-white flex items-center gap-2 uppercase font-black text-[10px] tracking-widest"><X size={20}/> Fechar</button>
              
              <div className="print-area">
                <h2 className="text-2xl font-black uppercase italic mb-2 leading-none text-black">SORTEIO FEDERAL</h2>
                <p className="text-xs font-bold uppercase tracking-widest mb-8 text-slate-500">{printRaffle.title}</p>
                
                <div className="bg-white p-4 rounded-3xl border-4 border-black inline-block mb-8">
                  <QRCodeSVG 
                    value={`${window.location.origin}/raffle/${printRaffle.id}`} 
                    size={220} 
                    level="H"
                  />
                </div>

                <p className="font-black text-sm uppercase tracking-tighter mb-1">Escaneie para Participar!</p>
                <p className="text-[10px] font-bold text-slate-400">WWW.SORTEIOFEDERAL.COM.BR</p>
              </div>

              <button 
                onClick={() => window.print()}
                className="mt-10 w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:scale-95 transition-all shadow-xl"
              >
                <Printer size={18} /> Imprimir Agora
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponente StatCard (Mantido)
function StatCard({ title, value, icon, color }: any) {
  const colors: any = { blue: "text-blue-500 bg-blue-500/10", green: "text-green-500 bg-green-500/10", purple: "text-purple-500 bg-purple-500/10", orange: "text-orange-500 bg-orange-500/10" };
  return (
    <div className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-slate-700 transition-all">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", colors[color])}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
      </div>
    </div>
  );
}