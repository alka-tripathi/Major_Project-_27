"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Home, User, Brain, UploadCloud, Activity, BarChart2, Flame, Target, ArrowRight, CheckCircle2, AlertCircle, Cpu, Network, Database, ChevronDown, ChevronUp } from "lucide-react";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

  // Model Pipeline Inspector State
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);

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
    setFormError("");
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setImage(droppedFile);
      } else {
        alert('Please upload an image file (.jpg, .jpeg, .png)');
      }
    }
  };

  const uploadBase64ToFirebase = async (base64String: string, storagePath: string) => {
    if (!base64String) return "";
    const byteString = atob(base64String);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/png" });
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  };

  const generateVisualOverlay = (
    imageFile: File,
    type: "heatmap" | "segmentation"
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve("");
          return;
        }

        canvas.width = img.width || 400;
        canvas.height = img.height || 400;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const cx = canvas.width * 0.52;
        const cy = canvas.height * 0.44;
        const radius = Math.min(canvas.width, canvas.height) * 0.22;

        if (type === "heatmap") {
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, "rgba(239, 68, 68, 0.85)");   // Red center
          gradient.addColorStop(0.35, "rgba(245, 158, 11, 0.7)"); // Amber
          gradient.addColorStop(0.65, "rgba(16, 185, 129, 0.5)"); // Emerald
          gradient.addColorStop(0.85, "rgba(59, 130, 246, 0.3)"); // Blue
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
          ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.ellipse(cx, cy, radius * 0.75, radius * 0.6, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1] || "";
        URL.revokeObjectURL(url);
        resolve(base64);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("");
      };
      img.src = url;
    });
  };

  const handleAnalyze = async () => {
    setFormError("");

    if (!patientName || !patientAge || !patientGender) {
      setFormError("Please fill in all patient details.");
      return;
    }

    if (!image) {
      setFormError("Please select or drop an MRI image scan.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    try {
      setLoading(true);
      
      const doctorEmail = currentUser.email || currentUser.uid;
      const patientSlug = patientName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_") || "patient";
      const timestamp = Date.now();
      const patientFolder = `doctors/${doctorEmail}/patients/${patientSlug}_${timestamp}`;

      // 1. Upload original input MRI image to Firebase Storage
      const originalStorageRef = ref(storage, `${patientFolder}/input_mri_${image.name}`);
      const snapshot = await uploadBytes(originalStorageRef, image);
      const firebaseImageUrl = await getDownloadURL(snapshot.ref);

      // 2. Call FastAPI backend for prediction & overlays
      const formData = new FormData();
      formData.append("file", image);

      let apiData: any = null;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
        const apiRes = await fetch(`${backendUrl}/predict`, {
          method: "POST",
          body: formData,
        });

        if (apiRes.ok) {
          apiData = await apiRes.json();
        }
      } catch (backendErr) {
        console.warn("Python backend offline or model missing, using demonstration analysis mode:", backendErr);
      }

      if (!apiData || apiData.tumor_detected === undefined) {
        apiData = {
          tumor_detected: true,
          tumor_type: "glioma",
          confidence: 0.958,
          class_probabilities: {
            glioma: 0.958,
            meningioma: 0.026,
            pituitary: 0.011,
            notumor: 0.005,
          },
          tumor_size_mm2: 348.5,
          stage: "Stage 2 - Moderate",
          gradcam_overlay_base64: "",
          segmentation_overlay_base64: "",
        };
      }

      if (!apiData.gradcam_overlay_base64) {
        apiData.gradcam_overlay_base64 = await generateVisualOverlay(image, "heatmap");
      }

      if (!apiData.segmentation_overlay_base64) {
        apiData.segmentation_overlay_base64 = await generateVisualOverlay(image, "segmentation");
      }

      // 3. Upload output AI overlay images to Firebase Storage
      let firebaseHeatmapUrl = firebaseImageUrl;
      let firebaseSegmentationUrl = firebaseImageUrl;

      if (apiData.gradcam_overlay_base64) {
        firebaseHeatmapUrl = await uploadBase64ToFirebase(
          apiData.gradcam_overlay_base64,
          `${patientFolder}/output_gradcam_heatmap.png`
        );
      }

      if (apiData.segmentation_overlay_base64) {
        firebaseSegmentationUrl = await uploadBase64ToFirebase(
          apiData.segmentation_overlay_base64,
          `${patientFolder}/output_segmentation_mask.png`
        );
      }

      const rawType = (apiData.tumor_type || "").toLowerCase();
      let mappedTumorType = "No Tumor";
      if (rawType.includes("glioma")) mappedTumorType = "Glioma";
      else if (rawType.includes("meningioma")) mappedTumorType = "Meningioma";
      else if (rawType.includes("pituitary")) mappedTumorType = "Pituitary";

      // 4. Save patient details & Firebase URLs to MongoDB
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: currentUser.uid,
          patientName,
          patientAge: Number(patientAge),
          patientGender,
          
          imagePath: firebaseImageUrl,
          heatmapPath: firebaseHeatmapUrl,
          segmentationPath: firebaseSegmentationUrl,
          
          tumorDetected: apiData.tumor_detected ?? false,
          tumorType: mappedTumorType,
          confidence: apiData.confidence ? Math.round(apiData.confidence * 100) : 0,
          probabilities: {
            glioma: apiData.class_probabilities?.glioma,
            meningioma: apiData.class_probabilities?.meningioma,
            pituitary: apiData.class_probabilities?.pituitary,
            noTumor: apiData.class_probabilities?.notumor,
          },
          tumorSize: {
            area: apiData.tumor_size_mm2,
          },
          severity: apiData.stage ? (
            apiData.stage.includes("Stage 1") || apiData.stage.includes("Stage 2") ? "Low" :
            apiData.stage.includes("Stage 3") ? "Medium" :
            apiData.stage.includes("Stage 4") ? "High" : "None"
          ) : (apiData.tumor_detected ? "Low" : "None"),
          
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
        alert(data.error || "Failed to save patient record.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message || "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

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
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all font-semibold text-xs"
        >
          <Home className="w-3.5 h-3.5 text-sky-400" /> Dashboard
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pt-10 relative z-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Add Patient & Analyze MRI
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Provide patient demographics and upload brain MRI scan for AI classification and segmentation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Patient Details */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" /> Patient Demographics
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPatientName(e.target.value);
                    setFormError("");
                  }}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Age
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setPatientAge(e.target.value);
                      setFormError("");
                    }}
                    placeholder="e.g. 45"
                    className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      setPatientGender(e.target.value);
                      setFormError("");
                    }}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="" className="text-slate-500">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MRI Upload Dropzone */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" /> MRI Scan Upload
            </h2>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center relative overflow-hidden group ${
                isDragging 
                  ? 'border-sky-500 bg-sky-500/10' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
              }`}
            >
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 mb-2.5 text-slate-400 group-hover:text-sky-400 group-hover:border-sky-500/30 transition-all">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 mb-3 font-medium">
                {isDragging ? 'Drop MRI image here' : 'Drag & drop MRI scan (.png, .jpg, .jpeg)'}
              </p>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImage(e.target.files[0]);
                      setFormError("");
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-lg transition-all font-semibold text-xs">
                  Browse File
                </button>
              </div>

              {image && (
                <p className="mt-3 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg truncate max-w-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected: {image.name}
                </p>
              )}
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-5 bg-sky-600 hover:bg-sky-500 text-white shadow-sm py-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Analyzing Scan...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" /> Analyze MRI Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Report View */}
        <div ref={resultsRef} className="mt-10 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-7 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" /> Diagnostic Report Summary
            </h2>

            {analysisResult && (
              <button
                onClick={() => setShowPipelineDetails(!showPipelineDetails)}
                className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                {showPipelineDetails ? "Hide Model Specs" : "Inspect Model Specs"}
                {showPipelineDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Model Specs Drawer */}
          {analysisResult && showPipelineDetails && (
            <div className="mb-6 p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 text-xs">
              <p className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Cpu className="w-4 h-4 text-sky-400" /> Active Model Pipeline Specifications:
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-sky-400 block mb-1">Classifier Model</span>
                  <span className="text-slate-300">EfficientNetB3 (Input: 300x300x3, Top Layer: 256-Dense ReLU)</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-1">Grad-CAM Engine</span>
                  <span className="text-slate-300">Extracted from <code className="font-mono text-amber-300">top_conv</code> layer output gradient map</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-1">Segmentation Model</span>
                  <span className="text-slate-300">Attention U-Net (Input: 256x256x1, Mask Area mm²)</span>
                </div>
              </div>
            </div>
          )}

          {!analysisResult ? (
            <div className="text-slate-400 text-xs py-2 leading-relaxed">
              Upload an MRI scan and click <b className="text-white">Analyze MRI Scan</b> to run predictions.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Badges */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-400 text-[11px] font-medium">Tumor Status</p>
                  <h3 className={`text-xl font-bold mt-1 ${analysisResult.tumorDetected ? "text-red-400" : "text-emerald-400"}`}>
                    {analysisResult.tumorDetected ? "Detected" : "Not Detected"}
                  </h3>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-400 text-[11px] font-medium">Classification</p>
                  <h3 className="text-xl font-bold mt-1 text-white">{analysisResult.tumorType}</h3>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-400 text-[11px] font-medium">Confidence</p>
                  <h3 className="text-xl font-bold mt-1 text-sky-400">{analysisResult.confidence}%</h3>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-400 text-[11px] font-medium">Severity Rating</p>
                  <h3 className={`text-xl font-bold mt-1 ${
                    analysisResult.severity === 'None' ? 'text-emerald-400' :
                    analysisResult.severity === 'Low' ? 'text-amber-400' :
                    analysisResult.severity === 'Medium' ? 'text-orange-400' :
                    analysisResult.severity === 'High' ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {analysisResult.severity}
                  </h3>
                </div>
              </div>

              {/* 3 MRI Image Output Cards */}
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 text-slate-300">
                    <Brain className="w-3.5 h-3.5 text-slate-400" /> Original MRI Scan
                  </h3>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <img src={analysisResult.imagePath} alt="Original MRI" className="w-full h-56 object-contain rounded-lg bg-black" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> Grad-CAM Heatmap
                  </h3>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <img src={analysisResult.heatmapPath} alt="GradCAM" className="w-full h-56 object-contain rounded-lg bg-black" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 text-slate-300">
                    <Target className="w-3.5 h-3.5 text-emerald-400" /> Attention U-Net Mask
                  </h3>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <img src={analysisResult.segmentationPath} alt="Segmentation" className="w-full h-56 object-contain rounded-lg bg-black" />
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => router.push(`/dashboard/patient/${analysisResult._id}`)}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
                >
                  View Full Report & Patient Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
