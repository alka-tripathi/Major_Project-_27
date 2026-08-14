"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Home, User, FolderOpen, Plus, Trash2, Search, Brain, ArrowRight } from "lucide-react";

interface Patient {
  _id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  tumorType: string;
  tumorDetected?: boolean;
  confidence: number;
  status: string;
  scanDate?: string;
  createdAt?: string;
}

export default function PatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/patients?doctorId=" + user.uid);
      const data = await res.json();

      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient record?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/patients/" + id, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setPatients((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert(data.error || "Failed to delete patient.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete patient.");
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.tumorType || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Patient Directory
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Search and review all historical MRI scans analyzed under your account.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Total Records:</span>
              <span className="text-lg font-bold text-sky-400">{patients.length}</span>
            </div>

            <button
              onClick={() => router.push("/dashboard/add-patient")}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add Patient
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search patients by name or tumor type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent mb-3"></div>
            <p className="text-slate-400 text-xs font-medium">Loading patient directory...</p>
          </div>
        ) : patients.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center backdrop-blur-md">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-3 text-slate-500">
              <FolderOpen className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold text-white mb-1">No Patient Records Found</h2>
            <p className="text-slate-400 text-xs mb-5 max-w-sm mx-auto">
              Add your first patient to begin MRI analysis and store diagnostic history in MongoDB.
            </p>

            <button
              onClick={() => router.push("/dashboard/add-patient")}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 px-5 py-2.5 rounded-lg transition-all shadow-sm font-semibold text-xs text-white"
            >
              <Plus className="w-4 h-4" /> Add New Patient
            </button>
          </div>
        ) : (
          /* Patient Directory Grid */
          <div className="grid md:grid-cols-2 gap-5">
            {filteredPatients.length === 0 ? (
              <div className="col-span-2 text-center py-10 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs font-medium">
                No patients found matching "{searchQuery}"
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient._id}
                  className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl text-sky-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {patient.patientName}
                          </h3>
                          <p className="text-slate-400 text-xs mt-0.5 font-medium">
                            {patient.patientAge} y/o • {patient.patientGender}
                          </p>
                        </div>
                      </div>

                      {patient.tumorType === "No Tumor" || patient.tumorType === "notumor" ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                          No Tumor
                        </span>
                      ) : (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                          {patient.tumorType || "Tumor Detected"}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60 mb-5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Confidence Rating</span>
                        <span className="font-bold text-sky-400">{patient.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Evaluation Status</span>
                        <span className="font-semibold text-emerald-400">{patient.status || "Completed"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Scan Date</span>
                        <span className="text-slate-300 font-medium">
                          {new Date(patient.scanDate || patient.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <button
                      onClick={() => router.push(`/dashboard/patient/${patient._id}`)}
                      className="col-span-3 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded-lg font-semibold transition-all shadow-sm text-xs flex items-center justify-center gap-2"
                    >
                      View Diagnostics <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deletePatient(patient._id)}
                      className="col-span-1 flex items-center justify-center border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg transition-all"
                      title="Delete Patient Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}