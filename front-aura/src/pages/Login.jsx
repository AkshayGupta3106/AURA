import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalType, setModalType] = useState(null); // 'terms' | 'privacy' | null

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login({ id: data.user_id, name: data.name, role: data.role, username: form.username }, data.access_token);
      navigate(nextPath || (data.role === "creator" ? "/creator/dashboard" : "/explore"));
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-charcoal p-10">
        <Link to="/" className="font-display text-2xl text-white">AURA</Link>
        <div>
          <blockquote className="font-display text-3xl text-white/90 leading-snug mb-4">
            "The right haircut can change everything — let's find yours."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-burgundy flex items-center justify-center text-white font-bold">P</div>
            <div>
              <p className="text-white text-sm font-medium">Priya M.</p>
              <p className="text-white/50 text-xs">AURA customer, Bangalore</p>
            </div>
          </div>
        </div>
        <p className="text-white/30 text-xs">© 2025 AURA · AI-powered hair discovery</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden font-display text-xl text-charcoal block mb-8">AURA</Link>
          <h1 className="font-display text-3xl text-charcoal mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-burgundy font-medium hover:underline">Create one</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username</label>
              <input
                name="username" type="text" value={form.username}
                onChange={handleChange} required
                placeholder="Your username"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                <button type="button" className="text-xs text-burgundy hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  name="password" type={showPassword ? "text" : "password"}
                  value={form.password} onChange={handleChange} required
                  placeholder="Your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-burgundy text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-burgundy-dark transition disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              By signing in you agree to our{" "}
              <span onClick={() => setModalType("terms")} className="text-burgundy cursor-pointer hover:underline">Terms</span> and{" "}
              <span onClick={() => setModalType("privacy")} className="text-burgundy cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Terms & Privacy Policy */}
      {modalType && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-[999] px-5" style={{ backgroundColor: "rgba(33, 33, 33, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 relative max-h-[85vh] overflow-y-auto">
            {/* Close button (cross sign) */}
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-charcoal text-2xl transition font-bold"
            >
              ×
            </button>

            {modalType === "terms" ? (
              <div>
                <h3 className="font-display text-2xl text-charcoal mb-2 font-bold">Terms of Service</h3>
                <p className="text-xs text-gray-400 mb-4">Last updated: June 21, 2026</p>
                <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                  <p>
                    By accessing or using the AURA platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully.
                  </p>
                  <h4 className="font-semibold text-charcoal text-sm mt-4">1. Use of Our Services</h4>
                  <p>
                    You must be at least 18 years old to create an account or book services. You agree to provide accurate and complete information during registration.
                  </p>
                  <h4 className="font-semibold text-charcoal text-sm mt-4">2. Bookings & Cancellations</h4>
                  <p>
                    Appointments booked on AURA are subject to creator availability. Any cancellations or rescheduling must be done in accordance with the individual creator's policies.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-display text-2xl text-charcoal mb-2 font-bold">Privacy Policy</h3>
                <p className="text-xs text-gray-400 mb-4">Last updated: June 21, 2026</p>
                <div className="text-gray-600 text-sm space-y-4 leading-relaxed">
                  <p>
                    At AURA, we value your privacy. This Privacy Policy describes how we collect, use, and share your personal information when you use our website and mobile application.
                  </p>
                  <h4 className="font-semibold text-charcoal text-sm mt-4">1. Information We Collect</h4>
                  <p>
                    We collect information you provide directly to us, including your name, email address, password, phone number, and profile details when you sign up or edit your profile.
                  </p>
                  <h4 className="font-semibold text-charcoal text-sm mt-4">2. How We Use Your Information</h4>
                  <p>
                    We use the information we collect to operate, maintain, and improve our services, including processing bookings, verifying accounts, and generating AI insights.
                  </p>
                  <p>
                    We do not sell your personal data to third parties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
