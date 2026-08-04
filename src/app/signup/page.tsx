"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword,sendEmailVerification } from "firebase/auth";
// import { auth } from "../firebase";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

//   const onSubmit = async () => {
//     try {
//     const userCredential = await createUserWithEmailAndPassword(
//   auth,
//   email,
//   password
// );

// await sendEmailVerification(userCredential.user);

// alert("Verification email sent!");

//       router.push("/login");
//     } catch (error: any) {
//       alert(error.message);
//     }
//   };
const onSubmit = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await sendEmailVerification(user);

    console.log("Email sent to:", user.email);

    alert("Verification email sent!");

    // small delay improves reliability in dev
    setTimeout(() => {
      router.push("/login");
    }, 500);
    
  } catch (error: any) {
    console.log("ERROR:", error);
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
            Create Doctor Account
          </p>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-slate-300 block mb-2">
            Doctor Name
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
            onChange={(e) => setName(e.target.value)}
          />
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

        {/* Button */}
        <button
          onClick={onSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 transition duration-300 text-white font-semibold py-3 rounded-xl"
        >
          Create Account
        </button>

        {/* Login Link */}
        <p className="text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-500 hover:text-blue-400"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

