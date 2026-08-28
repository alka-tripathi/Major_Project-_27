"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, UserPlus, ArrowRight, LogOut, User, Brain, AlertTriangle, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden flex flex-col justify-between pb-16 font-sans">
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

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all font-semibold text-xs shadow-sm"
          >
            <User className="w-4 h-4 text-sky-400" /> Doctor Profile
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl transition-all font-semibold text-xs"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      {/* Main Container - Widescreen & Breathable */}
      <main className="max-w-[1360px] mx-auto w-full px-8 lg:px-16 pt-12 relative z-10 flex-1 space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Clinical Dashboard
            </h1>
            <p className="text-slate-400 text-sm lg:text-base mt-2">
              Analyze brain MRI scans, view diagnostic reports, and manage patient records.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/add-patient")}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2.5 text-xs active:scale-[0.98] self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Add Patient & Analyze MRI
          </button>
        </div>

        {/* 3 Large Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/70 border border-slate-800/80 p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Patients</p>
              <h3 className="text-3xl lg:text-4xl font-black mt-2 text-sky-400">{totalPatients}</h3>
            </div>
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
              <User className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tumors Detected</p>
              <h3 className="text-3xl lg:text-4xl font-black mt-2 text-red-400">{tumorDetectedCount}</h3>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Normal Scans</p>
              <h3 className="text-3xl lg:text-4xl font-black mt-2 text-emerald-400">{normalScansCount}</h3>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action Modules */}
        <div className="grid md:grid-cols-2 gap-6">
          <div 
            onClick={() => router.push("/dashboard/add-patient")}
            className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-8 lg:p-10 backdrop-blur-sm group transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyze New MRI Scan</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload MRI files for multi-class neural classification and Attention U-Net tumor segmentation.
              </p>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-400 group-hover:text-sky-300 pt-2">
              Start Scan Analysis <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div 
            onClick={() => router.push("/dashboard/patients")}
            className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-8 lg:p-10 backdrop-blur-sm group transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Patient Records Directory</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Browse, search, and manage historical patient diagnostic reports, scan dates, and clinical evaluations.
              </p>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 pt-2">
              View Patient Directory <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Recent Patient Records Table */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sky-400" /> Recent Diagnostic Reports
              </h2>
              <p className="text-slate-400 text-xs mt-1">Latest MRI evaluations processed for your patients.</p>
            </div>

            <button
              onClick={() => router.push("/dashboard/patients")}
              className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 px-4 py-2 rounded-xl transition-all font-medium flex items-center gap-2 text-xs"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <p className="text-slate-400 text-sm">No patient records found.</p>
              <button
                onClick={() => router.push("/dashboard/add-patient")}
                className="mt-3 text-sky-400 hover:text-sky-300 text-xs font-semibold transition-colors"
              >
                + Add your first patient
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.slice(0, 5).map((p, index) => (
                <div
                  key={p._id}
                  onClick={() => router.push(`/dashboard/patient/${p._id}`)}
                  className="bg-slate-950/80 border border-slate-800/80 p-4 lg:p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {p.patientName} <span className="text-slate-500 font-normal">({p.patientAge} y/o, {p.patientGender})</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scan Date: {new Date(p.scanDate || p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      {p.tumorDetected ? (
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 font-medium border border-red-500/20 text-xs inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {p.tumorType}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 text-xs inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Normal Scan
                        </span>
                      )}
                    </div>

                    <button className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5">
                      View Report <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}