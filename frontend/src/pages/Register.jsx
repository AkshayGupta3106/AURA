import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "creator" ? "creator" : "customer";
  const nextPath = searchParams.get("next");

  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSendOtp() {
    if (!form.email) {
      setError("Please enter your email first.");
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      await api.post("/auth/send-otp", { email: form.email });
      setOtpSent(true);
      setOtpCountdown(60);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP. Email may be already registered.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!otpSent) {
      setError("Please request and enter the verification OTP sent to your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { ...form, otp });
      login({ id: data.user_id, name: data.name, role: data.role }, data.access_token);
      navigate(nextPath || (data.role === "creator" ? "/creator/dashboard" : "/"));
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-charcoal mb-2 text-center">Join AURA</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-burgundy font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
            <div className="flex gap-2">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={otpSent}
                placeholder="you@email.com"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition disabled:bg-gray-50 disabled:text-gray-500"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || otpCountdown > 0 || !form.email || otpSent}
                className="bg-charcoal text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 min-w-[100px] whitespace-nowrap"
              >
                {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : otpLoading ? "Sending..." : otpSent ? "Sent ✓" : "Send OTP"}
              </button>
            </div>
          </div>

          {otpSent && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-charcoal">OTP Verification Code</label>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); }}
                  className="text-xs text-burgundy font-medium hover:underline"
                >
                  Change email
                </button>
              </div>
              <input
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter 6-digit OTP code"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition"
              />
              <p className="text-xs text-green-600 mt-1">Please check your email (or server console) for the OTP.</p>
            </div>
          )}



          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">I am a...</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition bg-white"
            >
              <option value="customer">Customer</option>
              <option value="creator">Salon Creator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy text-white rounded-lg py-3 text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
