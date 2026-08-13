import Link from "next/link";
import { Brain, Activity, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-blue-900 selection:text-blue-50 relative overflow-hidden">
      
      {/* Background Animated Grid (Net) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animate-grid-pan {
          animation: grid-pan 4s linear infinite;
        }
      `}} />
      <div 
        className="absolute inset-0 pointer-events-none h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-pan"
        style={{ maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)' }}
      ></div>

      {/* Background Glowing Blobs (Motion Elements) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-10000 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-7000 delay-1000 -z-10"></div>
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-5000 -z-10"></div>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-zinc-900/50 backdrop-blur-md relative z-10">
        <h1 className="text-2xl font-bold tracking-tight">
          BrainTumor<span className="text-blue-500">AI</span>
        </h1>

        <div className="space-x-4 flex items-center">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-zinc-400 hover:text-blue-400 transition-colors"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-5 py-2 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-32 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/30 border border-blue-900/50 text-xs font-medium text-blue-300 mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          AI-Powered Analysis
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl leading-tight">
          Modernizing <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Brain Tumor Detection</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          Empowering healthcare professionals with state-of-the-art AI for early, 
          accurate, and secure MRI analysis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="bg-blue-600 text-white hover:bg-blue-500 px-8 py-4 rounded-full text-base font-semibold transition-transform hover:scale-105 active:scale-95 text-center shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Get Started
          </Link>

          <Link
            href="/signup"
            className="border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-950/20 text-zinc-300 hover:text-blue-100 px-8 py-4 rounded-full text-base font-semibold transition-all text-center"
          >
            Register as Doctor
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-8 py-24 border-t border-zinc-900/50 relative z-10">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Core Features</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Everything you need to analyze MRI scans and manage patient records securely in one place.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-colors group relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 rounded-full bg-blue-950/50 border border-blue-900/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-900 transition-all duration-300 relative z-10">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight relative z-10">
              MRI Upload
            </h3>
            <p className="text-zinc-400 leading-relaxed relative z-10">
              Upload MRI scans securely for immediate processing and analysis in the cloud.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-colors group relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 rounded-full bg-indigo-950/50 border border-indigo-900/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-900 transition-all duration-300 relative z-10">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight relative z-10">
              AI Prediction
            </h3>
            <p className="text-zinc-400 leading-relaxed relative z-10">
              Detect and classify tumor types rapidly using advanced deep learning models.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-colors group relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 rounded-full bg-blue-950/50 border border-blue-900/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-900 transition-all duration-300 relative z-10">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight relative z-10">
              Patient Records
            </h3>
            <p className="text-zinc-400 leading-relaxed relative z-10">
              Maintain comprehensive history and diagnosis reports efficiently and securely.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900/50 py-8 text-center text-zinc-500 text-sm relative z-10">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 BrainTumor<span className="text-blue-500">AI</span></p>
          <p>Built for Healthcare Professionals</p>
        </div>
      </footer>
    </div>
  );
}