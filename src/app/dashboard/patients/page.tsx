"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { FaHome, FaUserInjured } from "react-icons/fa";

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



  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-blue-500">
          BrainTumorAI
        </h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl transition"
        >
          <FaHome />
          Dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto p-8">

        {/* Heading */}
        <div className="flex justify-between items-center mb-10">

          <div>
            <h2 className="text-4xl font-bold">
              Patient Records
            </h2>

            <p className="text-slate-400 mt-2">
              View all previously analyzed patient reports.
            </p>
          </div>

          <div className="bg-slate-900 px-6 py-4 rounded-2xl shadow-lg">
            <p className="text-slate-400">
              Total Patients
            </p>

            <h3 className="text-3xl font-bold text-blue-500">
              {patients.length}
            </h3>
          </div>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-slate-900 rounded-3xl p-10 text-center">
            <p className="text-slate-400 text-lg">
              Loading patient records...
            </p>
          </div>
        ) : patients.length === 0 ? (

          /* Empty State */
          <div className="bg-slate-900 rounded-3xl p-12 text-center shadow-xl">

            <div className="text-6xl mb-5">
              📂
            </div>

            <h2 className="text-2xl font-bold mb-3">
              No Patient Records Found
            </h2>

            <p className="text-slate-400 mb-8">
              Add your first patient to begin MRI analysis.
            </p>

            <button
              onClick={() => router.push("/dashboard/add-patient")}
              className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-xl transition"
            >
              ➕ Add Patient
            </button>

          </div>

        ) : (

          /* Patient Cards */
          <div className="grid md:grid-cols-2 gap-6">

            {patients.map((patient) => (

              <div
                key={patient._id}
                className="bg-slate-900 rounded-3xl p-6 shadow-xl hover:scale-[1.02] hover:bg-slate-800 transition"
              >

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <div className="bg-blue-600 p-3 rounded-full">
                      <FaUserInjured />
                    </div>

                    <div>

                      <h3 className="text-2xl font-bold">
                        {patient.patientName}
                      </h3>

                      <p className="text-slate-400">
                        {patient.patientGender}
                      </p>

                    </div>

                  </div>

                  <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                    {patient.status}
                  </span>

                </div>

                <div className="mt-6 space-y-2 text-slate-300">

                  <p>
                    <b>Age:</b> {patient.patientAge}
                  </p>

                  <p>
                    <b>Tumor:</b> {patient.tumorType}
                  </p>

                  <p>
                    <b>Confidence:</b> {patient.confidence}%
                  </p>

                </div>

                {/* <button
                  onClick={() =>
                    router.push(`/dashboard/patient/${patient._id}`)
                  }
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition"
                  >
                  View Details →
                </button>
              
              {/* delete button */}
              

            <div className="mt-6 grid grid-cols-2 gap-3">

  <button
    onClick={() =>
      router.push(`/dashboard/patient/${patient._id}`)
    }
    className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition"
  >
    View Details
  </button>

  <button
    onClick={() => deletePatient(patient._id)}
    className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-medium transition"
  >
    Delete
  </button>

</div>


            </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}