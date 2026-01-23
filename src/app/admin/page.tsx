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
  Users,
  UserPlus,
  Link as LinkIcon,
  Trash2,
  Download
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
  cambistaId?: string | null;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  createdAt: any;
}

interface Raffle {
  id: string;
  title: string;
  status: string;
  ticketPrice: number;
}

interface Partner {
  id: string;
  name: string;
  cpf: string;
  phone: string;
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
  const [newPartner, setNewPartner] = useState({ name: "", cpf: "", phone: "", id: "" });
  
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
    }, (error) => {
      console.error("Erro de permissão:", error);
    });

    return () => { unsubOrders(); unsubRaffles(); unsubPartners(); };
  }, [selectedRaffleForLink]);

  const topBuyers = useMemo(() => {
    const buyersMap = new Map();
    orders.filter(o => o.status === "PAGO").forEach(order => {
      const current = buyersMap.get(order.customerPhone) || { name: order.customerName, total: 0 };
      buyersMap.set(order.customerPhone, {
        name: order.customerName,
        total: current.total + (order.totalValue || 0)
      });
    });
    return Array.from(buyersMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === "PAGO");
    return {
      revenue: paidOrders.reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
      soldTickets: paidOrders.reduce((acc, curr) => acc + curr.selectedNumbers.length, 0),
      pending: orders.filter(o => o.status === "PENDENTE").length
    };
  }, [orders]);

  const partnerStats = useMemo(() => {
    return partners.map(p => {
      const sales = orders.filter(o => o.cambistaId === p.id && o.status === "PAGO");
      return {
        ...p,
        totalRevenue: sales.reduce((acc, curr) => acc + (curr.totalValue || 0), 0),
        totalTickets: sales.reduce((acc, curr) => acc + curr.selectedNumbers.length, 0)
      };
    });
  }, [partners, orders]);

  const handleApproveOrder = async (order: Order) => {
    const toastId = toast.loading("Aprovando cotas...");
    try {
      await updateDoc(doc(db, "pedidos", order.id), { status: "PAGO" });
      const approvePromises = order.selectedNumbers.flatMap(num => [
        deleteDoc(doc(db, "rifas", order.raffleId, "pending_numbers", num)),
        setDoc(doc(db, "rifas", order.raffleId, "sold_numbers", num), {
          buyerName: order.customerName,
          buyerPhone: order.customerPhone,
          soldAt: serverTimestamp()
        })
      ]);
      await Promise.all(approvePromises);
      toast.success("Pedido aprovado!", { id: toastId });
    } catch (e) { toast.error("Erro na aprovação.", { id: toastId }); }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm("Cancelar reserva?")) return;
    try {
      await updateDoc(doc(db, "pedidos", order.id), { status: "CANCELADO" });
      const cancelPromises = order.selectedNumbers.map(num => 
        deleteDoc(doc(db, "rifas", order.raffleId, "pending_numbers", num))
      );
      await Promise.all(cancelPromises);
      toast.success("Reserva cancelada!");
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
    a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "parceiros", newPartner.id.toLowerCase()), { 
        ...newPartner, 
        id: newPartner.id.toLowerCase().trim(),
        active: true,
        createdAt: serverTimestamp()
      });
      setShowPartnerModal(false);
      setNewPartner({ name: "", cpf: "", phone: "", id: "" });
      toast.success("Parceiro criado!");
    } catch (e) { toast.error("Erro ao criar."); }
  };

  const copyPartnerLink = (partnerId: string) => {
    const link = `${window.location.origin}/raffle/${selectedRaffleForLink}?ref=${partnerId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const filteredOrders = orders.filter(o => {
    const matchF = o.customerName.toLowerCase().includes(filter.toLowerCase()) || o.customerPhone.includes(filter);
    const matchS = statusFilter === "TODOS" || o.status === statusFilter;
    return matchF && matchS;
  });

  if (loading) return <div className="h-screen bg-[#0A0F1C] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Painel de <span className="text-blue-500">Elite</span></h1>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setActiveTab("ORDERS")} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "ORDERS" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-500")}>Vendas</button>
              <button onClick={() => setActiveTab("PARTNERS")} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "PARTNERS" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-500")}>Parceiros</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="bg-slate-800 hover:bg-slate-700 px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Download size={16} /> Exportar</button>
            <button onClick={() => router.push('/admin/raffles/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={18} /> Nova Rifa</button>
          </div>
        </header>

        {activeTab === "ORDERS" ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Faturamento" value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={24} />} color="green" />
                <StatCard title="Cotas Vendidas" value={stats.soldTickets} icon={<Ticket size={24} />} color="blue" />
                <StatCard title="Aguardando Pix" value={stats.pending} icon={<Clock size={24} />} color="orange" />
              </div>
              <div className="bg-[#121826] border border-blue-500/20 p-6 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 flex items-center gap-2"><Users size={14} /> Top Baleias</h3>
                {topBuyers.map((b, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-800 pb-3 mb-3 last:border-0 italic">
                    <p className="text-xs font-black uppercase line-clamp-1">{i+1}. {b.name}</p>
                    <p className="text-xs font-black text-green-500">{b.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SESSÃO DE RIFAS (RESTAURADA) */}
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase italic flex items-center gap-3"><Ticket className="text-blue-500" size={24} /> Meus Sorteios</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {raffles.map((raffle) => (
                  <div key={raffle.id} className={cn("bg-[#121826] border p-8 rounded-[2.5rem] relative group", raffle.status === "FINISHED" ? "border-green-500/20 opacity-90" : "border-slate-800")}>
                    <div className="absolute top-6 right-6">
                      {raffle.status !== "FINISHED" ? (
                        <button onClick={() => router.push(`/admin/raffles/${raffle.id}/edit`)} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-lg border border-slate-800"><Edit size={16} /></button>
                      ) : <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Finalizada</span>}
                    </div>
                    <h3 className="text-xl font-black uppercase italic mb-6 pr-12 line-clamp-1">{raffle.title}</h3>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <button onClick={() => router.push(`/raffle/${raffle.id}`)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-blue-500 transition-all"><Eye size={18} /><span className="text-[8px] font-black uppercase">Ver</span></button>
                      <button onClick={() => {
                        const url = `${window.location.origin}/raffle/${raffle.id}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(`🏆 *${raffle.title}*\n🔗 Garanta aqui: ${url}`)}`, '_blank');
                      }} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-green-500 transition-all"><Share2 size={18} /><span className="text-[8px] font-black uppercase">Zap</span></button>
                      <button onClick={() => setPrintRaffle(raffle)} className="flex flex-col items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl text-slate-400 hover:text-orange-500 transition-all"><Printer size={18} /><span className="text-[8px] font-black uppercase">QR</span></button>
                    </div>
                    <button onClick={() => router.push(`/admin/raffles/${raffle.id}/check`)} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"><Trophy size={14} /> Verificar Sorteio</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121826] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 bg-slate-900/30 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-lg font-black uppercase italic flex items-center gap-3"><ShoppingBag size={20} className="text-blue-500" /> Vendas Recentes</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input type="text" placeholder="Buscar cliente..." className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500 w-48 md:w-64 font-bold" value={filter} onChange={(e) => setFilter(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {["TODOS", "PENDENTE", "PAGO"].map(st => (
                    <button key={st} onClick={() => setStatusFilter(st)} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all", statusFilter === st ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-900 border-slate-800 text-slate-500")}>{st}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500 italic"><th className="px-8 py-5">Cliente</th><th className="px-8 py-5">Sorteio / Cotas</th><th className="px-8 py-5">Cambista</th><th className="px-8 py-5 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/20 transition-all text-sm group">
                        <td className="px-8 py-6">
                          <p className="font-black italic uppercase group-hover:text-blue-500 transition-colors">{order.customerName}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{order.customerPhone}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{order.raffleTitle}</p>
                          <div className="flex flex-wrap gap-1">
                            {order.selectedNumbers.slice(0, 5).map(n => <span key={n} className="bg-slate-900 border border-slate-800 text-[10px] font-black px-2 py-0.5 rounded text-blue-500">{n}</span>)}
                            {order.selectedNumbers.length > 5 && <span className="text-[9px] font-bold text-slate-600">+{order.selectedNumbers.length - 5}</span>}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {order.cambistaId ? <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{order.cambistaId}</span> : <span className="text-slate-800 text-[10px] font-bold">Direta</span>}
                        </td>
                        <td className="px-8 py-6 text-right">
                          {order.status === "PENDENTE" ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleCancelOrder(order)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><XCircle size={18} /></button>
                              <button onClick={() => handleApproveOrder(order)} className="bg-blue-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase">Aprovar</button>
                            </div>
                          ) : <span className={cn("text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest", order.status === "PAGO" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{order.status}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-xl font-black uppercase italic flex items-center gap-3"><Users size={24} className="text-blue-500" /> Gestão de Parceiros</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col w-full sm:w-auto">
                  <span className="text-[9px] font-black uppercase text-slate-500 mb-1 ml-1">Vincular Link ao:</span>
                  <select className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500" value={selectedRaffleForLink} onChange={(e) => setSelectedRaffleForLink(e.target.value)}>
                    {raffles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
                <button onClick={() => setShowPartnerModal(true)} className="w-full sm:w-auto bg-slate-800 px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><UserPlus size={16} /> Novo Cambista</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerStats.map((p) => (
                <div key={p.id} className="bg-[#121826] border border-slate-800 p-8 rounded-[2.5rem] relative group hover:border-blue-500 transition-all">
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={() => copyPartnerLink(p.id)} className="p-2 bg-slate-900 rounded-lg text-blue-500"><LinkIcon size={16} /></button>
                    <button onClick={async () => { if(confirm("Remover?")) await deleteDoc(doc(db, "parceiros", p.id)); }} className="p-2 bg-slate-900 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <p className="text-[10px] text-blue-500 font-black uppercase mb-1 italic">Cód: {p.id}</p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">{p.name}</h3>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800 mt-6">
                    <div><p className="text-[9px] text-slate-500 font-black uppercase mb-1">Vendas</p><p className="text-xl font-black italic">{p.totalTickets} Cotas</p></div>
                    <div><p className="text-[9px] text-slate-500 font-black uppercase mb-1 text-green-500">Lucro</p><p className="text-xl font-black text-green-500 italic">{p.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPartnerModal && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-slate-800 p-10 rounded-[3rem] w-full max-w-md relative shadow-2xl">
              <button onClick={() => setShowPartnerModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
              <h2 className="text-2xl font-black uppercase italic mb-8 italic">Novo Cambista</h2>
              <form onSubmit={handleAddPartner} className="space-y-4">
                <input required placeholder="Nome" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-bold" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} />
                <input required placeholder="Código (ex: midinho)" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-bold" value={newPartner.id} onChange={e => setNewPartner({...newPartner, id: e.target.value.replace(/\s/g, '').toLowerCase()})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="CPF" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-bold" value={newPartner.cpf} onChange={e => setNewPartner({...newPartner, cpf: e.target.value})} />
                  <input required placeholder="WhatsApp" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-bold" value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all mt-4">Criar Parceiro</button>
              </form>
            </div>
          </div>
        )}

        {printRaffle && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white text-black p-10 rounded-[3rem] w-full max-w-sm text-center relative shadow-2xl">
              <button onClick={() => setPrintRaffle(null)} className="absolute -top-12 right-0 text-white flex items-center gap-2 uppercase font-black text-[10px]"><X size={20}/> Fechar</button>
              <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Sorteio Digital</h2>
              <div className="bg-white p-4 rounded-3xl border-4 border-black inline-block mb-8">
                <QRCodeSVG value={`${window.location.origin}/raffle/${printRaffle.id}`} size={220} level="H" />
              </div>
              <p className="font-black text-sm uppercase mb-6 italic tracking-tight">{printRaffle.title}</p>
              <button onClick={() => window.print()} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all"><Printer size={18} /> Imprimir QR Code</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = { 
    green: "text-green-500 bg-green-500/10 border-green-500/10", 
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/10", 
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/10" 
  };
  return (
    <div className={cn("bg-[#121826] border p-8 rounded-[2.5rem] shadow-xl transition-all hover:scale-[1.02]", colors[color])}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner">{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">{title}</p>
      <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{value}</p>
    </div>
  );
}