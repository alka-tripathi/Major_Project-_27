import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-blue-500">
          BrainTumorAI
        </h1>

        <div className="space-x-4">
          <Link
            href="/login"
            className="px-5 py-2 rounded-xl border border-blue-500 hover:bg-blue-500 transition"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-6xl font-bold mb-6">
          Brain Tumor Detection
        </h1>

        <p className="text-slate-400 text-xl max-w-3xl mb-10">
          Empowering doctors with AI-assisted MRI analysis for early
          and accurate brain tumor detection.
        </p>

        <div className="space-x-6">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl text-lg font-semibold"
          >
            Get Started
          </Link>

          <Link
            href="/signup"
            className="border border-slate-600 hover:border-blue-500 px-8 py-4 rounded-2xl text-lg font-semibold"
          >
            Register as Doctor
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Features
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              🧠 MRI Upload
            </h3>
            <p className="text-slate-400">
              Upload MRI scans securely for analysis.
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              🤖 AI Prediction
            </h3>
            <p className="text-slate-400">
              Detect tumor types using deep learning models.
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              📜 Patient Records
            </h3>
            <p className="text-slate-400">
              Maintain history and diagnosis reports efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-slate-500">
        © 2026 BrainTumorAI | Built for Healthcare Professionals
      </footer>
    </div>
  );
}