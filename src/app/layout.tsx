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
  title: "Sorteio Digital | Aracaju",
  description: "Plataforma profissional de sorteios e rifas online",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sorteio Digital",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-[#0A0F1C] antialiased`}>
        {children}
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: { 
              background: '#121826', 
              color: '#fff', 
              border: '1px solid #1e293b',
              borderRadius: '1.5rem'
            },
          }} 
        />
      </body>
    </html>
  );
}