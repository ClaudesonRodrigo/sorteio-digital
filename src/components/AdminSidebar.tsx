"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, LogOut, PlusCircle, Menu, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Controle do menu mobile

  const menuItems = [
    { name: "Pedidos", icon: LayoutDashboard, href: "/admin" },
    { name: "Nova Rifa", icon: PlusCircle, href: "/admin/raffles/new" },
    { name: "Configurações", icon: Settings, href: "/admin/settings" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botão Hambúrguer Mobile */}
      <button 
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-60 p-3 bg-blue-600 text-white rounded-xl shadow-lg md:hidden active:scale-90 transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Sidebar Principal */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-55 w-72 bg-[#121826] border-r border-slate-800 flex flex-col p-6 transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-10 px-2 mt-12 md:mt-0">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">Rifas Pro</h2>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Admin Panel</p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all text-sm md:text-base",
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
          className="mt-auto flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-red-400 hover:bg-red-500/10 transition-all text-sm"
        >
          <LogOut size={20} />
          Sair
        </button>
      </aside>
    </>
  );
};