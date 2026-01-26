"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Ticket, 
  Trophy, 
  Users, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Sessão encerrada com segurança.");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Erro ao sair do sistema.");
    }
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      active: pathname === "/admin"
    },
    {
      label: "Meus Sorteios",
      icon: Ticket,
      href: "/admin/raffles/new",
      active: pathname.includes("/raffles")
    },
    {
      label: "Ganhadores",
      icon: Trophy,
      href: "/ganhadores",
      active: pathname === "/ganhadores"
    },
    {
      label: "Definições",
      icon: Settings,
      href: "/admin/settings",
      active: pathname === "/admin/settings"
    }
  ];

  return (
    <aside className="w-72 bg-[#0A0F1C] border-r border-slate-800 h-screen sticky top-0 flex flex-col p-6 hidden md:flex">
      {/* LOGO DE ELITE */}
      <div className="flex items-center gap-3 px-2 mb-12">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/40">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-black uppercase italic tracking-tighter text-lg leading-none">
            Admin <span className="text-blue-500">Elite</span>
          </span>
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">
            Sorteio Digital
          </span>
        </div>
      </div>

      {/* NAVEGAÇÃO PRINCIPAL */}
      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-2">Menu Principal</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 border",
              item.active 
                ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/30" 
                : "bg-transparent border-transparent text-slate-500 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110", item.active ? "text-white" : "text-slate-500")} />
              <span className="text-xs font-black uppercase tracking-widest italic">{item.label}</span>
            </div>
            {item.active && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
          </Link>
        ))}
      </nav>

      {/* FOOTER DA SIDEBAR - LOGOUT */}
      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
              <Users size={14} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-black uppercase italic">Carioca</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Tech Lead</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest italic">Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
};