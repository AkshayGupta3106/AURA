import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SERVICE_OPTIONS = ["All", "Balayage", "Keratin", "Hair Color", "Haircut", "Highlights", "Hair Extensions", "Perm", "Brazilian Blowout"];
const SORT_OPTIONS = ["Most Popular", "Highest Rated", "Most Recent"];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="h-4 w-36 bg-gray-100 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="flex gap-1.5 mt-4">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

export default function Explore() {
  const { user, toggleFavorite, isFavorite } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState(searchParams.get("service") || "All");
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState("grid");

  const sortedSalons = [...salons].sort((a, b) => {
    if (sortBy === "Highest Rated") {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === "Most Recent") {
      return b.id - a.id;
    } else { // "Most Popular"
      return (b.reviews_count || 0) - (a.reviews_count || 0);
    }
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (serviceFilter !== "All") params.set("service", serviceFilter);
    if (searchQuery) params.set("q", searchQuery);

    api.get(`/salons${params.toString() ? "?" + params.toString() : ""}`)
      .then(({ data }) => setSalons(data))
      .catch(() => setSalons([]))
      .finally(() => setLoading(false));
  }, [cityFilter, serviceFilter, searchQuery]);

  function handleSearch(e) {
    e.preventDefault();
  }

  const clearFilters = () => {
    setCityFilter(""); setServiceFilter("All"); setSearchQuery(""); setSearchParams({});
  };
  const hasFilters = cityFilter || serviceFilter !== "All" || searchQuery;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto px-5 py-8 w-full flex-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl text-charcoal">Explore Creators</h1>
          <p className="text-gray-400 text-sm mt-1">Find your look. Hover to see before & after transformations.</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input name="q" value={searchQuery} onChange={e => {
              const val = e.target.value;
              setSearchQuery(val);
              setSearchParams(val ? { q: val } : {});
            }} placeholder="Search salons, services, areas..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-burgundy bg-white transition placeholder:text-gray-300" />
          </div>
          <input type="text" placeholder="City" value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-burgundy transition bg-white placeholder:text-gray-300 w-36" />
          <button type="submit" className="bg-burgundy text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-burgundy-dark transition">
            Search
          </button>
        </form>

        {/* Service chips + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {SERVICE_OPTIONS.map(s => (
              <button key={s} onClick={() => setServiceFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                  serviceFilter === s ? "bg-burgundy text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:border-burgundy/40"
                }`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-burgundy text-gray-600">
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
              {[["grid", "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"], ["list", "M4 6h16M4 12h16M4 18h16"]].map(([mode, d]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-2 transition ${viewMode === mode ? "bg-burgundy text-white" : "text-gray-400 hover:text-gray-600"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-400">Active filters:</span>
            {searchQuery && <FilterTag label={`"${searchQuery}"`} onRemove={() => setSearchQuery("")} />}
            {cityFilter && <FilterTag label={cityFilter} onRemove={() => setCityFilter("")} />}
            {serviceFilter !== "All" && <FilterTag label={serviceFilter} onRemove={() => setServiceFilter("All")} />}
            <button onClick={clearFilters} className="text-xs text-burgundy hover:underline ml-1">Clear all</button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sortedSalons.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">✂️</p>
            <p className="text-sm text-gray-400 mb-4">
              {hasFilters ? "No salons match these filters." : <>No salons yet. <Link to="/register?role=creator" className="text-burgundy hover:underline">Create one</Link>.</>}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-burgundy hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">{sortedSalons.length} creator{sortedSalons.length !== 1 ? "s" : ""} found</p>
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {sortedSalons.map((salon, i) => (
                <SalonCard key={salon.id} salon={salon} viewMode={viewMode} delay={i * 50}
                  isFav={user ? isFavorite(salon.id) : false}
                  onToggleFav={user ? () => toggleFavorite(salon.id) : null} />
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 text-xs bg-burgundy/10 text-burgundy px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-burgundy-dark">×</button>
    </span>
  );
}

function SalonCard({ salon, viewMode, delay, isFav, onToggleFav }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:border-burgundy/30 hover:shadow-glass transition group persona-card"
        style={{ animationDelay: `${delay}ms` }}>
        <Link to={`/salon/${salon.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-burgundy/10 flex items-center justify-center text-burgundy font-display text-lg flex-shrink-0">
              {salon.name?.[0] || "S"}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-charcoal group-hover:text-burgundy transition truncate">{salon.name}</h3>
              <p className="text-xs text-gray-400">{salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
          <span>{salon.transformation_count} looks</span>
          {salon.rating && <span className="text-amber-600 font-semibold">★ {salon.rating}</span>}
          {onToggleFav && (
            <button onClick={onToggleFav} className="text-lg">{isFav ? "❤️" : "🤍"}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-burgundy/30 hover:shadow-glass transition group persona-card flex flex-col"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link to={`/salon/${salon.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-burgundy/10 flex items-center justify-center text-burgundy font-display text-xl flex-shrink-0">
              {salon.name?.[0] || "S"}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-charcoal group-hover:text-burgundy transition truncate">{salon.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}</p>
            </div>
          </div>
        </Link>
        {onToggleFav && (
          <button onClick={onToggleFav} className="text-xl flex-shrink-0 hover:scale-110 transition-transform">{isFav ? "❤️" : "🤍"}</button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
        {salon.rating && <span className="text-amber-600 font-semibold">★ {salon.rating}</span>}
        {salon.reviews_count > 0 && <span>{salon.reviews_count} reviews</span>}
        <span className="ml-auto">{salon.transformation_count} looks</span>
        {salon.published_video_count > 0 && <span>{salon.published_video_count} videos</span>}
      </div>

      {salon.service_types?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {salon.service_types.slice(0, 3).map(s => (
            <span key={s} className="text-xs bg-burgundy/8 text-burgundy px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {salon.service_types.length > 3 && (
            <span className="text-xs text-gray-300">+{salon.service_types.length - 3}</span>
          )}
        </div>
      )}

      <Link to={`/salon/${salon.id}`} className="text-xs text-burgundy/70 hover:text-burgundy transition mt-auto pt-1">
        View gallery →
      </Link>
    </div>
  );
}
