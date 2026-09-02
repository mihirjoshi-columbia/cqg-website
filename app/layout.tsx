import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Columbia Quant Group",
  description: "Columbia University's premier quantitative finance club.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* Hidden SVG defs shared across pages (rounded hexagon clip-path for the Memory Match game) */}
        <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
          <defs>
            <clipPath id="hex-rounded" clipPathUnits="objectBoundingBox">
              <path d="M 0.0626,0.2187 L 0.4374,0.0313 Q 0.5,0 0.5626,0.0313 L 0.9374,0.2187 Q 1,0.25 1,0.32 L 1,0.68 Q 1,0.75 0.9374,0.7813 L 0.5626,0.9687 Q 0.5,1 0.4374,0.9687 L 0.0626,0.7813 Q 0,0.75 0,0.68 L 0,0.32 Q 0,0.25 0.0626,0.2187 Z" />
            </clipPath>
          </defs>
        </svg>
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
