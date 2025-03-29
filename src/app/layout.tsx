import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InitializeApp } from "./init-client";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Administración MyCondo",
  description: "Panel administrativo para gestión de condominios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-100`}
      >
        {/* Auth Provider wrapped around the entire app */}
        <AuthProvider>
          {/* Inicializa la app en el lado del cliente */}
          <InitializeApp />
          
          {/* Diseño principal */}
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="border-t bg-black text-gray-400 py-3 text-center text-sm">
              © {new Date().getFullYear()} Administración MyCondo
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}