"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, storage } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Camera, Home, Loader2, Save } from "lucide-react";

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
        // If MongoDB record doesn't exist yet, fallback to Firebase auth data
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
      // Fallback on error
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
      const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress can be handled here if needed
        },
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
        </h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 px-5 py-2.5 rounded-xl transition-colors font-medium text-sm shadow-sm"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-8 pt-12 relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Doctor Profile</h1>
          <p className="text-zinc-400 text-lg">Manage your personal information and credentials.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="relative w-40 h-40 rounded-full border-4 border-zinc-800 overflow-hidden bg-zinc-800 group cursor-pointer flex items-center justify-center"
                onClick={handleImageClick}
              >
                {formData.profilePic ? (
                  <img 
                    src={formData.profilePic} 
                    alt="Profile" 
                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                  />
                ) : (
                  <span className="text-4xl text-zinc-600 font-semibold">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </span>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-xs font-medium">Update Photo</span>
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
              <p className="text-xs text-zinc-500 text-center max-w-[160px]">
                Allowed formats: JPG, PNG. Max size: 5MB.
              </p>
            </div>

            {/* Profile Form */}
            <div className="flex-1 w-full space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-zinc-400 block mb-2 text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-2 text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-zinc-400 block mb-2 text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-2 text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-zinc-400 block mb-2 text-sm font-medium">Hospital / Clinic</label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                    placeholder="City General Hospital"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-2 text-sm font-medium">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                    placeholder="Neurology"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-4">
                {statusMsg.text && (
                  <span className={`text-sm font-medium ${statusMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {statusMsg.text}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Save Changes</>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
