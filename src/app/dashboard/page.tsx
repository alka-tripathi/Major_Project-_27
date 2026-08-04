
"use client";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();

  // const [patients, setPatients] = useState([]);
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-blue-500">
          BrainTumorAI
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-4xl font-bold mb-2">
          Welcome, Doctor 👨‍⚕️
        </h2>

        <p className="text-slate-400 mb-10">
          Upload MRI scans and detect brain tumors with AI assistance.
        </p>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              📊 Prediction Result
            </h3>
            <p className="text-slate-400 mb-6">
              View AI-generated tumor classification.
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl">
              View Result
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              📜 Patient Records
            </h3>
            <p className="text-slate-400 mb-6">
              Access previous diagnosis history.
            </p>
            <button
           onClick={() => router.push("/dashboard/patients")}
            className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl"
>
          View Records
         </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              ➕ Add Patient
            </h3>

            <p className="text-slate-400 mb-6">
              Create a new patient record before MRI analysis.
            </p>

            <button
              onClick={() => router.push("/dashboard/add-patient")}
              className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-xl"
            >
              Add Patient
            </button>
          </div>
        </div>

        {/* Patient Records */}
        {/* <div className="mt-12 bg-slate-900 rounded-3xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-6">
            Patient Records
          </h2>

          {loading ? (
            <p className="text-slate-400">
              Loading records...
            </p>
          ) : patients.length === 0 ? (
            <p className="text-slate-400">
              No patient records found.
            </p>
          ) : (
            <div className="space-y-4">
              {patients.map((p) => (
                <div
                  key={p._id}
                  className="bg-slate-800 p-4 rounded-xl"
                >
                  <p>
                    <b>Name:</b> {p.patientName}
                  </p>
                  <p>
                    <b>Age:</b> {p.patientAge}
                  </p>
                  <p>
                    <b>Type:</b> {p.tumorType}
                  </p>
                  <p>
                    <b>Confidence:</b> {p.confidence}%
                  </p>
                  <p>
                    <b>Status:</b> {p.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div> */}
        {/* Patient Records */}
<div className="mt-12 bg-slate-900 rounded-3xl p-8 shadow-xl">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-3xl font-bold">
      Patient Records
    </h2>

    <button
      onClick={() => router.push("/dashboard/patients")}
      className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg"
    >
      View All
    </button>
  </div>

  {loading ? (
    <p className="text-slate-400">
      Loading records...
    </p>
  ) : patients.length === 0 ? (
    <p className="text-slate-400">
      No patient records found.
    </p>
  ) : (
    <div className="space-y-4">
      {patients.map((p, index) => (
        <div
          key={p._id}
          className="bg-slate-800 p-5 rounded-xl flex justify-between items-center"
        >
          <div>
            <p className="text-lg font-semibold">
              {index + 1}. {p.patientName}
            </p>

            <p className="text-slate-300 mt-2">
              <b>Tumor Detected:</b>{" "}
              {p.tumorType === "No Tumor" ||
              p.tumorType === "notumor" ? (
                <span className="text-green-400 font-semibold">
                  No
                </span>
              ) : (
                <span className="text-red-400 font-semibold">
                  Yes
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() =>
              router.push(`/dashboard/patient/${p._id}`)
            }
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
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