

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaHome } from "react-icons/fa";
import { auth } from "@/firebase";

export default function AddPatientPage() {
  const router = useRouter();

  // Patient Details
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");

  // MRI Image
 const [image, setImage] = useState(null);
  // Loading State
  const [loading, setLoading] = useState(false);

  // Save Patient to MongoDB
  
  const handleAnalyze = async () => {
    // Validation
    if (!patientName || !patientAge || !patientGender) {
      alert("Please fill all patient details.");
      return;
    }

    if (!image) {
      alert("Please select an MRI image.");
      return;
    }

    // Logged in doctor
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      setLoading(true);
      
      // upload mri image to flask backed
      const formData = new FormData();
  formData.append("image", image);

  const flaskResponse = await fetch("http://127.0.0.1:5000/predict", {
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
          doctorId: user.uid,

          patientName,
          patientAge: Number(patientAge),
          patientGender,

  //        // Image URL from Flask
  //       imagePath: flaskData.imageUrl,
  //       // heatmap
  //       heatmapPath: flaskData.heatmapUrl,

  //         //values from prediction flask
  //        tumorDetected: flaskData.tumorDetected,
  // tumorType: flaskData.tumorType,
  // confidence: flaskData.confidence,

  // probabilities: flaskData.probabilities,

  //         status: "Completed",
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
        alert("Patient added successfully!");

        router.push("/dashboard");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-4xl font-bold text-blue-500">
              Add Patient
            </h1>

            <p className="text-slate-400 mt-3 text-lg">
              Enter patient information and upload MRI scan for analysis.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl shadow-lg transition"
          >
            <FaHome />
            Dashboard
          </button>

        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Patient Details */}
          <div className="bg-slate-900 rounded-3xl shadow-xl p-8">

            <h2 className="text-2xl font-semibold mb-6">
              👨‍⚕️ Patient Information
            </h2>

            <div className="space-y-5">

              <div>
                <label className="block mb-2 text-slate-300">
                  Patient Name
                </label>

                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-slate-300">
                  Age
                </label>

                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Enter age"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-slate-300">
                  Gender
                </label>

                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>

              </div>

            </div>

          </div>

          {/* MRI Upload */}
          <div className="bg-slate-900 rounded-3xl shadow-xl p-8">

            <h2 className="text-2xl font-semibold mb-6">
              🧠 MRI Scan Upload
            </h2>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center">

              <div className="text-6xl mb-4">
                📁
              </div>

              <p className="text-slate-400 mb-6">
                Upload MRI image (.jpg, .jpeg, .png)
              </p>

              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setImage(e.target.files[0])}
              />

              {image && (
                <p className="mt-4 text-green-400">
                  Selected: {image.name}
                </p>
              )}

            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-lg font-semibold transition disabled:bg-slate-600"
            >
              {loading ? "Saving..." : "🔬 Analyze MRI"}
            </button>

          </div>

        </div>

        {/* Future Result */}
        <div className="mt-10 bg-slate-900 rounded-3xl shadow-xl p-8">

          <h2 className="text-2xl font-semibold mb-5">
            📊 MRI Analysis Report
          </h2>

          <div className="text-slate-400">

            Upload an MRI scan and click <b>Analyze MRI</b> to generate:

            <ul className="list-disc ml-6 mt-4 space-y-2">

              <li>Tumor Detection</li>
              <li>Tumor Type</li>
              <li>Confidence Score</li>
              <li>Probability Distribution</li>
              <li>Heatmap Visualization</li>
              <li>PDF Report</li>

            </ul>

          </div>

        </div>

      </div>
    </div>
  );
}


