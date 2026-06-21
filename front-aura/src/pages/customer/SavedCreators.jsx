import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../api/AuthContext";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const MOCK_SAVED = [
  { id: 1, name: "Luminary Studio", city: "Indiranagar", neighborhood: "Indiranagar", rating: 4.9, reviews: 128, services: ["Balayage", "Highlights"], looks: 34 },
  { id: 2, name: "The Mane Club", city: "Bangalore", neighborhood: "Koramangala", rating: 4.8, reviews: 96, services: ["Hair Color", "Keratin"], looks: 28 },
  { id: 3, name: "Velvet & Veil", city: "Bangalore", neighborhood: "HSR Layout", rating: 4.7, reviews: 74, services: ["Haircuts", "Extensions"], looks: 21 },
];

export default function SavedCreators() {
  const { favorites, toggleFavorite } = useAuth();
  const [allSalons, setAllSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/salons")
      .then(({ data }) => {
        setAllSalons(data);
      })
      .catch((err) => {
        console.error("Error fetching salons:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const savedSalons = allSalons.filter(salon =>
    favorites.map(Number).includes(Number(salon.id))
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto px-5 py-8 w-full flex-1">
        <Link to="/customer/dashboard" className="text-xs text-gray-400 hover:text-charcoal transition mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="mb-6">
          <h1 className="font-display text-3xl text-charcoal">Saved Creators</h1>
          <p className="text-gray-400 text-sm mt-1">{savedSalons.length} salons saved</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-burgundy/20 border-t-burgundy rounded-full animate-spin" /></div>
        ) : savedSalons.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">❤️</p>
            <p className="text-sm text-gray-400 mb-4">No saved creators yet.</p>
            <Link to="/explore" className="text-sm text-burgundy hover:underline">Explore salons →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedSalons.map((salon, i) => (
              <div key={salon.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-burgundy/30 hover:shadow-glass transition persona-card"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/salon/${salon.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-burgundy/10 flex items-center justify-center text-burgundy font-display text-xl flex-shrink-0">
                      {salon.name?.[0] || "S"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-charcoal hover:text-burgundy transition truncate">{salon.name}</h3>
                      <p className="text-xs text-gray-400">{salon.neighborhood ? `${salon.neighborhood}, ` : ""}{salon.city}</p>
                    </div>
                  </Link>
                  <button onClick={() => toggleFavorite(Number(salon.id))} className="text-xl hover:scale-110 transition-transform flex-shrink-0 ml-2">
                    ❤️
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3 text-xs">
                  <span className="text-amber-500 font-semibold">★ {salon.rating || 4.8}</span>
                  <span className="text-gray-400">{salon.reviews_count || 3} reviews</span>
                  <span className="text-gray-400">{salon.transformation_count || 0} looks</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(salon.service_types || []).map(s => (
                    <span key={s} className="text-xs bg-burgundy/8 text-burgundy px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Link to={`/salon/${salon.id}`}
                    className="flex-1 text-center text-xs border border-gray-200 text-charcoal py-2 rounded-xl hover:bg-gray-50 transition font-medium">
                    View profile
                  </Link>
                  <Link to={`/booking/${salon.id}`}
                    className="flex-1 text-center text-xs bg-burgundy text-white py-2 rounded-xl hover:bg-burgundy-dark transition font-medium">
                    Book now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
