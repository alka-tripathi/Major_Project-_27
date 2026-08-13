"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Home, User, Brain, UploadCloud, Activity, BarChart2, Flame, Target, Ruler, MapPin, AlertTriangle, ArrowRight } from "lucide-react";
import { auth } from "@/firebase";

interface Probabilities {
  glioma?: number;
  meningioma?: number;
  pituitary?: number;
  noTumor?: number;
}

interface TumorSize {
  width?: number;
  height?: number;
  area?: number;
}

interface Location {
  x?: number;
  y?: number;
  region?: string;
}

interface AnalysisResult {
  _id: string;
  tumorDetected: boolean;
  tumorType: string;
  confidence: number;
  severity: string;
  imagePath: string;
  heatmapPath: string;
  segmentationPath: string;
  probabilities?: Probabilities;
  tumorSize?: TumorSize;
  location?: Location;
}

export default function AddPatientPage() {
  const router = useRouter();

  // Patient Details
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");

  // MRI Image
  const [image, setImage] = useState<File | null>(null);
  // Loading State
  const [loading, setLoading] = useState(false);
  // Form Error State
  const [formError, setFormError] = useState("");
  // Analysis Result State
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setFormError(""); // Clear error on drop
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      // Only accept images
      if (droppedFile.type.startsWith('image/')) {
        setImage(droppedFile);
      } else {
        alert('Please upload an image file (.jpg, .jpeg, .png)');
      }
    }
  };

  const handleAnalyze = async () => {
    setFormError("");

    // Validation
    if (!patientName || !patientAge || !patientGender) {
      setFormError("Please fill all patient details.");
      return;
    }

    if (!image) {
      setFormError("Please select an MRI image.");
      return;
    }

    // Logged in doctor
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    try {
      setLoading(true);
      
      // upload mri image to flask backend
      const formData = new FormData();
      formData.append("image", image);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
      const flaskResponse = await fetch(`${backendUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      const flaskData = await flaskResponse.json();

      console.log(flaskData);

      if (!flaskData.success) {
        alert(flaskData.message);
        return;
      }

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: currentUser.uid,
          patientName,
          patientAge: Number(patientAge),
          patientGender,
          
          // Original MRI
          imagePath: flaskData.imageUrl,
          // Grad-CAM
          heatmapPath: flaskData.heatmapUrl,
          // Segmentation
          segmentationPath: flaskData.segmentationUrl,
          // AI Prediction
          tumorDetected: flaskData.tumorDetected,
          tumorType: flaskData.tumorType,
          confidence: flaskData.confidence,
          // Probability Scores
          probabilities: flaskData.probabilities,
          // Tumor Size
          tumorSize: flaskData.tumorSize,
          // Tumor Location
          location: flaskData.location,
          // Tumor Severity
          severity: flaskData.severity,
          
          status: "Completed",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAnalysisResult(data.data);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      console.log(err);
      alert("Error: " + (err.message || "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

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
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 px-5 py-2 rounded-xl transition-colors font-medium text-sm shadow-sm"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-8 pt-12 relative z-10">
        {/* Heading */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold">
              Add Patient
            </h1>
            <p className="text-zinc-400 mt-3 text-lg">
              Enter patient information and upload MRI scan for analysis.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Patient Details */}
          <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-500" /> Patient Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-zinc-300 block mb-2 text-sm font-medium">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPatientName(e.target.value);
                    setFormError("");
                  }}
                  placeholder="Enter patient name"
                  className={`w-full bg-zinc-950 border text-white rounded-xl px-4 py-3 outline-none focus:ring-1 transition-all placeholder:text-zinc-600 ${formError === "Please fill all patient details." && !patientName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-blue-500 focus:ring-blue-500'}`}
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-2 text-sm font-medium">
                  Age
                </label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPatientAge(e.target.value);
                    setFormError("");
                  }}
                  placeholder="Enter age"
                  className={`w-full bg-zinc-950 border text-white rounded-xl px-4 py-3 outline-none focus:ring-1 transition-all placeholder:text-zinc-600 ${formError === "Please fill all patient details." && !patientAge ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-blue-500 focus:ring-blue-500'}`}
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-2 text-sm font-medium">
                  Gender
                </label>
                <select
                  value={patientGender}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setPatientGender(e.target.value);
                    setFormError("");
                  }}
                  className={`w-full bg-zinc-950 border text-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-1 transition-all ${formError === "Please fill all patient details." && !patientGender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-blue-500 focus:ring-blue-500'}`}
                >
                  <option value="" className="text-zinc-500">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* MRI Upload */}
          <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl shadow-xl p-8 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Brain className="w-6 h-6 text-indigo-400" /> MRI Scan Upload
            </h2>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors flex-grow flex flex-col items-center justify-center relative overflow-hidden group ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : formError === "Please select an MRI image." && !image
                  ? 'border-red-500 bg-red-500/5'
                  : 'border-zinc-700 hover:border-indigo-500/50 bg-zinc-950/50'
              }`}
            >
              <div className={`p-4 rounded-full border mb-4 transition-colors ${
                isDragging 
                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                  : formError === "Please select an MRI image." && !image
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 text-zinc-400 group-hover:text-indigo-400'
              }`}>
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className={`mb-6 text-sm ${formError === "Please select an MRI image." && !image ? 'text-red-400' : 'text-zinc-400'}`}>
                {isDragging ? 'Drop image here' : 'Drag & drop or upload MRI image'}
              </p>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if(e.target.files && e.target.files.length > 0) {
                      setImage(e.target.files[0]);
                      setFormError("");
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className={`bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border px-6 py-2.5 rounded-xl transition-colors font-medium text-sm ${formError === "Please select an MRI image." && !image ? 'border-red-500/50 hover:border-red-500/70' : 'border-zinc-700'}`}>
                  Browse Files
                </button>
              </div>

              {image && (
                <p className="mt-6 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg truncate max-w-full">
                  Selected: {image.name}
                </p>
              )}
            </div>

            {formError && (
              <p className="mt-4 text-red-400 text-sm font-medium text-center">
                {formError}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] py-4 rounded-2xl text-lg font-semibold transition-all disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" /> Analyze MRI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results Section */}
        <div ref={resultsRef} className="mt-10 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-emerald-400" /> MRI Analysis Report
          </h2>

          {!analysisResult ? (
            <div className="text-zinc-400">
              Upload an MRI scan and click <b>Analyze MRI</b> to generate:
              <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 ml-2 mt-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Tumor Detection</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>Tumor Type</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Confidence Score</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>Probability Distribution</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>Heatmap Visualization</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>PDF Report</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Top Metrics */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-400 text-sm font-medium">Tumor Detected</p>
                  <h3 className={`text-3xl font-bold mt-2 ${analysisResult.tumorDetected ? "text-red-400" : "text-emerald-400"}`}>
                    {analysisResult.tumorDetected ? "YES" : "NO"}
                  </h3>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-400 text-sm font-medium">Tumor Type</p>
                  <h3 className="text-2xl font-bold mt-2 text-zinc-50">{analysisResult.tumorType}</h3>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-400 text-sm font-medium">Confidence</p>
                  <h3 className="text-3xl font-bold mt-2 text-blue-400">{analysisResult.confidence}%</h3>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-400 text-sm font-medium">Severity</p>
                  <h3 className={`text-3xl font-bold mt-2 ${
                    analysisResult.severity === 'None' ? 'text-emerald-400' :
                    analysisResult.severity === 'Low' ? 'text-yellow-400' :
                    analysisResult.severity === 'Medium' ? 'text-orange-400' :
                    analysisResult.severity === 'High' ? 'text-red-500' : 'text-zinc-400'
                  }`}>
                    {analysisResult.severity}
                  </h3>
                </div>
              </div>

              {/* Images */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-zinc-300">
                    <Brain className="w-4 h-4 text-zinc-400" /> Original MRI
                  </h3>
                  <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                    <img src={analysisResult.imagePath} className="w-full h-64 object-contain rounded-xl bg-black" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-zinc-300">
                    <Flame className="w-4 h-4 text-orange-500" /> Grad-CAM
                  </h3>
                  <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                    <img src={analysisResult.heatmapPath} className="w-full h-64 object-cover rounded-xl bg-black" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-zinc-300">
                    <Target className="w-4 h-4 text-emerald-400" /> Segmentation
                  </h3>
                  <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                    <img src={analysisResult.segmentationPath} className="w-full h-64 object-cover rounded-xl bg-black" />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => router.push(`/dashboard/patient/${analysisResult._id}`)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  View Full Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
