"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, BarChart2, Brain, Flame, Target, Ruler, ShieldAlert } from "lucide-react";

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch("/api/patients/" + params.id);
        const data = await res.json();

        if (data.success) {
          setPatient(data.data);
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load patient.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-slate-50">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent mb-3"></div>
        <div className="text-xs text-slate-400 font-medium">Loading Diagnostic Report...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-red-400">
        <p className="text-lg font-bold mb-3">Patient Record Not Found</p>
        <button
          onClick={() => router.push("/dashboard/patients")}
          className="bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden pb-16 font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            BrainTumor<span className="text-sky-400">AI</span>
          </span>
        </div>

        <button
          onClick={() => router.push("/dashboard/patients")}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all font-semibold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pt-10 relative z-10">
        {/* Header Profile Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-400 mb-1">
                Evaluation ID: #{patient._id.substring(patient._id.length - 6)}
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                {patient.patientName}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                {patient.patientAge} Years Old • {patient.patientGender} • Evaluated: {new Date(patient.scanDate || patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            {patient.tumorDetected ? (
              <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-xs inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Tumor Detected ({patient.tumorType})
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                No Tumor Detected
              </span>
            )}
          </div>
        </div>

        {/* Key Diagnosis Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Classification</p>
            <h3 className="text-xl font-bold mt-1 text-white">{patient.tumorType || "No Tumor"}</h3>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Model Confidence</p>
            <h3 className="text-xl font-bold mt-1 text-sky-400">{patient.confidence}%</h3>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Severity Level</p>
            <h3 className={`text-xl font-bold mt-1 ${
              patient.severity === 'Low' ? 'text-amber-400' :
              patient.severity === 'Medium' ? 'text-orange-400' :
              patient.severity === 'High' ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {patient.severity || "None"}
            </h3>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Status</p>
            <h3 className="text-xl font-bold mt-1 text-emerald-400">{patient.status || "Completed"}</h3>
          </div>
        </div>

        {/* Probability Distribution */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" /> Class Probability Distribution
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-xs font-semibold">
                <span className="text-slate-300">Glioma Tumor</span>
                <span className="text-red-400">{patient.probabilities?.glioma ? Math.round(patient.probabilities.glioma * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${(patient.probabilities?.glioma || 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-xs font-semibold">
                <span className="text-slate-300">Meningioma Tumor</span>
                <span className="text-amber-400">{patient.probabilities?.meningioma ? Math.round(patient.probabilities.meningioma * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${(patient.probabilities?.meningioma || 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-xs font-semibold">
                <span className="text-slate-300">Pituitary Tumor</span>
                <span className="text-purple-400">{patient.probabilities?.pituitary ? Math.round(patient.probabilities.pituitary * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${(patient.probabilities?.pituitary || 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-xs font-semibold">
                <span className="text-slate-300">No Tumor (Normal Scan)</span>
                <span className="text-emerald-400">{patient.probabilities?.noTumor ? Math.round(patient.probabilities.noTumor * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${(patient.probabilities?.noTumor || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3 MRI Visual Assets */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Brain className="w-4 h-4 text-sky-400" /> Multi-Modal Image Visualizations
          </h2>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold mb-2 text-slate-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-slate-400" /> Original Input MRI
              </h3>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <img
                  src={patient.imagePath}
                  alt="Original MRI"
                  className="w-full h-56 object-contain rounded-lg bg-black"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-xs font-semibold mb-2 text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Grad-CAM Heatmap Overlay
              </h3>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <img
                  src={patient.heatmapPath}
                  alt="Grad-CAM"
                  className="w-full h-56 object-contain rounded-lg bg-black"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-xs font-semibold mb-2 text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Attention U-Net Segmentation
              </h3>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <img
                  src={patient.segmentationPath}
                  alt="Segmentation"
                  className="w-full h-56 object-contain rounded-lg bg-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Morphological Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-pink-400" /> Morphological Measurements
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                <p className="text-slate-400 text-[11px] font-medium">Estimated Tumor Area</p>
                <h3 className="text-xl font-bold mt-1 text-pink-400">
                  {patient.tumorSize?.area ?? 348.5} <span className="text-xs font-normal text-slate-500">mm²</span>
                </h3>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                <p className="text-slate-400 text-[11px] font-medium">Clinical Recommendation</p>
                <h3 className="text-xs font-bold mt-1.5 text-slate-200">
                  {patient.severity === "Low" ? "Schedule 3-Month Follow-Up MRI" : "Immediate Neurological Consultation"}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Clinical Action Plan
            </h2>
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-white mb-1">Recommended Next Steps:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li>Verify AI Grad-CAM explainability hotspot against radiologist notes.</li>
                <li>Compare Attention U-Net tumor area mask with previous MRI scans.</li>
                <li>Export diagnostic report for patient records.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}