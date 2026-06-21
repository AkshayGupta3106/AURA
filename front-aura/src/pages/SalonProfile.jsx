import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../api/AuthContext";
import Navbar from "../components/Navbar";

const MOCK_SERVICES = [
  { id: 1, name: "Signature Balayage", duration: "3 hrs", price: 4500, description: "Full balayage with toning and treatment" },
  { id: 2, name: "Global Hair Color", duration: "2 hrs", price: 2800, description: "Root-to-tip color with premium dyes" },
  { id: 3, name: "Keratin Treatment", duration: "2.5 hrs", price: 6000, description: "Smoothing treatment lasting 3–4 months" },
  { id: 4, name: "Precision Haircut", duration: "45 min", price: 800, description: "Cut + blow-dry + style" },
];

const MOCK_REVIEWS = [
  { id: 1, author: "Meera R.", rating: 5, text: "Absolutely loved the balayage! The color blending was perfect and exactly what I had in mind.", date: "2 weeks ago", service: "Balayage" },
  { id: 2, author: "Ananya K.", rating: 5, text: "Best keratin treatment I've ever had. Hair is so smooth and the results lasted months!", date: "1 month ago", service: "Keratin" },
  { id: 3, author: "Divya S.", rating: 4, text: "Great experience overall. Very professional and the salon has a lovely ambience.", date: "1 month ago", service: "Haircut" },
];

function Stars({ rating, size = "sm" }) {
  const cls = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={cls}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= rating ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

function TransformationCard({ transformation }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer"
      style={{ aspectRatio: "3/4" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <img src={transformation.before_image_url} alt="before"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: hovered ? 0 : 1 }} />
      <img src={transformation.after_image_url} alt="after"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: hovered ? 1 : 0 }} />
      <div className="absolute top-3 left-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
          hovered ? "bg-burgundy text-white" : "bg-black/30 text-white"}`}>
          {hovered ? "After" : "Before"}
        </span>
      </div>
      <div className={`absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }}>
        <p className="text-white text-sm font-medium">{transformation.service_type}</p>
        <p className="text-white/70 text-xs mb-3">by {transformation.artist_name}</p>
        {transformation.hair_texture_tag && (
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full self-start mb-3">{transformation.hair_texture_tag}</span>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group"
      style={{ aspectRatio: "9/16" }}
      onMouseEnter={() => { videoRef.current?.play().catch(() => {}); setPlaying(true); }}
      onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } setPlaying(false); }}>
      <video ref={videoRef} src={video.video_url} muted loop playsInline preload="metadata" className="w-full h-full object-cover" />
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${playing ? "opacity-0" : "opacity-100"}`}>
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-white text-xl ml-1">▶</span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }}>
        <p className="text-white text-sm font-medium leading-tight">{video.title}</p>
      </div>
    </div>
  );
}

export default function SalonProfile() {
  const { salonId } = useParams();
  const { user, toggleFavorite, isFavorite } = useAuth();
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("portfolio");
  const [filterService, setFilterService] = useState("All");
  const [filterTexture, setFilterTexture] = useState("All");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api.get(`/salons/${salonId}`)
      .then(({ data }) => setSalon(data))
      .catch(() => setError("Salon not found"))
      .finally(() => setLoading(false));
  }, [salonId]);

  async function submitReview(e) {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setSubmittingReview(true);
    try {
      const { data } = await api.post("/reviews", { salon_id: Number(salonId), rating: reviewRating, text: reviewText });
      setReviewText(""); setReviewRating(5);
      setSalon(prev => ({
        ...prev,
        reviews: [data, ...(prev.reviews || [])],
        reviews_count: (prev.reviews_count || 3) + 1,
        rating: Number((((prev.rating || 4.8) * (prev.reviews_count || 3)) + reviewRating) / ((prev.reviews_count || 3) + 1)).toFixed(1)
      }));
    } catch (err) {
      console.error(err);
    } finally { setSubmittingReview(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-burgundy/20 border-t-burgundy rounded-full animate-spin" />
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-gray-400">{error}</div>
    </div>
  );

  const services = ["All", ...(salon.service_types || [])];
  const textures = ["All", ...(salon.texture_tags || [])];
  const filteredTransformations = (salon.transformations || []).filter(t => {
    const svc = filterService === "All" || t.service_type === filterService;
    const tex = filterTexture === "All" || t.hair_texture_tag === filterTexture;
    return svc && tex;
  });
  const hasVideos = (salon.videos || []).length > 0;
  const fav = user ? isFavorite(Number(salonId)) : false;

  const TABS = [
    { key: "portfolio", label: `Portfolio (${salon.transformations?.length || 0})` },
    ...(hasVideos ? [{ key: "videos", label: `Videos (${salon.videos?.length || 0})` }] : []),
    { key: "services", label: "Services & Pricing" },
    { key: "reviews", label: `Reviews (${salon.reviews_count || MOCK_REVIEWS.length})` },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-5 py-8 w-full flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/explore" className="hover:text-charcoal transition">Explore</Link>
          <span>/</span>
          <span className="text-charcoal">{salon.name}</span>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left: main content */}
          <div className="lg:col-span-2">
            {/* Hero info */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-3xl text-charcoal">{salon.name}</h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}
                  </p>
                </div>
                {user && (
                  <button onClick={() => toggleFavorite(Number(salonId))}
                    className="flex-shrink-0 w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-xl hover:border-burgundy/40 transition">
                    {fav ? "❤️" : "🤍"}
                  </button>
                )}
              </div>

              {salon.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <Stars rating={Math.round(salon.rating)} />
                  <span className="text-sm font-medium text-charcoal">{salon.rating}</span>
                  <span className="text-xs text-gray-400">({salon.reviews_count || MOCK_REVIEWS.length} reviews)</span>
                </div>
              )}

              {salon.description && (
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{salon.description}</p>
              )}

              {salon.service_types?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {salon.service_types.map(s => (
                    <span key={s} className="text-xs bg-burgundy/10 text-burgundy px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                  {salon.texture_tags?.map(t => (
                    <span key={t} className="text-xs bg-charcoal/10 text-charcoal px-3 py-1 rounded-full">{t} hair</span>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="tab-row flex gap-2 mb-6">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                    tab === t.key ? "bg-burgundy text-white" : "bg-white border border-gray-200 text-charcoal hover:border-burgundy/40"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Portfolio tab */}
            {tab === "portfolio" && (
              <>
                {(services.length > 2 || textures.length > 2) && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {services.map(s => (
                      <button key={s} onClick={() => setFilterService(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          filterService === s ? "bg-burgundy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-burgundy/40"
                        }`}>{s}</button>
                    ))}
                  </div>
                )}
                {filteredTransformations.length === 0 ? (
                  <div className="py-20 text-center text-gray-300 text-sm">No transformations match these filters.</div>
                ) : (
                  <div className="transformation-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredTransformations.map(t => (
                      <TransformationCard key={t.id} transformation={t} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Videos tab */}
            {tab === "videos" && (
              <div>
                <p className="text-xs text-gray-400 mb-4">Hover to play · Published videos from this salon</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(salon.videos || []).map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              </div>
            )}

            {/* Services tab */}
            {tab === "services" && (
              <div className="space-y-3">
                {MOCK_SERVICES.map(svc => (
                  <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-charcoal text-sm">{svc.name}</h3>
                        <span className="text-xs text-gray-400">· {svc.duration}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{svc.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-charcoal">₹{svc.price.toLocaleString()}</p>
                      <button
                        onClick={() => navigate(`/booking/${salonId}`, { state: { service: svc, salon } })}
                        className="mt-2 text-xs bg-burgundy/10 text-burgundy px-3 py-1.5 rounded-lg hover:bg-burgundy hover:text-white transition font-medium">
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews tab */}
            {tab === "reviews" && (
              <div className="space-y-4">
                {[
                  ...(salon.reviews || []).map(r => ({ ...r, is_db: true })),
                  ...MOCK_REVIEWS
                ].map((r, index) => (
                  <div key={r.is_db ? `db-${r.id}` : `mock-${r.id || index}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-burgundy flex items-center justify-center text-white text-xs font-bold">
                          {r.author?.[0] || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-charcoal">{r.author}</p>
                          <p className="text-xs text-gray-400">{r.date} · {r.service}</p>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                  </div>
                ))}

                {/* Write review */}
                {user?.role === "customer" && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-medium text-charcoal text-sm mb-3">Leave a review</h3>
                    <form onSubmit={submitReview} className="space-y-3">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => setReviewRating(n)}
                            className={`text-2xl transition ${n <= reviewRating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}>★</button>
                        ))}
                      </div>
                      <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                        placeholder="Share your experience..." rows={3} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy resize-none transition" />
                      <button type="submit" disabled={submittingReview}
                        className="bg-burgundy text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-burgundy-dark transition disabled:opacity-50">
                        {submittingReview ? "Posting..." : "Post review"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar: sticky booking card */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5">
                <p className="text-xs text-gray-400 mb-1">Starting from</p>
                <p className="font-display text-2xl text-charcoal mb-1">₹{Math.min(...MOCK_SERVICES.map(s => s.price)).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mb-4">Per service · prices vary</p>

                <button
                  onClick={() => navigate(`/booking/${salonId}`, { state: { salon } })}
                  className="w-full bg-burgundy text-white py-3 rounded-xl text-sm font-semibold hover:bg-burgundy-dark transition">
                  {user ? "Book Now" : "Sign in to Book"}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 text-xs">
                {[["📍", "Location", salon.neighborhood ? `${salon.neighborhood}, ${salon.city}` : salon.city],
                  ["⏰", "Hours", "Mon–Sat: 10 AM – 7 PM"],
                  ["📞", "Contact", "+91 98765 43210"],
                  ["💳", "Payment", "Cash, UPI, Cards"],
                ].map(([icon, label, val]) => (
                  <div key={label} className="flex items-start gap-2">
                    <span>{icon}</span>
                    <div>
                      <p className="text-gray-400">{label}</p>
                      <p className="text-charcoal font-medium">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile book button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-cream/95 backdrop-blur-sm border-t border-gray-100 z-30">
          <button onClick={() => navigate(`/booking/${salonId}`, { state: { salon } })}
            className="w-full bg-burgundy text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-burgundy-dark transition">
            {user ? "Book Appointment" : "Sign in to Book"}
          </button>
        </div>
      </div>

      {/* Try-on modal removed */}
    </div>
  );
}
