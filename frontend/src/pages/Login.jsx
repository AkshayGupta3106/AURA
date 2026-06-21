import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login({ id: data.user_id, name: data.name, role: data.role }, data.access_token);
      navigate(nextPath || (data.role === "creator" ? "/creator/dashboard" : "/"));
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-charcoal mb-2 text-center">Welcome back</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-burgundy font-medium hover:underline">
            Register
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@email.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Your password"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy text-white rounded-lg py-3 text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
