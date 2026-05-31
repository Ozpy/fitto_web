import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://fitto.app"),
  title: "FITTO - Inteligencia Artificial para tu Fitness",
  description: "FITTO es tu entrenador y nutricionista personal de IA. Diseña rutinas a medida, calcula tus macros, monitorea tus hábitos y chatea con tu coach 24/7.",
  keywords: ["fitness", "entrenamiento", "nutrición", "inteligencia artificial", "gimnasio", "dieta", "coach"],
  authors: [{ name: "FITTO Team" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "FITTO - Tu Entrenador Personal de IA",
    description: "Diseña rutinas a medida, calcula tus macros y chatea con tu coach 24/7.",
    url: "https://fitto.app",
    siteName: "FITTO",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "FITTO Logo",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
};

import { Providers } from "@/components/layout/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
