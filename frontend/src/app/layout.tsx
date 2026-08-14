import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrainTumorAI - Clinical Brain Tumor Detection & Analysis",
  description: "Enterprise Medical Platform for Brain Tumor Classification, Grad-CAM Heatmap Explainability & Attention U-Net Segmentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased dark scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#0B0F17] text-slate-100 selection:bg-sky-600 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
