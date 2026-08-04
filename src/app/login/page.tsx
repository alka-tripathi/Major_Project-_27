"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../firebase";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        alert("Please verify your email before logging in.");
        return;
      }

      alert("Login successful!");

      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            BrainTumorAI
          </h1>

          <p className="text-slate-400 mt-2">
            Doctor Login
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-slate-300 block mb-2">
            Email Address
          </label>

          <input
            type="email"
            placeholder="doctor@gmail.com"
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-slate-300 block mb-2">
            Password
          </label>

          <input
            type="password"
            placeholder="********"
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={onSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 transition duration-300 text-white font-semibold py-3 rounded-xl"
        >
          Login
        </button>

        {/* Signup Link */}
        <p className="text-center text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-500 hover:text-blue-400"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}


