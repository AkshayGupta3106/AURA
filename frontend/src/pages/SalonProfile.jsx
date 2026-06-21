import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";


// ── Transformation card ───────────────────────────────────────────────────────
function TransformationCard({ transformation, onTryOn }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer"
      style={{ aspectRatio: "3/4" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={transformation.before_image_url}
        alt="before"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: hovered ? 0 : 1 }}
      />
      <img
        src={transformation.after_image_url}
        alt="after"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: hovered ? 1 : 0 }}
      />
      <div className="absolute top-3 left-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
          hovered ? "bg-burgundy text-white" : "bg-black/30 text-white"
        }`}>
          {hovered ? "After" : "Before"}
        </span>
      </div>
      {transformation.try_on_count > 0 && (
        <div className="absolute top-3 right-3">
          <span className="text-xs bg-black/30 text-white px-2 py-1 rounded-full backdrop-blur-sm">
            {transformation.try_on_count} try-ons
          </span>
        </div>
      )}
      <div
        className={`absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }}
      >
        <p className="text-white text-sm font-medium">{transformation.service_type}</p>
        <p className="text-white/70 text-xs mb-3">by {transformation.artist_name}</p>
        {transformation.hair_texture_tag && (
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full self-start mb-3">
            {transformation.hair_texture_tag}
          </span>
        )}

      </div>
    </div>
  );
}

// ── Video card with hover autoplay ────────────────────────────────────────────
function VideoCard({ video }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function handleMouseEnter() {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
    setPlaying(true);
  }

  function handleMouseLeave() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group"
      style={{ aspectRatio: "9/16" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={video.video_url}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />

      {/* Play hint overlay (hidden when playing) */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${playing ? "opacity-0" : "opacity-100"}`}>
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-white text-xl ml-1">▶</span>
        </div>
      </div>

      {/* Title overlay */}
      <div
        className="absolute inset-x-0 bottom-0 p-4"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }}
      >
        <p className="text-white text-sm font-medium leading-tight">{video.title}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SalonProfile() {
  const { salonId } = useParams();
  const { user } = useAuth();

  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("transformations");
  const [activeTransformation, setActiveTransformation] = useState(null);
  const [filterService, setFilterService] = useState("All");
  const [filterTexture, setFilterTexture] = useState("All");

  useEffect(() => {
    api.get(`/salons/${salonId}`)
      .then(({ data }) => setSalon(data))
      .catch(() => setError("Salon not found"))
      .finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-burgundy/20 border-t-burgundy rounded-full animate-spin" />
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-cream flex items-center justify-center text-gray-400">{error}</div>
  );

  const services = ["All", ...(salon.service_types || [])];
  const textures = ["All", ...(salon.texture_tags || [])];

  const filteredTransformations = (salon.transformations || []).filter(t => {
    const svc = filterService === "All" || t.service_type === filterService;
    const tex = filterTexture === "All" || t.hair_texture_tag === filterTexture;
    return svc && tex;
  });

  const hasVideos = (salon.videos || []).length > 0;

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <Link to="/explore" className="text-sm text-gray-400 hover:text-charcoal transition">← Explore</Link>
        {user ? (
          <span className="text-xs text-gray-400">{user.name}</span>
        ) : (
          <Link to="/login" className="text-xs text-burgundy font-medium">Sign in to try on</Link>
        )}
      </nav>

      <div className="px-5 py-8 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="font-display text-3xl text-charcoal">{salon.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}
          </p>
          {salon.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{salon.description}</p>
          )}

          {/* Service tags */}
          {salon.service_types?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {salon.service_types.map(s => (
                <span key={s} className="text-xs bg-burgundy/10 text-burgundy px-3 py-1 rounded-full font-medium">
                  {s}
                </span>
              ))}
              {salon.texture_tags?.map(t => (
                <span key={t} className="text-xs bg-charcoal/10 text-charcoal px-3 py-1 rounded-full">
                  {t} hair
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("transformations")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              tab === "transformations" ? "bg-burgundy text-white" : "bg-white border border-gray-200 text-charcoal hover:border-burgundy/40"
            }`}
          >
            Before / After
            <span className="ml-2 text-xs opacity-60">{salon.transformations?.length || 0}</span>
          </button>
          {hasVideos && (
            <button
              onClick={() => setTab("videos")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                tab === "videos" ? "bg-charcoal text-white" : "bg-white border border-gray-200 text-charcoal hover:border-charcoal/40"
              }`}
            >
              Videos
              <span className="ml-2 text-xs opacity-60">{salon.videos?.length || 0}</span>
            </button>
          )}
        </div>

        {/* ── Transformations tab ── */}
        {tab === "transformations" && (
          <>
            {/* Filters */}
            {(services.length > 2 || textures.length > 2) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {services.map(s => (
                  <button key={s} onClick={() => setFilterService(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      filterService === s ? "bg-burgundy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-burgundy/40"
                    }`}>
                    {s}
                  </button>
                ))}
                {textures.length > 2 && <>
                  <span className="w-px bg-gray-200 self-stretch mx-1" />
                  {textures.map(t => (
                    <button key={t} onClick={() => setFilterTexture(t)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        filterTexture === t ? "bg-charcoal text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-charcoal/40"
                      }`}>
                      {t}
                    </button>
                  ))}
                </>}
              </div>
            )}

            {filteredTransformations.length === 0 ? (
              <div className="py-20 text-center text-gray-300 text-sm">No transformations match these filters.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredTransformations.map(t => (
                  <TransformationCard
                    key={t.id}
                    transformation={t}
                    onTryOn={user ? setActiveTransformation : () => window.location.href = "/login"}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Videos tab ── */}
        {tab === "videos" && (
          <div>
            <p className="text-xs text-gray-400 mb-4">Hover to play · Published videos from this salon</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(salon.videos || []).map(v => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
