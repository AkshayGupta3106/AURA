import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import api from "../api/axios";

export default function CustomerProfile() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [salon, setSalon] = useState(null);
  const [loadingSalon, setLoadingSalon] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "creator") {
      setLoadingSalon(true);
      api
        .get("/upload/salon/me")
        .then((r) => setSalon(r.data))
        .catch(() => setSalon(null))
        .finally(() => setLoadingSalon(false));
    }

    api
      .get("/bookings/me")
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link to="/explore" className="text-gray-400 hover:text-[#2D2D2D]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1
          className="text-lg font-semibold text-[#2D2D2D]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          My Profile
        </h1>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">
        {/* User card */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#6B2737] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-[#2D2D2D]">{user?.name || "Customer"}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        {user?.role === "creator" && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              My Salon
            </p>
            {loadingSalon ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 border-2 border-[#6B2737] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : salon ? (
              <Link to={`/salon/${salon.id}`} className="block hover:opacity-90 transition-opacity">
                <p className="font-semibold text-[#2D2D2D]">{salon.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}
                </p>
                {salon.description && (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">{salon.description}</p>
                )}
                <p className="text-xs text-[#6B2737] mt-3 font-medium">Open salon profile →</p>
              </Link>
            ) : (
              <p className="text-sm text-gray-400">
                No salon found yet. Create one from the Studio.
              </p>
            )}
          </div>
        )}

        {/* Bookings */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          My Bookings
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#6B2737] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-4 text-sm">No bookings yet.</p>
            <Link to="/explore" className="text-[#6B2737] font-medium hover:underline text-sm">
              Explore salons →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link
                key={b.booking_id}
                to={`/booking/${b.booking_id}`}
                className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow"
              >
                {b.after_image_url ? (
                  <img
                    src={b.after_image_url}
                    alt="style"
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D2D2D] truncate">
                    {b.service_type || "Hair Service"}
                  </p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{b.salon_name}</p>
                  <p className="text-xs text-gray-400 mt-1">Saturday, 3 PM</p>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0 capitalize">
                  {b.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
