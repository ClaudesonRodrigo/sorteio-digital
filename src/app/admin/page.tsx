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
  orderBy,
  writeBatch 
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
  Users,
  UserPlus,
  Link as LinkIcon,
  Trash2,
  Download,
  Percent,
  Wallet,
  AlertCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Interfaces de Elite
interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  selectedNumbers: string[];
  totalValue: number;
  raffleTitle: string;
  raffleId: string;
  cambistaId?: string | null;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  createdAt: any;
}

interface Raffle {
  id: string;
  title: string;
  status: "ACTIVE" | "FINISHED";
  ticketPrice: number;
  totalTickets: number;
  winner?: {
    number: string;
    name: string;
    phone: string;
  };
}

interface Partner {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  commission: number;
  active: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ORDERS" | "PARTNERS">("ORDERS");
  const [orders, setOrders] = useState<Order[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [printRaffle, setPrintRaffle] = useState<Raffle | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  
  const [newPartner, setNewPartner] = useState({ 
    name: "", 
    cpf: "", 
    phone: "", 
    id: "", 
    commission: 10 
  });
  
  const [selectedRaffleForLink, setSelectedRaffleForLink] = useState("");

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, "pedidos"), orderBy("createdAt", "desc")), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const unsubRaffles = onSnapshot(query(collection(db, "rifas"), orderBy("createdAt", "desc")), (snap) => {
      const rafflesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Raffle));
      setRaffles(rafflesData);
      if (rafflesData.length > 0 && !selectedRaffleForLink) {
        setSelectedRaffleForLink(rafflesData[0].id);
      }
    });

    const unsubPartners = onSnapshot(collection(db, "parceiros"), (snap) => {
      setPartners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner)));
      setLoading(false);
    });

    return () => { unsubOrders(); unsubRaffles(); unsubPartners(); };
  }, [selectedRaffleForLink]);

  // Ranking de Baleias
  const topBuyers = useMemo(() => {
    const buyersMap = new Map();
    orders.filter(o => o.status === "PAGO").forEach(order => {
      const phone = order.customerPhone || "sem-fone";
      const current = buyersMap.get(phone) || { name: order.customerName, total: 0 };
      buyersMap.set(phone, {
        name: order.customerName,
        total: current.total + (order.totalValue || 0)
      });
    });
    return Array.from(buyersMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  // Estatísticas Gerais
  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === "PAGO");
    return {
      revenue: paidOrders.reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
      soldTickets: paidOrders.reduce((acc, curr) => acc + curr.selectedNumbers.length, 0),
      pending: orders.filter(o => o.status === "PENDENTE").length
    };
  }, [orders]);

  // Contabilidade de Cambistas
  const partnerStats = useMemo(() => {
    return partners.map(p => {
      const sales = orders.filter(o => o.cambistaId === p.id && o.status === "PAGO");
      const totalRevenue = sales.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
      const totalTickets = sales.reduce((acc, curr) => acc + curr.selectedNumbers.length, 0);
      const commissionEarned = (totalRevenue * (p.commission || 0)) / 100;

      return { ...p, totalRevenue, totalTickets, commissionEarned };
    });
  }, [partners, orders]);

  const handleApproveOrder = async (order: Order) => {
    if (order.status !== "PENDENTE") return toast.error("Pedido já processado.");
    const toastId = toast.loading("Aprovando venda...");
    const batch = writeBatch(db);
    try {
      batch.update(doc(db, "pedidos", order.id), { status: "PAGO" });
      order.selectedNumbers.forEach((num) => {
        batch.delete(doc(db, "rifas", order.raffleId, "pending_numbers", num));
        batch.set(doc(db, "rifas", order.raffleId, "sold_numbers", num), {
          buyerName: order.customerName, buyerPhone: order.customerPhone, orderId: order.id, soldAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast.success("Venda aprovada!", { id: toastId });
    } catch (e) { toast.error("Erro ao aprovar.", { id: toastId }); }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`Cancelar reserva de ${order.customerName}?`)) return;
    const batch = writeBatch(db);
    try {
      batch.update(doc(db, "pedidos", order.id), { status: "CANCELADO" });
      order.selectedNumbers.forEach(num => batch.delete(doc(db, "rifas", order.raffleId, "pending_numbers", num)));
      await batch.commit();
      toast.success("Números liberados!");
    } catch (e) { toast.error("Erro ao cancelar."); }
  };

  const exportCSV = () => {
    const paid = orders.filter(o => o.status === "PAGO");
    const headers = "Cliente,Telefone,Sorteio,Cotas,Valor\n";
    const rows = paid.map(o => `${o.customerName},${o.customerPhone},${o.raffleTitle},${o.selectedNumbers.join("-")},${o.totalValue}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_sorteio_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "parceiros", newPartner.id.toLowerCase()), { 
        ...newPartner, 
        id: newPartner.id.toLowerCase().trim(), 
        commission: Number(newPartner.commission),
        active: true, 
        createdAt: serverTimestamp()
      });
      setShowPartnerModal(false);
      setNewPartner({ name: "", cpf: "", phone: "", id: "", commission: 10 });
      toast.success("Cambista cadastrado com sucesso!");
    } catch (e) { toast.error("Erro ao cadastrar."); }
  };

  const filteredOrders = orders.filter(o => {
    const matchF = (o.customerName || "").toLowerCase().includes(filter.toLowerCase()) || (o.customerPhone || "").includes(filter);
    const matchS = statusFilter === "TODOS" || o.status === statusFilter;
    return matchF && matchS;
  });

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-4 md:p-10 pb-20">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter">Painel <span className="text-blue-500">Master</span></h1>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setActiveTab("ORDERS")} className={cn("px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", activeTab === "ORDERS" ? "bg-blue-600 border-blue-500 text-white shadow-xl" : "bg-slate-900 border-slate-800 text-slate-500")}>Vendas & Sorteios</button>
              <button onClick={() => setActiveTab("PARTNERS")} className={cn("px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", activeTab === "PARTNERS" ? "bg-blue-600 border-blue-500 text-white shadow-xl" : "bg-slate-900 border-slate-800 text-slate-500")}>Gestão de Cambistas</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="bg-slate-800 hover:bg-slate-700 px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 border border-slate-700 transition-all"><Download size={16} /> Exportar</button>
            <button onClick={() => router.push('/admin/raffles/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={18} /> Nova Rifa</button>
          </div>
        </header>

        {activeTab === "ORDERS" ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Faturamento Bruto" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
                <StatCard title="Cotas Vendidas" value={stats.soldTickets} icon={<Ticket size={24} />} color="blue" />
                <StatCard title="Aguardando Pix" value={stats.pending} icon={<Clock size={24} />} color="orange" />
              </div>
              <div className="bg-[#121826] border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h3 className="text-[10px] font-black uppercase text-blue-500 mb-6 flex items-center gap-2 italic tracking-widest"><Users size={16} /> Top Compradores</h3>
                <div className="space-y-4">
                  {topBuyers.map((b, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 italic">
                      <p className="text-xs font-black uppercase line-clamp-1 text-white">{i+1}. {b.name}</p>
                      <p className="text-xs font-black text-green-500">{b.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3 tracking-tight"><Ticket className="text-blue-500" size={32} /> Gerenciar Sorteios</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {raffles.map((raffle) => {
                  const isFinished = raffle.status === "FINISHED";
                  return (
                    <div key={raffle.id} className={cn(
                      "bg-[#121826] border p-10 rounded-[3rem] relative group transition-all shadow-xl",
                      isFinished ? "border-green-500/30 bg-green-500/[0.02]" : "border-slate-800 hover:border-slate-700"
                    )}>
                      <div className="absolute top-8 right-8">
                        {isFinished ? (
                          <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                            <CheckCircle2 size={12} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Concluído</span>
                          </div>
                        ) : (
                          <button onClick={() => router.push(`/admin/raffles/${raffle.id}/edit`)} className="p-3 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-xl border border-slate-800"><Edit size={18} /></button>
                        )}
                      </div>

                      <h3 className="text-2xl font-black uppercase italic mb-8 pr-12 line-clamp-1">{raffle.title}</h3>
                      
                      {isFinished && raffle.winner ? (
                        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 mb-8">
                          <p className="text-[8px] font-black uppercase text-green-500/60 mb-2 tracking-[0.2em]">Resultado Final</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black uppercase text-white">{raffle.winner.name}</p>
                              <p className="text-[9px] font-bold text-slate-500">{raffle.winner.phone}</p>
                            </div>
                            <div className="bg-green-500 text-black px-3 py-1 rounded-lg font-black italic text-sm">#{raffle.winner.number}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 mb-8">
                          <button onClick={() => router.push(`/raffle/${raffle.id}`)} className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-slate-400 hover:text-blue-500 transition-all shadow-md"><Eye size={20} /><span className="text-[9px] font-black uppercase">Ver</span></button>
                          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🏆 *${raffle.title}*\n🔗 ${window.location.origin}/raffle/${raffle.id}`)}`)} className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-slate-400 hover:text-green-500 transition-all shadow-md"><Share2 size={20} /><span className="text-[9px] font-black uppercase">Link</span></button>
                          <button onClick={() => setPrintRaffle(raffle)} className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-slate-400 hover:text-orange-500 transition-all shadow-md"><Printer size={20} /><span className="text-[9px] font-black uppercase">QR</span></button>
                        </div>
                      )}

                      <button 
                        onClick={() => router.push(`/admin/raffles/${raffle.id}/check`)} 
                        className={cn(
                          "w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95",
                          isFinished ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" : "bg-blue-600 hover:bg-blue-700"
                        )}
                        disabled={isFinished}
                      >
                        <Trophy size={16} /> {isFinished ? "Finalizado" : "Realizar Sorteio"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121826] border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-slate-800 bg-slate-900/30 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-xl font-black uppercase italic flex items-center gap-4"><ShoppingBag size={24} className="text-blue-500" /> Fluxo de Vendas</h2>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Buscar..." className="bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-blue-500 w-full md:w-80" value={filter || ""} onChange={(e) => setFilter(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {["TODOS", "PENDENTE", "PAGO", "CANCELADO"].map(st => (
                    <button key={st} onClick={() => setStatusFilter(st)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all", statusFilter === st ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-slate-900 border-slate-800 text-slate-500")}>{st}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto pr-2 custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 italic"><th className="px-10 py-6">Cliente</th><th className="px-10 py-6">Sorteio / Cotas</th><th className="px-10 py-6">Origem</th><th className="px-10 py-6 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/20 transition-all text-sm group">
                        <td className="px-10 py-8">
                          <p className="font-black italic uppercase group-hover:text-blue-500 transition-colors text-lg tracking-tighter">{order.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{order.customerPhone}</p>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-[11px] font-black text-slate-500 uppercase mb-3 italic tracking-widest">{order.raffleTitle}</p>
                          <div className="flex flex-wrap gap-2">
                            {order.selectedNumbers.slice(0, 5).map(n => <span key={n} className="bg-slate-900 border border-slate-800 text-[11px] font-black px-3 py-1 rounded-xl text-blue-500">{n}</span>)}
                            {order.selectedNumbers.length > 5 && <span className="text-[10px] font-bold text-slate-600">+{order.selectedNumbers.length - 5}</span>}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          {order.cambistaId ? <span className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic border border-blue-500/10">{order.cambistaId}</span> : <span className="text-slate-800 text-[10px] font-bold uppercase tracking-[0.2em]">Direta</span>}
                        </td>
                        <td className="px-10 py-8 text-right">
                          {order.status === "PENDENTE" ? (
                            <div className="flex justify-end gap-3">
                              <button onClick={() => handleCancelOrder(order)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-md"><XCircle size={20} /></button>
                              <button onClick={() => handleApproveOrder(order)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Aprovar</button>
                            </div>
                          ) : <span className={cn("text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-widest border", order.status === "PAGO" ? "bg-green-500/10 text-green-500 border-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "bg-red-500/10 text-red-500 border-red-500/10")}>{order.status}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <h2 className="text-3xl font-black uppercase italic flex items-center gap-4 tracking-tighter"><Users size={32} className="text-blue-500" /> Rede de Parceiros</h2>
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                <div className="flex flex-col w-full sm:w-auto">
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 italic tracking-widest">Gerar Link para:</span>
                  <select className="bg-slate-900 border border-slate-700 rounded-2xl px-6 py-3.5 text-sm font-bold text-white outline-none focus:border-blue-500 shadow-inner" value={selectedRaffleForLink || ""} onChange={(e) => setSelectedRaffleForLink(e.target.value)}>
                    {raffles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
                <button onClick={() => setShowPartnerModal(true)} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all border border-slate-700 active:scale-95 shadow-xl mt-auto"><UserPlus size={18} /> Novo Cambista</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partnerStats.map((p) => (
                <div key={p.id} className="bg-[#121826] border border-slate-800 p-10 rounded-[3rem] relative group hover:border-blue-500 transition-all shadow-2xl">
                  <div className="absolute top-8 right-8 flex gap-3">
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/raffle/${selectedRaffleForLink || raffles[0]?.id}?ref=${p.id}`); toast.success("Link copiado!"); }} className="p-3 bg-slate-900 rounded-xl text-blue-500 border border-slate-800 hover:bg-blue-600 hover:text-white transition-all shadow-md"><LinkIcon size={18} /></button>
                    <button onClick={async () => { if(confirm(`Remover parceiro ${p.name}?`)) await deleteDoc(doc(db, "parceiros", p.id)); }} className="p-3 bg-slate-900 rounded-xl text-red-500 border border-slate-800 hover:bg-red-600 hover:text-white transition-all shadow-md"><Trash2 size={18} /></button>
                  </div>
                  <p className="text-[11px] text-blue-500 font-black uppercase mb-2 italic tracking-[0.2em]">Cód: {p.id}</p>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter line-clamp-1 mb-8">{p.name}</h3>
                  <div className="flex items-center gap-2 bg-slate-900 w-fit px-4 py-2 rounded-xl border border-slate-800 mb-8">
                       <Percent size={14} className="text-blue-500" />
                       <span className="text-[11px] font-black uppercase text-slate-400 italic">Comissão: {p.commission}%</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pt-8 border-t border-slate-800/50">
                    <div className="flex justify-between items-center bg-slate-900/50 p-5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <ShoppingBag size={20} className="text-slate-500" />
                            <span className="text-[11px] font-black uppercase text-slate-500">Total Vendido</span>
                        </div>
                        <p className="text-xl font-black italic">{p.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="flex justify-between items-center bg-blue-600/5 p-5 rounded-2xl border border-blue-500/10">
                        <div className="flex items-center gap-3">
                            <Wallet size={20} className="text-blue-500" />
                            <span className="text-[11px] font-black uppercase text-blue-500">Comissão Devida</span>
                        </div>
                        <p className="text-2xl font-black text-green-500 italic">
                            {p.commissionEarned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAIS (CADASTRAR PARCEIRO E IMPRIMIR QR) */}
        {showPartnerModal && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-slate-800 p-12 rounded-[3.5rem] w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setShowPartnerModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
              <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter italic leading-none">Novo <span className="text-blue-500">Cambista</span></h2>
              <form onSubmit={handleAddPartner} className="space-y-5">
                <input required placeholder="Nome Completo" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-500" value={newPartner.name || ""} onChange={e => setNewPartner({...newPartner, name: e.target.value})} />
                <input required placeholder="Cód (ex: midinho)" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-500" value={newPartner.id || ""} onChange={e => setNewPartner({...newPartner, id: e.target.value.replace(/\s/g, '').toLowerCase()})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">WhatsApp</label>
                    <input required placeholder="799..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-500" value={newPartner.phone || ""} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Comissão %</label>
                    <input required type="number" placeholder="10" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-500" value={newPartner.commission} onChange={e => setNewPartner({...newPartner, commission: Number(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-6">Gravar Cambista</button>
              </form>
            </div>
          </div>
        )}

        {printRaffle && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white text-black p-12 rounded-[4rem] w-full max-w-sm text-center relative shadow-2xl">
              <button onClick={() => setPrintRaffle(null)} className="absolute -top-16 right-0 text-white flex items-center gap-3 uppercase font-black text-[11px] tracking-[0.3em] hover:text-blue-500 transition-colors"><X size={24}/> Fechar</button>
              <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter leading-none italic">Sorteio <span className="text-blue-600">Digital</span></h2>
              <div className="bg-white p-6 rounded-[3rem] border-[8px] border-slate-100 inline-block mb-10 shadow-inner">
                <QRCodeSVG value={`${window.location.origin}/raffle/${printRaffle.id}`} size={220} level="H" />
              </div>
              <p className="font-black text-lg uppercase mb-10 italic tracking-tight leading-tight px-6">{printRaffle.title}</p>
              <button onClick={() => window.print()} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-2xl active:scale-95"><Printer size={20} /> Imprimir QR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = { green: "text-green-500 bg-green-500/5 border-green-500/10 shadow-green-900/10", blue: "text-blue-500 bg-blue-500/5 border-blue-500/10 shadow-blue-900/10", orange: "text-orange-500 bg-orange-500/5 border-orange-500/10 shadow-orange-900/10" };
  return (
    <div className={cn("bg-[#121826] border p-10 rounded-[3rem] shadow-2xl transition-all hover:scale-[1.05] hover:border-slate-700", colors[color])}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner bg-black/30 border border-white/5">{icon}</div>
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">{title}</p>
      <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{value}</p>
    </div>
  );
}