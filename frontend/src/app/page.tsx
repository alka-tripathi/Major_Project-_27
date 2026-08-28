"use client";

import Link from "next/link";
import { Brain, ArrowRight, ShieldCheck, Activity, Stethoscope, Layers, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans flex flex-col justify-between selection:bg-sky-600 selection:text-white relative overflow-hidden">
      {/* Dynamic Motion Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
            backgroundSize: '5rem 5rem',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 80%, transparent 100%)'
          }}
        />

        {/* Animated Laser Scanning Line */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-70 animate-[scan_8s_easeInOut_infinite] shadow-[0_0_20px_#38bdf8]" />

        {/* Soft Radial Ambient Pulses */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-sky-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse duration-1000" />
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Spacious Navbar */}
      <nav className="flex justify-between items-center px-8 lg:px-16 py-6 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3.5 cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            BrainTumor<span className="text-sky-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20 active:scale-[0.98]"
          >
            Doctor Registration
          </Link>
        </div>
      </nav>

      {/* Main Hero Container - Widescreen & Breathable Layout */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 lg:px-16 py-20 lg:py-28 max-w-[1360px] mx-auto w-full relative z-10 space-y-16">
        
        {/* Title & Subtitle Group */}
        <div className="flex flex-col items-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.12]">
            <span className="text-sky-400">Brain Tumor Detection</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-3xl leading-relaxed font-normal pt-2">
            Automated brain MRI scan evaluation combining multi-class tumor classification, Attention U-Net lesion segmentation, and real-time surface area calculations.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-6">
            <Link
              href="/login"
              className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-600/25 active:scale-[0.98]"
            >
              Access Workstation <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/signup"
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 px-8 py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-3 backdrop-blur-sm active:scale-[0.98]"
            >
              <Stethoscope className="w-5 h-5 text-sky-400" /> Create Doctor Account
            </Link>
          </div>
        </div>

        {/* 3 Spacious Feature Module Cards */}
        <div className="grid md:grid-cols-3 gap-8 w-full text-left pt-6">
          <div className="p-8 lg:p-10 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Class Diagnosis</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Accurately classifies brain MRI scans into Glioma, Meningioma, Pituitary, or Normal Tissue with model confidence scores.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 pt-4 border-t border-slate-800/60">
              <CheckCircle2 className="w-4 h-4" /> EfficientNet-B3 Backbone
            </div>
          </div>

          <div className="p-8 lg:p-10 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Morphological Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Calculates precise lesion area measurements (mm²) and automatically categorizes tumor stage severity.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 pt-4 border-t border-slate-800/60">
              <CheckCircle2 className="w-4 h-4" /> Real-Time Area Metric
            </div>
          </div>

          <div className="p-8 lg:p-10 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lesion Segmentation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Extracts tumor lesion boundaries and calculates total surface area measurements (mm²) for clinical reports.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-4 border-t border-slate-800/60">
              <CheckCircle2 className="w-4 h-4" /> Attention U-Net Model
            </div>
          </div>
        </div>

      </main>

      {/* Spacious Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-slate-400 text-sm bg-[#0B0F17]/90 backdrop-blur-md relative z-10">
        <div className="max-w-[1360px] mx-auto px-8 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <span className="font-medium text-slate-300">BrainTumorAI Clinical System</span>
          </div>
          <p className="text-slate-500 text-xs">© 2026 BrainTumorAI Workstation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}