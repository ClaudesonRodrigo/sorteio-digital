"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // UID Único do Claudeson para Sergipe
  const ADMIN_UID = "ZUgbnGgE2AQ988RmcilLSnJPk9G2";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Se estiver na tela de login, apenas libera o loading
      if (pathname === "/admin/login") {
        setLoading(false);
        return;
      }

      // Validação de Identidade Crítica
      if (!user || user.uid !== ADMIN_UID) {
        setAuthorized(false);
        router.push("/admin/login");
      } else {
        setAuthorized(true);
        setLoading(false);
      }
    });
    
    return () => unsub();
  }, [router, pathname, ADMIN_UID]);

  // Loader de Elite enquanto verifica o UID
  if (loading) {
    return (
      <div className="h-screen bg-[#0A0F1C] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={56} />
        <p className="font-black tracking-[0.3em] text-[10px] uppercase text-slate-500">
          Verificando Credenciais Admin
        </p>
      </div>
    );
  }

  // Não renderiza nada se não estiver na tela de login e não for o admin
  if (pathname !== "/admin/login" && !authorized) return null;

  // Tela de login renderiza limpa
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Painel renderiza com a Sidebar
  return (
    <div className="flex min-h-screen bg-[#0A0F1C] text-white">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl animate-in fade-in duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}