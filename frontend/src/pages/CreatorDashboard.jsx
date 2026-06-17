import { useState, useEffect } from "react";
import { useAuth } from "../api/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/axios";

function scoreColor(score) {
  if (score === null || score === undefined) return "bg-gray-100 text-gray-400";
  if (score >= 75) return "bg-teal-100 text-teal-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

function statusBadge(status) {
  const map = {
    pending:    "bg-gray-100 text-gray-400",
    simulating: "bg-violet-100 text-violet-600 animate-pulse",
    done:       "bg-blue-100 text-blue-600",
    published:  "bg-teal-100 text-teal-700",
  };
  return map[status] || "bg-gray-100 text-gray-400";
}

export default function CreatorDashboard() {
  const { user, logout } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    api.get("/virality/videos")
      .then(({ data }) => setVideos(data))
      .finally(() => setLoadingVideos(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-charcoal">Studio</h1>
            <p className="text-gray-400 text-sm">{user?.name}</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-burgundy transition">
            Sign out
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            to="/creator/upload"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-burgundy/40 transition group"
          >
            <div className="w-9 h-9 bg-burgundy/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-burgundy/20 transition">
              <span className="text-lg">📷</span>
            </div>
            <p className="font-medium text-sm text-charcoal">Upload Transformation</p>
            <p className="text-xs text-gray-400 mt-0.5">Before / After pair</p>
          </Link>
          <Link
            to="/creator/upload"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-charcoal/40 transition group"
          >
            <div className="w-9 h-9 bg-charcoal/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-charcoal/20 transition">
              <span className="text-lg">🎬</span>
            </div>
            <p className="font-medium text-sm text-charcoal">Upload Video</p>
            <p className="text-xs text-gray-400 mt-0.5">Simulate virality before posting</p>
          </Link>
        </div>

        {/* Videos list */}
        <div>
          <h2 className="text-sm font-semibold text-charcoal mb-3">Your Videos</h2>
          {loadingVideos ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-burgundy/20 border-t-burgundy rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-3xl mb-2">🎬</p>
              <p className="text-sm text-gray-400">No videos yet. Upload one to simulate virality.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map(video => (
                <Link
                  key={video.id}
                  to={`/creator/video/${video.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:border-burgundy/30 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-charcoal truncate group-hover:text-burgundy transition">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {video.created_at ? new Date(video.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(video.status)}`}>
                      {video.status}
                    </span>
                    {video.virality_score != null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scoreColor(video.virality_score)}`}>
                        {video.virality_score.toFixed(0)}
                      </span>
                    )}
                    {video.status === "pending" && (
                      <span className="text-xs text-burgundy">Simulate →</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
