import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

/**
 * PROTOCOLO TRATOR - SOLUÇÃO PWA + NEXT 16
 * 1. Removida a chave 'turbopack' do experimental, pois o Next 16.1.3 a considera inválida.
 * 2. O uso do Webpack é forçado via flag no package.json para compatibilidade com o PWA.
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
  // Configurações padrão de elite
  reactStrictMode: true,
};

export default withPWA(nextConfig);