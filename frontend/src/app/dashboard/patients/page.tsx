"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { Home, User, FolderOpen, Plus, Trash2, Search } from "lucide-react";

interface Patient {
  _id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  tumorType: string;
  confidence: number;
  status: string;
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


      const res = await fetch(
        "/api/patients?doctorId=" + user.uid
      );

      const data = await res.json();

      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // for delete patient details
  const deletePatient = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/patients/" + id, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Patient deleted successfully.");
        // Refresh patient list
        fetchPatients();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to delete patient.");
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="max-w-6xl mx-auto px-8 pt-12 relative z-10">

        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">

          <div>
            <h2 className="text-4xl font-bold">
              Patient Records
            </h2>
            <p className="text-zinc-400 mt-2">
              View all previously analyzed patient reports.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center min-w-[150px]">
            <p className="text-zinc-400 text-sm font-medium mb-1">
              Total Patients
            </p>
            <h3 className="text-3xl font-bold text-blue-500">
              {patients.length}
            </h3>
          </div>

        </div>

        {/* Search Bar */}
        <div className="mb-10 flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 text-white placeholder-zinc-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-zinc-400 text-lg">
              Loading patient records...
            </p>
          </div>
        ) : patients.length === 0 ? (

          /* Empty State */
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-16 text-center shadow-xl flex flex-col items-center justify-center backdrop-blur-sm">

            <div className="p-5 bg-zinc-900/80 rounded-full border border-zinc-800 mb-6 text-zinc-500">
              <FolderOpen className="w-12 h-12" />
            </div>

            <h2 className="text-2xl font-bold mb-3">
              No Patient Records Found
            </h2>

            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
              Add your first patient to begin MRI analysis and manage their records securely.
            </p>

            <button
              onClick={() => router.push("/dashboard/add-patient")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] font-semibold text-white"
            >
              <Plus className="w-5 h-5" /> Add Patient
            </button>

          </div>

        ) : (

          /* Patient Cards */
          <div className="grid md:grid-cols-2 gap-6">

            {filteredPatients.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-zinc-400">
                No patients found matching "{searchQuery}"
              </div>
            ) : (
              filteredPatients.map((patient) => (

              <div
                key={patient._id}
                className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:border-zinc-700 transition-all flex flex-col"
              >

                <div className="flex justify-between items-start mb-6">

                  <div className="flex items-center gap-4">

                    <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl text-blue-400">
                      <User className="w-6 h-6" />
                    </div>

                    <div>

                      <h3 className="text-2xl font-bold tracking-tight">
                        {patient.patientName}
                      </h3>

                      <p className="text-zinc-400 text-sm mt-1">
                        {patient.patientGender}
                      </p>

                    </div>

                  </div>

                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                    {patient.status}
                  </span>

                </div>

                <div className="space-y-3 text-zinc-300 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 mb-6">
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Age</span>
                    <span className="font-medium">{patient.patientAge} yrs</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tumor</span>
                    <span className="font-medium">{patient.tumorType}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Confidence</span>
                    <span className="font-medium text-blue-400">{patient.confidence}%</span>
                  </div>

                </div>
              
                <div className="mt-auto grid grid-cols-3 gap-3">

                  <button
                    onClick={() =>
                      router.push(`/dashboard/patient/${patient._id}`)
                    }
                    className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors shadow-sm"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => deletePatient(patient._id)}
                    className="col-span-1 flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>

              ))
            )}

          </div>

        )}

      </div>

    </div>
  );
}