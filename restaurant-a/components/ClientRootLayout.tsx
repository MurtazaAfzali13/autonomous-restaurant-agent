"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar/Navbar";
import { CartProvider } from "@/share/CartContext";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false, // اضافه کردن این خط
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false, // اضافه کردن این خط
});

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}