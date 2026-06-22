import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "creator" ? "creator" : "customer";
  const nextPath = searchParams.get("next");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", username: "", password: "", confirmPassword: "", role: defaultRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Handle Step 2 Submit: Direct Registration
  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: form.name,
        username: form.username,
        password: form.password,
        role: form.role
      });
      login({ id: data.user_id, name: data.name, role: data.role, username: form.username }, data.access_token);
      navigate(nextPath || (data.role === "creator" ? "/creator/onboarding" : "/explore"));
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-burgundy to-[#8B3547] p-10 text-white">
        <Link to="/" className="font-display text-2xl">AURA</Link>
        <div className="space-y-6">
          {["Showcase your portfolio with before & after transformations", "Let clients book your services directly from your profile", "Manage bookings, earnings, and analytics in one place"].map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-xs">Join 80+ creators already on AURA</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden font-display text-xl text-charcoal block mb-8">AURA</Link>
          <h1 className="font-display text-3xl text-charcoal mb-1">
            {step === 1 ? "Join AURA" : "Your details"}
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Already have an account?{" "}
            <Link to="/login" className="text-burgundy font-medium hover:underline">Sign in</Link>
          </p>

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-charcoal mb-3">I want to...</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { setForm(f => ({ ...f, role: "customer" })); setStep(2); }}
                  className={`p-5 rounded-2xl border-2 text-left transition ${
                    form.role === "customer" ? "border-burgundy bg-burgundy/5" : "border-gray-200 bg-white hover:border-burgundy/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-burgundy/10 flex items-center justify-center text-xl flex-shrink-0">💇</div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">Discover & Book</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Browse hair creators, explore before & after transformations, and book appointments easily.</p>
                    </div>
                    {form.role === "customer" && (
                      <div className="w-5 h-5 rounded-full bg-burgundy flex items-center justify-center flex-shrink-0 ml-auto">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => { setForm(f => ({ ...f, role: "creator" })); setStep(2); }}
                  className={`p-5 rounded-2xl border-2 text-left transition ${
                    form.role === "creator" ? "border-burgundy bg-burgundy/5" : "border-gray-200 bg-white hover:border-burgundy/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-charcoal/8 flex items-center justify-center text-xl flex-shrink-0">✂️</div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">Create & Grow</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Showcase your work, attract clients, and manage your salon business with analytics.</p>
                    </div>
                    {form.role === "creator" && (
                      <div className="w-5 h-5 rounded-full bg-burgundy flex items-center justify-center flex-shrink-0 ml-auto">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-burgundy/10 text-burgundy px-2.5 py-1 rounded-full font-medium capitalize">
                  {form.role === "creator" ? "✂️ Creator" : "💇 Customer"}
                </span>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-burgundy">Change →</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  placeholder="Your full name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username</label>
                <input name="username" value={form.username} onChange={handleChange} required
                  placeholder="Choose a username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required placeholder="Choose a password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                  required placeholder="Confirm your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-burgundy text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-burgundy-dark transition disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Creating account...
                  </>
                ) : `Create ${form.role === "creator" ? "Creator" : ""} Account`}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By registering you agree to our <span className="text-burgundy cursor-pointer hover:underline">Terms</span> and{" "}
                <span className="text-burgundy cursor-pointer hover:underline">Privacy Policy</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
