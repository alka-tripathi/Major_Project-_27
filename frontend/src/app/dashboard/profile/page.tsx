"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Camera, Home, Loader2, Save, User, Brain, CheckCircle2, AlertCircle } from "lucide-react";

export default function DoctorProfilePage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hospitalName: "",
    specialization: "",
    profilePic: "",
  });

  const [totalPatients, setTotalPatients] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchDoctorProfile(currentUser);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDoctorProfile = async (currentUser: any) => {
    try {
      const res = await fetch(`/api/doctors/profile?firebaseUid=${currentUser.uid}`);
      const data = await res.json();
      
      let initialFirstName = "";
      let initialLastName = "";

      if (currentUser.displayName) {
        const parts = currentUser.displayName.split(" ");
        initialFirstName = parts[0];
        initialLastName = parts.slice(1).join(" ");
      }

      if (data.success && data.doctor) {
        setTotalPatients(data.doctor.totalPatients || 0);
        setFormData({
          firstName: data.doctor.firstName || initialFirstName,
          lastName: data.doctor.lastName || initialLastName,
          email: data.doctor.email || currentUser.email || "",
          phone: data.doctor.phone || "",
          hospitalName: data.doctor.hospitalName || "",
          specialization: data.doctor.specialization || "Neurology",
          profilePic: data.doctor.profilePic || currentUser.photoURL || "",
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          firstName: initialFirstName,
          lastName: initialLastName,
          email: currentUser.email || "",
          profilePic: currentUser.photoURL || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setFormData((prev) => ({
        ...prev,
        email: currentUser.email || "",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    const file = e.target.files[0];
    setUploading(true);

    try {
      const doctorFolder = user.email || user.uid;
      const storageRef = ref(storage, `profiles/${doctorFolder}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {},
        (error) => {
          console.error("Upload error:", error);
          setStatusMsg({ text: "Error uploading image", type: "error" });
          setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData((prev) => ({ ...prev, profilePic: downloadURL }));
          setUploading(false);
        }
      );
    } catch (error) {
      console.error("Upload setup error:", error);
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const res = await fetch("/api/doctors/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          ...formData,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setStatusMsg({ text: "Profile updated successfully!", type: "success" });
      } else {
        setStatusMsg({ text: "Failed to update profile", type: "error" });
      }
    } catch (error: any) {
      setStatusMsg({ text: "Error updating profile", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-sky-500 animate-spin" />
      </div>
    );
  }

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

      <main className="max-w-4xl mx-auto px-8 pt-10 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Doctor Profile & Credentials
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage your personal profile, hospital affiliation, and contact details.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-7 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-3 shrink-0 w-full md:w-auto">
              <div 
                className="relative w-32 h-32 rounded-full border-2 border-slate-800 overflow-hidden bg-slate-950 group cursor-pointer flex items-center justify-center shadow-md"
                onClick={handleImageClick}
              >
                {formData.profilePic ? (
                  <img 
                    src={formData.profilePic} 
                    alt="Profile" 
                    className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                  />
                ) : (
                  <span className="text-2xl text-slate-500 font-bold">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </span>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-1 text-sky-400" />
                      <span className="text-[10px] font-semibold">Change Photo</span>
                    </>
                  )}
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <p className="text-[10px] text-slate-500 text-center max-w-[150px]">
                JPG or PNG format. Synchronized with Firebase Storage.
              </p>

              {/* Total Patients Badge */}
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-center">
                <p className="text-[11px] text-slate-400 font-medium">Patients Managed</p>
                <p className="text-xl font-bold text-sky-400 mt-0.5">{totalPatients}</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="flex-1 w-full space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 text-slate-500 text-xs outline-none cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Verified Firebase Email.</p>
                </div>
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Hospital / Clinic
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                    placeholder="City General Hospital"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                    placeholder="Neurology"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-4">
                {statusMsg.text && (
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${statusMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {statusMsg.text}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm text-xs active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Doctor Profile</>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
