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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // OTP specific state
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Handle Step 2 Submit: Request OTP and proceed to step 3
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { email: form.email });
      setStep(3);
      setResendTimer(30);
      setOtp(new Array(6).fill(""));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { email: form.email });
      setResendTimer(30);
      setOtp(new Array(6).fill(""));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 3 Submit: Verify OTP and Register
  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    setError("");
    const combinedOtp = otp.join("");
    if (combinedOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        ...form,
        otp: combinedOtp
      });
      login({ id: data.user_id, name: data.name, role: data.role, email: form.email }, data.access_token);
      navigate(nextPath || (data.role === "creator" ? "/creator/onboarding" : "/explore"));
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (value, idx) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue && value !== "") return;

    const newOtp = [...otp];
    newOtp[idx] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);

    // Auto-focus next field if typed
    if (cleanValue && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!otp[idx] && idx > 0) {
        const newOtp = [...otp];
        newOtp[idx - 1] = "";
        setOtp(newOtp);
        otpRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasteData)) return;

    const digits = pasteData.slice(0, 6).split("");
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (digits[i]) {
        newOtp[i] = digits[i];
      }
    }
    setOtp(newOtp);

    const targetIdx = Math.min(digits.length - 1, 5);
    otpRefs.current[targetIdx]?.focus();
  };

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
            {step === 1 ? "Join AURA" : step === 2 ? "Your details" : "Verify email"}
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
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="you@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required minLength={6} placeholder="Min 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-burgundy text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-burgundy-dark transition disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Sending code...
                  </>
                ) : `Create ${form.role === "creator" ? "Creator" : ""} Account`}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By registering you agree to our <span className="text-burgundy cursor-pointer hover:underline">Terms</span> and{" "}
                <span className="text-burgundy cursor-pointer hover:underline">Privacy Policy</span>
              </p>
            </form>
          )}

          {/* Step 3: OTP Verification */}
          {step === 3 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-3 text-burgundy text-xl">
                  ✉️
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We sent a 6-digit verification code to<br />
                  <span className="font-semibold text-charcoal">{form.email}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-between gap-2 max-w-sm mx-auto">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10 transition bg-white text-charcoal"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full bg-burgundy text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-burgundy-dark transition disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-sm font-medium text-burgundy hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setError("");
                  }}
                  className="text-xs text-gray-500 hover:text-burgundy font-medium flex items-center gap-1 transition"
                >
                  ← Edit email / details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
