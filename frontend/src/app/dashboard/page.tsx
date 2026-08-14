"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Stethoscope, FileText, UserPlus, ArrowRight, LogOut, User, Brain, AlertTriangle, CheckCircle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

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
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const totalPatients = patients.length;
  const tumorDetectedCount = patients.filter((p) => p.tumorDetected).length;
  const normalScansCount = patients.filter((p) => !p.tumorDetected).length;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden flex flex-col justify-between pb-12 font-sans">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all font-semibold text-xs shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-sky-400" /> Doctor Profile
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all font-semibold text-xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full px-8 pt-10 relative z-10 flex-1">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Clinical Dashboard
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Upload MRI scans, perform AI diagnostic segmentation, and review patient histories.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/add-patient")}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.98] self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Add Patient & Analyze MRI
          </button>
        </div>

        {/* Analytics Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Patients</p>
              <h3 className="text-3xl font-bold mt-1 text-sky-400">{totalPatients}</h3>
            </div>
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tumors Detected</p>
              <h3 className="text-3xl font-bold mt-1 text-red-400">{tumorDetectedCount}</h3>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Normal Scans</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-400">{normalScansCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Modules */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          <div 
            onClick={() => router.push("/dashboard/add-patient")}
            className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 rounded-xl p-6 backdrop-blur-sm group transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Analyze New MRI Scan</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Upload MRI files for multi-class classification and Attention U-Net tumor segmentation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 group-hover:text-sky-300">
              Start Scan Analysis <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => router.push("/dashboard/patients")}
            className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 rounded-xl p-6 backdrop-blur-sm group transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Patient Records</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Browse, search, and manage historical patient diagnostic reports and MRI scans.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              View Directory <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => router.push("/dashboard/profile")}
            className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 rounded-xl p-6 backdrop-blur-sm group transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Doctor Profile</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Update credentials, hospital affiliation, phone number, and profile photo.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              Edit Credentials <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Recent Patient Records Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> Recent Diagnostic Reports
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Latest MRI evaluations processed for your patients.</p>
            </div>

            <button
              onClick={() => router.push("/dashboard/patients")}
              className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 px-3.5 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-2 text-xs"
            >
              View All Records <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <p className="text-slate-400 text-xs">No patient records found.</p>
              <button
                onClick={() => router.push("/dashboard/add-patient")}
                className="mt-2 text-sky-400 hover:text-sky-300 text-xs font-semibold transition-colors"
              >
                + Add your first patient
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {patients.slice(0, 5).map((p, index) => (
                <div
                  key={p._id}
                  className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {p.patientName} <span className="text-slate-500 font-normal">({p.patientAge} y/o, {p.patientGender})</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Scan Date: {new Date(p.scanDate || p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      {p.tumorDetected ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20 text-[11px] inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          {p.tumorType || "Tumor Detected"} ({p.confidence}%)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[11px] inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          No Tumor Detected
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/patient/${p._id}`)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold border border-slate-800"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-8 pt-8 text-center text-slate-600 text-xs relative z-10">
        © 2026 BrainTumorAI. Clinical Medical Information System.
      </footer>
    </div>
  );
}