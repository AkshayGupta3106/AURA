import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";

const SERVICE_OPTIONS = ["All", "Balayage", "Keratin", "Hair Color", "Haircut", "Highlights", "Hair Extensions", "Perm", "Brazilian Blowout"];

export default function Explore() {
  const { user, logout } = useAuth();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (serviceFilter !== "All") params.set("service", serviceFilter);

    api.get(`/salons${params.toString() ? "?" + params.toString() : ""}`)
      .then(({ data }) => setSalons(data))
      .finally(() => setLoading(false));
  }, [cityFilter, serviceFilter]);

  return (
    <div className="min-h-screen bg-cream">
      <nav className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <span className="font-display text-xl text-charcoal">AURA</span>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/profile" className="text-xs text-gray-400 hover:text-charcoal transition">Profile</Link>
              {user.role === "creator" && (
                <Link to="/creator/dashboard" className="text-xs text-gray-400 hover:text-charcoal transition">Studio</Link>
              )}
              <button onClick={logout} className="text-xs text-gray-400 hover:text-burgundy transition">Sign out</button>
            </>
          ) : (
            <Link to="/login" className="text-xs text-burgundy font-medium">Sign in</Link>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-charcoal">Explore Salons</h1>
          <p className="text-gray-400 text-sm mt-1">Find your look. Hover to see the transformation. Try it on.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* City search */}
          <input
            type="text"
            placeholder="City (e.g. Bangalore)"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-burgundy transition bg-white placeholder:text-gray-300"
          />
          {/* Service filter */}
          <div className="flex gap-2 flex-wrap">
            {SERVICE_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setServiceFilter(s)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition whitespace-nowrap ${
                  serviceFilter === s
                    ? "bg-burgundy text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-burgundy/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-burgundy/20 border-t-burgundy rounded-full animate-spin" />
          </div>
        ) : salons.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">✂️</p>
            <p className="text-sm text-gray-400">
              {cityFilter || serviceFilter !== "All"
                ? "No salons match these filters."
                : <>No salons yet. <Link to="/register?role=creator&next=/creator/dashboard" className="text-burgundy hover:underline">Create one</Link>.</>}
            </p>
            {(cityFilter || serviceFilter !== "All") && (
              <button
                onClick={() => { setCityFilter(""); setServiceFilter("All"); }}
                className="mt-3 text-xs text-burgundy hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {salons.map(salon => (
              <Link
                key={salon.id}
                to={`/salon/${salon.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-burgundy/30 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-charcoal group-hover:text-burgundy transition truncate">
                      {salon.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className="text-xs bg-gray-50 text-gray-400 px-2 py-1 rounded-full">
                      {salon.transformation_count} looks
                    </span>
                    {salon.published_video_count > 0 && (
                      <span className="text-xs bg-charcoal/5 text-charcoal px-2 py-1 rounded-full">
                        {salon.published_video_count} videos
                      </span>
                    )}
                  </div>
                </div>

                {/* Service tags */}
                {salon.service_types?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {salon.service_types.slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-burgundy/8 text-burgundy px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {salon.service_types.length > 3 && (
                      <span className="text-xs text-gray-300">+{salon.service_types.length - 3} more</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-burgundy/70 mt-3 group-hover:text-burgundy transition">
                  View gallery →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
