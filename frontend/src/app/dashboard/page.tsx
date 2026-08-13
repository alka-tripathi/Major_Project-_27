"use client";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Stethoscope, BarChart2, FileText, UserPlus, ArrowRight, LogOut, User } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Fetch patients from MongoDB
  const fetchPatients = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.log("User not logged in");
        setLoading(false);
        return;
      }

      const res = await fetch(
        "/api/patients?doctorId=" + user.uid
      );

      const data = await res.json();

      if (data.success) {
        setPatients(data.data || []);
      } else {
        console.log(data.error);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 px-5 py-2 rounded-xl transition-colors font-medium text-sm shadow-sm"
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-5 py-2 rounded-xl transition-all font-medium text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 pt-12 relative z-10">
        <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
          Welcome, Doctor <Stethoscope className="w-8 h-8 text-blue-500" />
        </h2>

        <p className="text-zinc-400 mb-10 text-lg">
          Upload MRI scans and detect brain tumors with AI assistance.
        </p>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm group hover:border-blue-500/50 transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3 relative z-10">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-6 h-6" />
                </div>
                Prediction Result
              </h3>
              <p className="text-zinc-400 mb-8 relative z-10">
                View AI-generated tumor classification.
              </p>
            </div>
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 py-3 rounded-xl transition-colors font-medium relative z-10">
              View Result
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm group hover:border-blue-500/50 transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3 relative z-10">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                Patient Records
              </h3>
              <p className="text-zinc-400 mb-8 relative z-10">
                Access previous diagnosis history.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/patients")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 py-3 rounded-xl transition-colors font-medium relative z-10"
            >
              View Records
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm group hover:border-blue-500/50 transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3 relative z-10">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                Add Patient
              </h3>
              <p className="text-zinc-400 mb-8 relative z-10">
                Create a new patient record before MRI analysis.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/add-patient")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] py-3 rounded-xl transition-all font-medium relative z-10"
            >
              Add Patient
            </button>
          </div>
        </div>

        {/* Patient Records Section */}
        <div className="mt-12 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-7 h-7 text-blue-400" />
              Recent Records
            </h2>

            <button
              onClick={() => router.push("/dashboard/patients")}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-5 py-2.5 rounded-xl transition-colors font-medium flex items-center gap-2 text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              <p className="text-zinc-400 text-lg">No patient records found.</p>
              <button
                onClick={() => router.push("/dashboard/add-patient")}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                + Add your first patient
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((p, index) => (
                <div
                  key={p._id}
                  className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <span className="text-zinc-500 text-sm font-medium">{index + 1}.</span> 
                      {p.patientName}
                    </p>

                    <p className="text-zinc-400 mt-2 text-sm flex items-center gap-2">
                      Tumor Detected:
                      {p.tumorType === "No Tumor" ||
                      p.tumorType === "notumor" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-xs">
                          No
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20 text-xs">
                          Yes
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      router.push(`/dashboard/patient/${p._id}`)
                    }
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-2 rounded-xl transition-colors text-sm font-medium border border-zinc-700 w-full sm:w-auto"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








// "use client";

// import { signOut } from "firebase/auth";
// import { auth } from "../../firebase";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { Stethoscope, BarChart2, FileText, UserPlus } from "lucide-react";

// export default function DashboardPage() {
//   const router = useRouter();

//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const handleLogout = async () => {
//     await signOut(auth);
//     router.push("/login");
//   };

//   // 🔥 Fetch patients from MongoDB
//   const fetchPatients = async () => {
//     try {
//       const user = auth.currentUser;

//       const res = await fetch("/api/patients?doctorId=" + user.uid);
//       const data = await res.json();

//       setPatients(data.data || []);
//       setLoading(false);
//     } catch (err) {
//       console.log(err);
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPatients();
//   }, []);

//   return (
//     <div className="min-h-screen bg-slate-950 text-white">
//       {/* Navbar */}
//       <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
//         <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
//           BrainTumorAI
//         </h1>

//         <button
//           onClick={handleLogout}
//           className="px-5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
//         >
//           Logout
//         </button>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-6xl mx-auto p-8">
//         <h2 className="text-4xl font-bold mb-3 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
//           Welcome, Doctor <Stethoscope className="w-8 h-8 text-indigo-400" />
//         </h2>

//         <p className="text-slate-400 mb-10 text-lg">
//           Upload MRI scans and detect brain tumors with AI assistance.
//         </p>

//         {/* Cards */}
//        <div className="grid md:grid-cols-3 gap-8">
//           {/* <div className="bg-slate-900 rounded-3xl p-8 shadow-xl">
//             <h3 className="text-2xl font-semibold mb-4">
//               🧠 Upload MRI Scan
//             </h3>
//             <p className="text-slate-400 mb-6">
//               Upload patient MRI images for analysis.
//             </p>
//             <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl">
//               Upload Image
//             </button>
//           </div> */}

//           <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm group hover:border-slate-700 transition-colors flex flex-col h-full">
//             <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-slate-100">
//               <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
//                 <BarChart2 className="w-6 h-6" />
//               </div>
//               Prediction Result
//             </h3>
//             <p className="text-slate-400 text-sm mb-6 flex-grow">
//               View AI-generated tumor classification.
//             </p>
//             <button className="w-full mt-auto border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 py-3 rounded-xl transition-all font-medium">
//               View Result
//             </button>
//           </div>

//           <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm group hover:border-slate-700 transition-colors flex flex-col h-full">
//             <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-slate-100">
//               <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
//                 <FileText className="w-6 h-6" />
//               </div>
//               Patient Records
//             </h3>
//             <p className="text-slate-400 text-sm mb-6 flex-grow">
//               Access previous diagnosis history.
//             </p>
//             <button className="w-full mt-auto border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 py-3 rounded-xl transition-all font-medium">
//               View Records
//             </button>
//           </div>

//           {/* Add Patient */}
//           <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm group hover:border-slate-700 transition-colors flex flex-col h-full">
//             <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-slate-100">
//               <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
//                 <UserPlus className="w-6 h-6" />
//               </div>
//               Add Patient
//             </h3>

//             <p className="text-slate-400 text-sm mb-6 flex-grow">
//               Create a new patient record before MRI analysis.
//             </p>

//             <button
//               onClick={() => router.push("/dashboard/add-patient")}
//               className="w-full mt-auto border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 py-3 rounded-xl transition-all font-medium"
//             >
//               Add Patient
//             </button>
//           </div>
//         </div>

//         {/* 🧠 REAL PATIENT RECORDS SECTION */}
//         <div className="mt-12 bg-slate-900 rounded-3xl p-8 shadow-xl">
//           <h2 className="text-3xl font-bold mb-6">
//             Patient Records
//           </h2>

//           {loading ? (
//             <p className="text-slate-400">Loading records...</p>
//           ) : patients.length === 0 ? (
//             <p className="text-slate-400">No patient records found.</p>
//           ) : (
//             <div className="space-y-4">
//               {patients.map((p) => (
//                 <div
//                   key={p._id}
//                   className="bg-slate-800 p-4 rounded-xl"
//                 >
//                   <p><b>Name:</b> {p.patientName}</p>
//                   <p><b>Age:</b> {p.patientAge}</p>
//                   <p><b>Type:</b> {p.tumorType}</p>
//                   <p><b>Confidence:</b> {p.confidence}%</p>
//                   <p><b>Status:</b> {p.status}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }