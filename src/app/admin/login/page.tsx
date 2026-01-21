"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      
      // Verificação extra no Front-end por segurança
      if (result.user.uid === "ZUgbnGgE2AQ988RmcilLSnJPk9G2") {
        router.push("/admin");
      } else {
        await auth.signOut();
        setError("Acesso negado: Este e-mail não é o administrador autorizado.");
      }
    } catch (err: any) {
      setError("Falha na autenticação com o Google.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121826] border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl text-center">
        <div className="bg-blue-600/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
          <ShieldCheck className="text-blue-500" size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Painel Admin</h1>
        <p className="text-slate-500 text-sm mb-10">Use sua conta Google autorizada para acessar.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-800 text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-6 h-6" />
              Entrar com Google
            </>
          )}
        </button>
        
        <p className="mt-8 text-slate-600 text-[10px] uppercase font-bold tracking-widest">
          Acesso Exclusivo: { "claudesonborges@gmail.com" }
        </p>
      </div>
    </div>
  );
}