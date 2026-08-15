import Link from "next/link";
import { 
  Brain, 
  Flame, 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  Stethoscope, 
  Layers, 
  Activity 
} from "lucide-react";

export default function Home() {
  const featureCards = [
    {
      icon: Brain,
      badge: "AI Classification",
      title: "Multi-Class Classification",
      description: "Automated MRI scan analysis detecting Glioma, Meningioma, Pituitary, or Normal tissue with high precision.",
      iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    {
      icon: Flame,
      badge: "Explainable AI",
      title: "Grad-CAM Thermal Maps",
      description: "Visual heatmaps overlaying MRI scans to pinpoint exact regions influencing the AI's diagnostic decision.",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      icon: Target,
      badge: "Precision Metrics",
      title: "Attention U-Net Segmentation",
      description: "Accurate lesion boundary extraction and real-time surface area calculation (mm²) for clinical reporting.",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      icon: Layers,
      badge: "Clinical Management",
      title: "Patient Scan Archives",
      description: "Centralized doctor workstation for managing patient records, scan history, and clinical reports.",
      iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
  ];

  const categoryCards = [
    {
      id: "01",
      title: "Glioma Tumor",
      category: "Malignant / Benign",
      tagColor: "text-red-400 bg-red-500/10 border-red-500/20",
      description: "Originates in glial supportive brain tissue. Early AI identification helps guide targeted treatment strategies.",
    },
    {
      id: "02",
      title: "Meningioma",
      category: "Meningeal Layers",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Arises from protective membranes surrounding the brain. Tracked with precise surface area boundaries.",
    },
    {
      id: "03",
      title: "Pituitary Tumor",
      category: "Endocrine System",
      tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      description: "Develops in the pituitary gland. Heatmaps assist in distinguishing subtle glandular structural variations.",
    },
    {
      id: "04",
      title: "Normal (No Tumor)",
      category: "Healthy Tissue",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Healthy MRI tissue showing clear anatomical structures without detected abnormal tumor masses.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans flex flex-col justify-between selection:bg-sky-600 selection:text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
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
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20 active:scale-[0.98]"
          >
            Doctor Registration
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-14 pb-16 max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
          AI-Powered Brain Tumor <br />
          <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Classification & Segmentation
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
          Streamlined MRI scan analysis, instant explainable heatmaps, and lesion area quantification built specifically for clinical workflows.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/login"
            className="bg-sky-600 hover:bg-sky-500 text-white px-7 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 active:scale-[0.98]"
          >
            Launch Workstation <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/signup"
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Stethoscope className="w-4 h-4 text-sky-400" /> Create Doctor Account
          </Link>
        </div>

        {/* Core Capabilities Cards Grid */}
        <div className="w-full text-left mb-16">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" /> Key Platform Capabilities
            </h2>
            <p className="text-slate-400 text-xs mt-1">Core intelligent diagnostic tools integrated into your workstation.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featureCards.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/70 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl border ${card.iconBg}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classification Categories Cards Grid */}
        <div className="w-full text-left">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Tumor Diagnostic Classes</h2>
            <p className="text-slate-400 text-xs mt-1">Supported categories for automated multi-class MRI identification:</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {categoryCards.map((cat) => (
              <div
                key={cat.id}
                className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${cat.tagColor}`}>
                      Class {cat.id}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{cat.category}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-slate-500 text-xs bg-[#0B0F17]">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
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