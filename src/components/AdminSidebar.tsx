"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, Settings, LogOut, PlusCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export const AdminSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: "Pedidos", icon: LayoutDashboard, href: "/admin" },
    { name: "Nova Rifa", icon: PlusCircle, href: "/admin/raffles/new" },
    { name: "Configurações", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <aside className="w-64 bg-[#121826] border-r border-slate-800 flex flex-col p-6 h-screen sticky top-0">
      <div className="mb-10 px-2">
        <h2 className="text-xl font-black text-white tracking-tighter uppercase">Rifas Pro</h2>
        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              pathname === item.href 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
            )}
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}
      </nav>

      <button 
        onClick={() => auth.signOut()}
        className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/10 transition-all"
      >
        <LogOut size={20} />
        Sair
      </button>
    </aside>
  );
};