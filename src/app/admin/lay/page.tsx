"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; //
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Se não estiver logado e não for a página de login, redireciona
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router, pathname]);

  if (loading && pathname !== "/admin/login") {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="font-bold tracking-widest text-xs uppercase text-slate-500">Verificando Credenciais...</p>
      </div>
    );
  }

  return <>{children}</>;
}