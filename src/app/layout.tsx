import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0A0F1C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Sorteio Digital",
  description: "Plataforma profissional de sorteios e rifas online",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sorteio Digital",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#0A0F1C] antialiased`}>
        {/* Layout limpo: o header agora é gerenciado pelas páginas internas */}
        <main>
          {children}
        </main>

        <Toaster position="top-right" />
      </body>
    </html>
  );
}