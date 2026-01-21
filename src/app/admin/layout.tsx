"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // Configuração da Stack de Elite
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Seu UID autorizado conforme as regras de negócio
  const ADMIN_UID = "ZUgbnGgE2AQ988RmcilLSnJPk9G2";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Se não houver usuário ou o UID for diferente do seu, redireciona para o login
      if (pathname !== "/admin/login") {
        if (!user || user.uid !== ADMIN_UID) {
          router.push("/admin/login");
        } else {
          setLoading(false);
        }
      } else {
        // Se estiver na tela de login, não precisa travar o carregamento
        setLoading(false);
      }
    });
    
    return () => unsub();
  }, [router, pathname]);

  // Tela de carregamento enquanto valida seu acesso
  if (loading) {
    return (
      <div className="h-screen bg-[#0A0F1C] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="font-bold tracking-widest text-[10px] uppercase text-slate-500">
          Validando Acesso de Administrador...
        </p>
      </div>
    );
  }

  // Se for a tela de login, renderiza pura. Se for o painel, inclui a Sidebar.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0A0F1C] text-white">
      {/* Sidebar de Elite fixada à esquerda */}
      <AdminSidebar />
      
      {/* Área de conteúdo dinâmico */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}