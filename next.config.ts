import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

/**
 * PROTOCOLO TRATOR — NEXT 16 + PWA + NETLIFY
 * 1. Forçamos o Webpack para compatibilidade com next-pwa.
 * 2. Desativamos o Turbopack que é padrão no Next 16.
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Força Webpack e impede conflito com Turbopack
   * Necessário para o build do PWA no ambiente Netlify
   */
  webpack: (config) => {
    return config;
  },

  /**
   * Desativa Turbopack explicitamente para evitar erro fatal no build
   */
  // @ts-ignore - Next 16 pode reclamar da tipagem, mas a chave é funcional
  turbopack: false,
};

export default withPWA(nextConfig);