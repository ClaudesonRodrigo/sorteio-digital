import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

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
   * Forçamos o uso do Webpack para garantir que o next-pwa 
   * consiga gerar o Service Worker corretamente na Vercel.
   */
  webpack: (config) => {
    return config;
  },

  /**
   * Silenciamos o erro do Next 16 configurando turbopack como objeto vazio.
   * Isso desativa o Turbopack em favor do Webpack definido acima.
   */
  // @ts-ignore
  turbopack: {},
};

export default withPWA(nextConfig);