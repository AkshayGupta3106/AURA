import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("account");
  const [form, setForm] = useState({ name: user?.name || "", username: user?.username || "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState({
    bookingConfirmations: true,
    newBookingRequests: true,
    reviewAlerts: true,
    marketingEmails: false,
    smsAlerts: true,
  });

  async function handleSaveAccount(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.patch("/auth/me", { name: form.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setError("Passwords don't match"); return; }
    setSaving(true); setError("");
    try {
      await api.post("/auth/change-password", { current_password: form.currentPassword, new_password: form.newPassword });
      setForm(f => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Password change failed");
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    api.delete("/auth/me").then(() => { logout(); navigate("/"); }).catch(() => {});
  }

  const SECTIONS = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "password", label: "Password", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "danger", label: "Danger zone", icon: "⚠️" },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto px-5 py-8 w-full flex-1">
        <Link to={user?.role === "creator" ? "/creator/dashboard" : "/customer/dashboard"} className="text-xs text-gray-400 hover:text-charcoal transition mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl text-charcoal mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                    activeSection === s.id ? "bg-burgundy/8 text-burgundy" : "text-gray-500 hover:bg-gray-50 hover:text-charcoal"
                  }`}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Account */}
            {activeSection === "account" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-charcoal mb-5">Account details</h2>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
                {saved && <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3 mb-4">✓ Changes saved</div>}
                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username</label>
                    <input value={form.username} disabled
                      className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-1">Username cannot be changed. Contact support if needed.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Role</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <span className="text-sm capitalize text-charcoal font-medium">{user?.role}</span>
                      <span className="text-xs text-gray-400 ml-1">· Role cannot be changed after registration</span>
                    </div>
                  </div>
                  <button type="submit" disabled={saving}
                    className="bg-burgundy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-burgundy-dark transition disabled:opacity-50">
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </form>
              </div>
            )}

            {/* Password */}
            {activeSection === "password" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-charcoal mb-5">Change password</h2>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
                {saved && <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3 mb-4">✓ Password updated</div>}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {["currentPassword", "newPassword", "confirmPassword"].map((field, i) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        {["Current password", "New password", "Confirm new password"][i]}
                      </label>
                      <input type="password" value={form[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        minLength={field !== "currentPassword" ? 6 : undefined} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy transition" />
                    </div>
                  ))}
                  <button type="submit" disabled={saving}
                    className="bg-burgundy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-burgundy-dark transition disabled:opacity-50">
                    {saving ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-charcoal mb-5">Notification preferences</h2>
                <div className="space-y-4">
                  {[
                    { key: "bookingConfirmations", label: "Booking confirmations", sub: "When your booking is confirmed or updated" },
                    { key: "newBookingRequests", label: "New booking requests", sub: "When someone requests to book you (creators only)" },
                    { key: "reviewAlerts", label: "Review alerts", sub: "When you receive a new review" },
                    { key: "smsAlerts", label: "SMS reminders", sub: "24-hour reminder before appointments" },
                    { key: "marketingEmails", label: "Marketing emails", sub: "Tips, feature updates, and promotions from AURA" },
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{n.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                      </div>
                      <button onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications[n.key] ? "bg-burgundy" : "bg-gray-200"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${notifications[n.key] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="mt-4 bg-burgundy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-burgundy-dark transition">
                  Save preferences
                </button>
              </div>
            )}

            {/* Danger zone */}
            {activeSection === "danger" && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <h2 className="font-semibold text-red-600 mb-1">Danger zone</h2>
                <p className="text-sm text-gray-400 mb-6">These actions are permanent and cannot be undone.</p>

                <div className="border border-red-100 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-charcoal mb-1">Sign out of all devices</p>
                  <p className="text-xs text-gray-400 mb-3">Revokes all active sessions including this one.</p>
                  <button onClick={() => { logout(); navigate("/login"); }}
                    className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition font-medium">
                    Sign out everywhere
                  </button>
                </div>

                <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <p className="text-sm font-semibold text-red-700 mb-1">Delete account</p>
                  <p className="text-xs text-red-400 mb-3">Permanently delete your account, portfolio, and all booking data.</p>
                  <button onClick={handleDeleteAccount}
                    className="text-sm bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition font-medium">
                    Delete my account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
