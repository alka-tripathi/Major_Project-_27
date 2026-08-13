"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Bot, BarChart2, Brain, Flame, Target, Ruler, AlertTriangle, MapPin } from "lucide-react";

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(
          "/api/patients/" + params.id
        );

        const data = await res.json();

        if (data.success) {
          setPatient(data.data);
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.log(err);
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-xl text-zinc-400 font-medium">Loading Patient Details...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-400 text-2xl">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-hidden pb-12">
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

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-zinc-900/50 backdrop-blur-md relative z-10">
        <h1 className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => router.push('/dashboard')}>
          BrainTumor<span className="text-blue-500">AI</span>
        </h1>

        <button
          onClick={() => router.push("/dashboard/patients")}
          className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 px-5 py-2.5 rounded-xl transition-colors font-medium text-sm shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-8 pt-12 relative z-10">

        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {patient.patientName}
            </h1>
            <p className="text-zinc-400 text-lg mt-2 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" /> Complete MRI Analysis Report
            </p>
          </div>
        </div>

        {/* AI Prediction */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Bot className="w-7 h-7 text-blue-400" /> AI Prediction
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-zinc-400 text-sm font-medium">
                Tumor Detected
              </p>
              <h3
                className={`text-3xl font-bold mt-2 ${
                  patient.tumorDetected
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {patient.tumorDetected ? "YES" : "NO"}
              </h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-zinc-400 text-sm font-medium">
                Tumor Type
              </p>
              <h3 className="text-2xl font-bold mt-2 text-zinc-50 tracking-tight">
                {patient.tumorType}
              </h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-zinc-400 text-sm font-medium">
                Confidence
              </p>
              <h3 className="text-3xl font-bold mt-2 text-blue-400">
                {patient.confidence}%
              </h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-zinc-400 text-sm font-medium">
                Status
              </p>
              <h3 className="text-2xl font-bold mt-2 text-emerald-400 tracking-tight">
                {patient.status}
              </h3>
            </div>
          </div>
        </div>

        {/* Probability Analysis */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-indigo-400" /> Probability Analysis
          </h2>

          <div className="space-y-6">
            {/* Glioma */}
            <div>
              <div className="flex justify-between mb-2 font-medium">
                <span className="text-zinc-300">Glioma</span>
                <span className="text-red-400">{patient.probabilities?.glioma || 0}%</span>
              </div>
              <div className="w-full bg-zinc-800/50 rounded-full h-3 border border-zinc-800">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${patient.probabilities?.glioma || 0}%` }}
                />
              </div>
            </div>

            {/* Meningioma */}
            <div>
              <div className="flex justify-between mb-2 font-medium">
                <span className="text-zinc-300">Meningioma</span>
                <span className="text-yellow-400">{patient.probabilities?.meningioma || 0}%</span>
              </div>
              <div className="w-full bg-zinc-800/50 rounded-full h-3 border border-zinc-800">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  style={{ width: `${patient.probabilities?.meningioma || 0}%` }}
                />
              </div>
            </div>

            {/* Pituitary */}
            <div>
              <div className="flex justify-between mb-2 font-medium">
                <span className="text-zinc-300">Pituitary</span>
                <span className="text-purple-400">{patient.probabilities?.pituitary || 0}%</span>
              </div>
              <div className="w-full bg-zinc-800/50 rounded-full h-3 border border-zinc-800">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ width: `${patient.probabilities?.pituitary || 0}%` }}
                />
              </div>
            </div>

            {/* No Tumor */}
            <div>
              <div className="flex justify-between mb-2 font-medium">
                <span className="text-zinc-300">No Tumor</span>
                <span className="text-emerald-400">{patient.probabilities?.noTumor || 0}%</span>
              </div>
              <div className="w-full bg-zinc-800/50 rounded-full h-3 border border-zinc-800">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${patient.probabilities?.noTumor || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
             
        {/* Patient Information */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <User className="w-7 h-7 text-blue-400" /> Patient Information
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Patient Name</p>
              <h3 className="text-xl font-bold mt-2">{patient.patientName}</h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Age</p>
              <h3 className="text-xl font-bold mt-2">{patient.patientAge} Years</h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Gender</p>
              <h3 className="text-xl font-bold mt-2">{patient.patientGender}</h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Scan Date</p>
              <h3 className="text-lg font-bold mt-2">
                {new Date(patient.scanDate).toLocaleDateString()}
              </h3>
            </div>
          </div>
        </div>

        {/* MRI Information */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* MRI Image */}
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                <Brain className="w-5 h-5 text-zinc-400" /> MRI Scan
              </h3>
              <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex-grow">
                <img
                  src={patient.imagePath}
                  alt="MRI Scan"
                  className="w-full h-[350px] md:h-[450px] object-contain rounded-xl bg-black"
                />
              </div>
            </div>

            {/* Grad-CAM Heatmap */}
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Grad-CAM Heatmap
              </h3>
              <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex-grow">
                <img
                  src={patient.heatmapPath}
                  alt="Grad-CAM Heatmap"
                  className="w-full h-[350px] md:h-[450px] object-cover rounded-xl bg-black"
                />
              </div>
            </div>

            {/* Segmentation */}
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" /> Tumor Segmentation
              </h3>
              <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex-grow">
                <img
                  src={patient.segmentationPath}
                  alt="Tumor Segmentation"
                  className="w-full h-[350px] md:h-[450px] object-cover rounded-xl bg-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tumor Size */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Ruler className="w-7 h-7 text-pink-400" /> Tumor Size
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Width</p>
              <h3 className="text-3xl font-bold mt-2 text-blue-400">
                {patient.tumorSize?.width ?? 0} <span className="text-lg text-zinc-500">px</span>
              </h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Height</p>
              <h3 className="text-3xl font-bold mt-2 text-emerald-400">
                {patient.tumorSize?.height ?? 0} <span className="text-lg text-zinc-500">px</span>
              </h3>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Area</p>
              <h3 className="text-3xl font-bold mt-2 text-pink-400">
                {patient.tumorSize?.area ?? 0} <span className="text-lg text-zinc-500">px²</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Tumor Location */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
             <MapPin className="w-7 h-7 text-cyan-400" /> Tumor Location
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Region */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Region</p>
              <h3 className="text-3xl font-bold mt-2 text-cyan-400">
                {patient.location?.region || "N/A"}
              </h3>
            </div>

            {/* X Coordinate */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">X Coordinate</p>
              <h3 className="text-3xl font-bold mt-2 text-blue-400">
                {patient.location?.x ?? 0}
                <span className="text-lg ml-2 text-zinc-500">px</span>
              </h3>
            </div>

            {/* Y Coordinate */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Y Coordinate</p>
              <h3 className="text-3xl font-bold mt-2 text-emerald-400">
                {patient.location?.y ?? 0}
                <span className="text-lg ml-2 text-zinc-500">px</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Severity */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-yellow-500" /> Severity Assessment
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Severity */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Severity Level</p>
              <h3
                className={`text-3xl font-bold mt-2
                  ${
                    patient.severity === "Low"
                      ? "text-emerald-400"
                      : patient.severity === "Medium"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
              >
                {patient.severity}
              </h3>
            </div>

            {/* Risk */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Risk</p>
              <h3 className="text-3xl font-bold mt-2 text-indigo-400">
                {patient.severity === "Low"
                  ? "Minimal"
                  : patient.severity === "Medium"
                  ? "Moderate"
                  : "Critical"}
              </h3>
            </div>

            {/* Recommendation */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-400 text-sm font-medium">Action</p>
              <h3 className="text-xl font-bold mt-3 text-zinc-200">
                {patient.severity === "Low"
                  ? "Regular Monitoring"
                  : patient.severity === "Medium"
                  ? "Consult Specialist"
                  : "Immediate Treatment"}
              </h3>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}