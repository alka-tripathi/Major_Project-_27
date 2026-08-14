import Link from "next/link";
import { Brain, Activity, FileText, ShieldCheck, ArrowRight, CheckCircle2, Stethoscope, Layers, Flame, Target, Cpu, Database, Network } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans flex flex-col justify-between selection:bg-sky-600 selection:text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            BrainTumor<span className="text-sky-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-all shadow-sm active:scale-[0.98]"
          >
            Doctor Registration
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 max-w-5xl mx-auto w-full">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
          Brain Tumor Classification & <br />
          <span className="text-sky-400">Segmentation Platform</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
          An integrated clinical workstation for neuro-oncology. Analyze brain MRI scans using 
          EfficientNetB3 multi-class classification, Grad-CAM heatmaps, and Attention U-Net tumor segmentation.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/login"
            className="bg-sky-600 hover:bg-sky-500 text-white px-7 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            Launch Workstation <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/signup"
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-7 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Stethoscope className="w-4 h-4 text-sky-400" /> Create Doctor Account
          </Link>
        </div>

        {/* Real AI Model Architecture & Pipeline Technical Card */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 mb-16 text-left shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" /> Deep Learning Model Specifications & Pipeline
            </span>
            <span className="text-[11px] text-sky-400 font-semibold px-2.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
              FastAPI + TensorFlow 2.x
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Classification Model */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-white font-bold text-xs">
                  <Brain className="w-4 h-4 text-sky-400" /> EfficientNetB3 Classifier
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Input resolution: <code className="text-sky-300">300x300x3</code>. Custom classification top with 
                  GlobalAveragePooling2D, Batch Normalization, Dropout (0.4/0.3), 256-Dense ReLU, and Softmax activation.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-medium">
                Output: 4-Class Probability Vector
              </div>
            </div>

            {/* Grad-CAM Heatmap */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-white font-bold text-xs">
                  <Flame className="w-4 h-4 text-amber-400" /> Grad-CAM Explainability
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Extracts feature gradients from final convolutional layer <code className="text-amber-300 font-mono">top_conv</code>. 
                  Computes weighted class activation maps and applies OpenCV Jet Colormap overlay onto MRI pixels.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-medium">
                Output: Visual Thermal Attention Map
              </div>
            </div>

            {/* Attention U-Net Segmenter */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-white font-bold text-xs">
                  <Target className="w-4 h-4 text-emerald-400" /> Attention U-Net Segmenter
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Input resolution: <code className="text-emerald-300">256x256x1</code>. Encoder-decoder with Attention Gates 
                  generating binary tumor masks to calculate morphological lesion area (<code className="text-emerald-300 font-mono">mm²</code>).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-medium">
                Output: Contour Boundary & Surface Area ($mm^2$)
              </div>
            </div>
          </div>

          {/* Cloud Storage & Database Architecture Row */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px]">Firebase Storage Asset Hierarchy</p>
                <p className="text-[10px] text-slate-400">Per-doctor folder trees (<code className="text-sky-300">doctors/email/patients/timestamp/</code>)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px]">MongoDB Atlas Metadata Persistence</p>
                <p className="text-[10px] text-slate-400">Stores patient history, tumor size, class probabilities & image URLs</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Types of Brain Tumor Classification Section */}
        <div className="w-full text-left">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Tumor Classification Categories</h2>
            <p className="text-slate-400 text-xs mt-1">Diagnostic classes supported by the automated classification model:</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Class 01
              </span>
              <h3 className="text-base font-bold text-white mt-3">Glioma Tumor</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Tumor originating in glial supportive tissue surrounding neurons in brain tissue.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Class 02
              </span>
              <h3 className="text-base font-bold text-white mt-3">Meningioma</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Tumor arising from the meningeal membranes surrounding the brain.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Class 03
              </span>
              <h3 className="text-base font-bold text-white mt-3">Pituitary Tumor</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Neoplasm located in the pituitary gland impacting hormone secretion.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Class 04
              </span>
              <h3 className="text-base font-bold text-white mt-3">No Tumor (Normal)</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Healthy brain MRI tissue with no structural tumor mass detected.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-slate-500 text-xs bg-[#0B0F17]">
        <div className="max-w-5xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>BrainTumorAI Clinical Workstation</span>
          </div>
          <p>© 2026 BrainTumorAI. Medical Information System.</p>
        </div>
      </footer>
    </div>
  );
}