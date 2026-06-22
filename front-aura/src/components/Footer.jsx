import { Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

export default function Footer() {
  const { user, logout } = useAuth();

  function handleCreatorLinkClick(e) {
    if (!user || user.role !== "creator") {
      e.preventDefault();
      alert("This is for creators only. Sign in as a creator to see the available page.");
    }
  }

  return (
    <footer className="bg-charcoal text-white mt-auto">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="font-display text-2xl mb-3">AURA</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Discover, book, and preview your next hair transformation with AI.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">For Customers</p>
            <div className="space-y-2">
              <Link to="/explore" className="block text-sm text-gray-300 hover:text-white transition">Explore Salons</Link>
              <Link to="/customer/bookings" className="block text-sm text-gray-300 hover:text-white transition">My Bookings</Link>
              <Link to="/customer/saved" className="block text-sm text-gray-300 hover:text-white transition">Saved Creators</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">For Creators</p>
            <div className="space-y-2">
              <Link to="/register?role=creator" onClick={() => { if (user) logout(); }} className="block text-sm text-gray-300 hover:text-white transition">Join as Creator</Link>
              <Link to="/creator/dashboard" onClick={handleCreatorLinkClick} className="block text-sm text-gray-300 hover:text-white transition">Creator Dashboard</Link>
              <Link to="/creator/upload" onClick={handleCreatorLinkClick} className="block text-sm text-gray-300 hover:text-white transition">Upload Work</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Company</p>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-gray-300 hover:text-white transition">About</Link>
              <Link to="/privacy" className="block text-sm text-gray-300 hover:text-white transition">Privacy</Link>
              <Link to="/terms" className="block text-sm text-gray-300 hover:text-white transition">Terms</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2025 AURA. Bangalore, India.</p>
          <p className="text-xs text-gray-500">AI-powered hair salon discovery</p>
        </div>
      </div>
    </footer>
  );
}
