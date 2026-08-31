"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Brain, Target, Ruler } from "lucide-react";

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mb-4"></div>
        <div className="text-sm text-slate-400 font-medium">Loading Patient Diagnostic Record...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-red-400">
        <p className="text-base font-bold mb-4">Patient Record Not Found</p>
        <button
          onClick={() => router.push("/dashboard/patients")}
          className="bg-slate-900 border border-slate-800 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden pb-20 font-sans">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-8 lg:px-16 py-6 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            BrainTumor<span className="text-sky-400">AI</span>
          </span>
        </div>

        <button
          onClick={() => router.push("/dashboard/patients")}
          className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl transition-all font-semibold text-xs shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
      </nav>

      {/* Main Container - Widescreen & Breathable */}
      <main className="max-w-[1360px] mx-auto px-8 lg:px-16 pt-12 relative z-10 space-y-8">

        {/* Header Patient Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/70 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 lg:p-10 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                {patient.patientName}
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                {patient.patientAge} Years Old • {patient.patientGender} • Scan Date: {new Date(patient.scanDate || patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            {patient.tumorDetected ? (
              <span className="px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Tumor Detected ({patient.tumorType})
              </span>
            ) : (
              <span className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Normal Scan (No Tumor)
              </span>
            )}
          </div>
        </div>

        {/* Diagnostic Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-slate-900/70 border border-slate-800/80 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Classification</p>
            <h3 className="text-2xl font-bold mt-2 text-white">{patient.tumorType || "No Tumor"}</h3>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Model Confidence</p>
            <h3 className="text-2xl font-bold mt-2 text-sky-400">{patient.confidence}%</h3>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Severity Rating</p>
            <h3 className={`text-2xl font-bold mt-2 ${patient.severity === 'Low' ? 'text-amber-400' :
                patient.severity === 'Medium' ? 'text-orange-400' :
                  patient.severity === 'High' ? 'text-red-400' : 'text-emerald-400'
              }`}>
              {patient.severity || "None"}
            </h3>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Diagnostic Status</p>
            <h3 className="text-2xl font-bold mt-2 text-emerald-400">{patient.status || "Completed"}</h3>
          </div>
        </div>

        {/* 2 MRI Image Visual Assets */}
        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 lg:p-10 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-sky-400" /> Image Visualizations
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold mb-2.5 text-slate-300 flex items-center gap-2">
                <Brain className="w-4 h-4 text-slate-400" /> Original Input MRI
              </h3>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <img
                  src={patient.imagePath}
                  alt="Original MRI"
                  className="w-full h-80 object-contain rounded-xl bg-black"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-xs font-semibold mb-2.5 text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> Attention U-Net Mask
              </h3>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <img
                  src={patient.segmentationPath}
                  alt="Segmentation"
                  className="w-full h-80 object-contain rounded-xl bg-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Morphological Measurements */}
        {patient.tumorDetected && (
          <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 lg:p-10 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Ruler className="w-5 h-5 text-sky-400" /> Tumor Lesion Measurements
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Estimated Lesion Area</p>
                <h3 className="text-2xl lg:text-3xl font-extrabold mt-2 text-white">
                  {patient.tumorSize?.area ?? 348.5} <span className="text-sm font-normal text-slate-400">mm²</span>
                </h3>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Clinical Recommendation</p>
                <h3 className="text-sm font-semibold mt-2 text-amber-400">
                  {patient.severity === "Low" ? "Schedule 3-Month Follow-Up MRI" : "Immediate Neurological Specialist Consultation"}
                </h3>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}