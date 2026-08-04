"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaUserMd } from "react-icons/fa";

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl">
        Loading Patient Details...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400 text-2xl">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}

      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">

        <h1 className="text-3xl font-bold text-blue-500">
          BrainTumorAI
        </h1>

        <button
          onClick={() => router.push("/dashboard/patients")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl transition"
        >
          <FaArrowLeft />
          Back
        </button>

      </nav>

      <div className="max-w-6xl mx-auto p-8">

        <div className="flex items-center gap-4 mb-10">

          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl">
            <FaUserMd />
          </div>

          <div>

            <h1 className="text-4xl font-bold">
              {patient.patientName}
            </h1>

            <p className="text-slate-400 text-lg mt-2">
              Complete MRI Analysis Report
            </p>

          </div>

        </div>

        {/* AI Prediction */}
<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">
  <h2 className="text-2xl font-bold mb-6">
    🤖 AI Prediction
  </h2>

  <div className="grid md:grid-cols-2 gap-6">

    <div className="bg-slate-800 p-5 rounded-xl">
      <p className="text-slate-400 text-sm">
        Tumor Detected
      </p>

      <h3
        className={`text-2xl font-bold mt-2 ${
          patient.tumorDetected
            ? "text-red-400"
            : "text-green-400"
        }`}
      >
        {patient.tumorDetected ? "YES" : "NO"}
      </h3>
    </div>

    <div className="bg-slate-800 p-5 rounded-xl">
      <p className="text-slate-400 text-sm">
        Tumor Type
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {patient.tumorType}
      </h3>
    </div>

    <div className="bg-slate-800 p-5 rounded-xl">
      <p className="text-slate-400 text-sm">
        Confidence
      </p>

      <h3 className="text-2xl font-bold mt-2 text-blue-400">
        {patient.confidence}%
      </h3>
    </div>

    <div className="bg-slate-800 p-5 rounded-xl">
      <p className="text-slate-400 text-sm">
        Status
      </p>

      <h3 className="text-2xl font-bold mt-2 text-green-400">
        {patient.status}
      </h3>
    </div>

  </div>
</div>

{/* Probability Analysis */}

<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">

  <h2 className="text-2xl font-bold mb-8">
    📊 Probability Analysis
  </h2>

  <div className="space-y-6">

    {/* Glioma */}

    <div>

      <div className="flex justify-between mb-2">
        <span>Glioma</span>
        <span>{patient.probabilities?.glioma || 0}%</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-4">

        <div
          className="bg-red-500 h-4 rounded-full transition-all duration-700"
          style={{
            width: `${patient.probabilities?.glioma || 0}%`,
          }}
        />

      </div>

    </div>

    {/* Meningioma */}

    <div>

      <div className="flex justify-between mb-2">
        <span>Meningioma</span>
        <span>{patient.probabilities?.meningioma || 0}%</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-4">

        <div
          className="bg-yellow-500 h-4 rounded-full transition-all duration-700"
          style={{
            width: `${patient.probabilities?.meningioma || 0}%`,
          }}
        />

      </div>

    </div>

    {/* Pituitary */}

    <div>

      <div className="flex justify-between mb-2">
        <span>Pituitary</span>
        <span>{patient.probabilities?.pituitary || 0}%</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-4">

        <div
          className="bg-purple-500 h-4 rounded-full transition-all duration-700"
          style={{
            width: `${patient.probabilities?.pituitary || 0}%`,
          }}
        />

      </div>

    </div>

    {/* No Tumor */}

    <div>

      <div className="flex justify-between mb-2">
        <span>No Tumor</span>
        <span>{patient.probabilities?.noTumor || 0}%</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-4">

        <div
          className="bg-green-500 h-4 rounded-full transition-all duration-700"
          style={{
            width: `${patient.probabilities?.noTumor || 0}%`,
          }}
        />

      </div>

    </div>

  </div>

</div>
     

{/* Patient Information */}

<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">

  <h2 className="text-2xl font-bold mb-8">
    👤 Patient Information
  </h2>

  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Patient Name
      </p>

      <h3 className="text-xl font-bold mt-2">
        {patient.patientName}
      </h3>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Age
      </p>

      <h3 className="text-xl font-bold mt-2">
        {patient.patientAge} Years
      </h3>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Gender
      </p>

      <h3 className="text-xl font-bold mt-2">
        {patient.patientGender}
      </h3>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Scan Date
      </p>

      <h3 className="text-lg font-bold mt-2">
        {new Date(patient.scanDate).toLocaleDateString()}
      </h3>
    </div>

  </div>

</div>


{/* MRI Information */}

<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">

  <div className="grid lg:grid-cols-3 gap-8">

    {/* MRI Image */}
    <div>
       <h3 className="text-xl font-semibold mb-4 text-center">
      🧠 MRI Scan
    </h3>
      <img
        src={patient.imagePath}
        alt="MRI Scan"
        className="w-full h-[450px] object-contain rounded-2xl border border-slate-700 bg-black"
      />
    </div>

    {/* Grad-CAM Heatmap */}
    <div>
      <h3 className="text-xl font-semibold mb-4 text-center">
      🔥 Grad-CAM Heatmap
     </h3>
      <img
        src={patient.heatmapPath}
        alt="Grad-CAM Heatmap"
        className="w-full h-[450px] object-cover rounded-2xl border border-slate-700 bg-black"
      />
    </div>
    {/* Segmentation */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-center">
            🎯 Tumor Segmentation
        </h3>
        <img
    src={patient.segmentationPath}
    alt="Tumor Segmentation"
    className="w-full h-[450px] object-cover rounded-2xl border border-slate-700 bg-black" />
  </div>

  </div>

</div>

{/* Tumor Size */}

<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">

  <h2 className="text-2xl font-bold mb-8">
    📏 Tumor Size
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Width
      </p>

      <h3 className="text-2xl font-bold mt-2 text-blue-400">
        {patient.tumorSize?.width ?? 0} px
      </h3>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Height
      </p>

      <h3 className="text-2xl font-bold mt-2 text-green-400">
        {patient.tumorSize?.height ?? 0} px
      </h3>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">
        Area
      </p>

      <h3 className="text-2xl font-bold mt-2 text-pink-400">
        {patient.tumorSize?.area ?? 0} px²
      </h3>
    </div>

  </div>

</div>
{/* Tumor Location */}

<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">

  <h2 className="text-2xl font-bold mb-8">
     Tumor Location
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    {/* Region */}
    <div className="bg-slate-800 rounded-2xl p-6">

      <p className="text-slate-400 text-sm">
        Region
      </p>

      <h3 className="text-3xl font-bold mt-3 text-cyan-400">
        {patient.location?.region || "N/A"}
      </h3>

    </div>

    {/* X Coordinate */}
    <div className="bg-slate-800 rounded-2xl p-6">

      <p className="text-slate-400 text-sm">
        X Coordinate
      </p>

      <h3 className="text-3xl font-bold mt-3 text-blue-400">
        {patient.location?.x ?? 0}
        <span className="text-lg ml-2 text-slate-400">px</span>
      </h3>

    </div>

    {/* Y Coordinate */}
    <div className="bg-slate-800 rounded-2xl p-6">

      <p className="text-slate-400 text-sm">
        Y Coordinate
      </p>

      <h3 className="text-3xl font-bold mt-3 text-green-400">
        {patient.location?.y ?? 0}
        <span className="text-lg ml-2 text-slate-400">px</span>
      </h3>

    </div>

  </div>

</div>
{/* Severity */}

<div className="mt-8 bg-slate-900 rounded-3xl p-8 shadow-xl">

  <h2 className="text-2xl font-bold mb-8">
    ⚠️ Severity Assessment
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    {/* Severity */}
    <div className="bg-slate-800 rounded-2xl p-6">

      <p className="text-slate-400 text-sm">
        Severity Level
      </p>

      <h3
        className={`text-3xl font-bold mt-3
          ${
            patient.severity === "Low"
              ? "text-green-400"
              : patient.severity === "Medium"
              ? "text-yellow-400"
              : "text-red-400"
          }`}
      >
        {patient.severity}
      </h3>

    </div>

    {/* Risk */}
    <div className="bg-slate-800 rounded-2xl p-6">

      <p className="text-slate-400 text-sm">
        Risk
      </p>

      <h3 className="text-3xl font-bold mt-3 text-blue-400">

        {patient.severity === "Low"
          ? "Minimal"
          : patient.severity === "Medium"
          ? "Moderate"
          : "Critical"}

      </h3>

    </div>

    {/* Recommendation */}
    <div className="bg-slate-800 rounded-2xl p-6">

      <p className="text-slate-400 text-sm">
        Action
      </p>

      <h3 className="text-lg font-bold mt-3">

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