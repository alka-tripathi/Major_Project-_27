"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminAuth";
import { Home, Users, Activity, Loader2, Mail, Phone, Building, LayoutDashboard, Cpu } from "lucide-react";
import ModelTrainingView from "./ModelTrainingView";

export default function AdminDashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "training">("overview");

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!isAdmin(currentUser.email)) {
          router.push("/dashboard"); // Redirect non-admins
          return;
        }
        setUser(currentUser);
        if (currentUser.email) {
          await fetchDoctors(currentUser.email);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDoctors = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/doctors?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      
      if (data.success) {
        setDoctors(data.data || []);
      } else {
        setError(data.error || "Failed to fetch doctors");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-hidden pb-12">
      {/* Background Animated Grid */}
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
          <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-md uppercase tracking-wider font-semibold border border-red-500/30">
            Admin
          </span>
        </h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 px-5 py-2.5 rounded-xl transition-colors font-medium text-sm shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-8 pt-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">System Administration</h1>
          <p className="text-zinc-400 text-lg">Manage registered doctors and monitor system activity.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-10 border-b border-zinc-800/50 pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-medium ${
              activeTab === "overview"
                ? "bg-zinc-900/80 text-blue-400 border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("training")}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-medium ${
              activeTab === "training"
                ? "bg-zinc-900/80 text-blue-400 border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Model Training
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Registered Doctors</p>
                <h3 className="text-3xl font-bold mt-1">{doctors.length}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">System Status</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-400">Online & Active</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            Doctor Directory
          </h2>

          {error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              <p className="text-zinc-400 text-lg">No doctors registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                    <th className="pb-4 font-medium px-4">Doctor</th>
                    <th className="pb-4 font-medium px-4">Contact</th>
                    <th className="pb-4 font-medium px-4">Hospital / Clinic</th>
                    <th className="pb-4 font-medium px-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {doctors.map((doc) => (
                    <tr key={doc._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                            {doc.profilePic ? (
                              <img src={doc.profilePic} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-zinc-400 font-semibold text-sm">
                                {doc.name ? doc.name.charAt(0).toUpperCase() : "?"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-100">{doc.name || "Unknown"}</p>
                            <p className="text-xs text-zinc-500">{doc.specialization || "Neurology"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-zinc-300">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            {doc.email}
                          </div>
                          {doc.phone && (
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Phone className="w-3.5 h-3.5 text-zinc-500" />
                              {doc.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Building className="w-4 h-4 text-zinc-500" />
                          {doc.hospitalName || "Not specified"}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-zinc-400">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
        ) : (
          <ModelTrainingView />
        )}
      </div>
    </div>
  );
}
