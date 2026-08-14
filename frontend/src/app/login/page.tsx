"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Brain, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        setError("Please verify your email address before logging in.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to authenticate. Please check your credentials.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Sync to MongoDB with profilePic (photoURL)
      await fetch("/api/doctors/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          profilePic: result.user.photoURL,
        }),
      });

      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message || "Google sign-in failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Header Bar */}
      <header className="px-8 py-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            BrainTumor<span className="text-sky-400">AI</span>
          </span>
        </Link>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-md w-full max-w-md rounded-2xl shadow-xl p-8 relative">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Doctor Sign In
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">
              Access your clinical MRI diagnostic workstation.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-2 text-[11px] font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 transition-all duration-200 text-white font-semibold py-3 rounded-xl shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-xs"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">OR</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-slate-950 hover:bg-slate-900 transition-all duration-200 text-slate-200 font-medium py-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-3 active:scale-[0.98] text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-slate-400 mt-6 text-xs">
            Need a doctor account?{" "}
            <Link
              href="/signup"
              className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
            >
              Register Here
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-slate-600 text-xs">
        © 2026 BrainTumorAI. Clinical Decision Support System.
      </footer>
    </div>
  );
}
