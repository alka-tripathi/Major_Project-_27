"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Sync to MongoDB
      await fetch("/api/doctors/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
        }),
      });

      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-4 relative overflow-hidden">
      
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

      <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            BrainTumor<span className="text-blue-500">AI</span>
          </h1>

          <p className="text-zinc-400 mt-2">
            Doctor Login
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-zinc-300 block mb-2 text-sm font-medium">
            Email Address
          </label>

          <input
            type="email"
            placeholder="doctor@gmail.com"
            className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-8">
          <label className="text-zinc-300 block mb-2 text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            placeholder="********"
            className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-6 text-red-400 text-sm text-center font-medium bg-red-400/10 border border-red-400/20 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all duration-300 text-white font-semibold py-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Logging you in...</>
          ) : (
            "Login"
          )}
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-zinc-700"></div>
          <span className="px-4 text-sm text-zinc-500">OR</span>
          <div className="flex-1 border-t border-zinc-700"></div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-zinc-800 hover:bg-zinc-700 transition-all duration-300 text-white font-medium py-3 rounded-xl border border-zinc-700 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Signup Link */}
        <p className="text-center text-zinc-400 mt-6 text-sm">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}


