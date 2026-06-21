import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function VideoUploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      // Auto-fill title with filename if empty
      if (!title) {
        const nameWithoutExt = e.target.files[0].name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!videoFile) {
      setStatus("err");
      setMessage("Please select a video file first.");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", title);

    setStatus("loading");
    setMessage("");
    setUploadProgress(0);

    try {
      const { data } = await api.post("/virality/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setStatus("ok");
      setMessage("Video uploaded successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/creator/video/${data.id}`);
      }, 1500);
    } catch (err) {
      setStatus("err");
      setMessage(err.response?.data?.detail || "Video upload failed. Make sure you have created your salon first.");
    }
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/creator/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-burgundy transition"
          >
            <span className="mr-1.5">←</span> Back to Studio
          </Link>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl text-charcoal">Upload Video</h1>
            <p className="text-sm text-gray-500 mt-1">
              Simulate performance before publishing your next hair or beauty video.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Video Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Balayage Transformation Session"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-burgundy transition bg-gray-50/50"
              />
            </div>

            {/* File Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Select Video File
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/30 hover:bg-gray-50/50 transition cursor-pointer relative group">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="text-3xl text-gray-400 group-hover:scale-110 transition duration-200">
                    🎬
                  </div>
                  <div className="text-sm font-medium text-charcoal">
                    {videoFile ? videoFile.name : "Click to browse or drag video here"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {videoFile
                      ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`
                      : "MP4, MOV, WEBM up to 200MB"}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress / Messages */}
            {status === "loading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Uploading video...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-burgundy h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {status !== "idle" && status !== "loading" && (
              <div
                className={`text-sm rounded-xl px-4 py-3 font-medium ${
                  status === "ok"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex-1 bg-burgundy text-white rounded-xl py-3 text-sm font-semibold hover:bg-opacity-95 transition disabled:opacity-50 shadow-sm"
              >
                {status === "loading" ? "Uploading..." : "Upload & Analyze"}
              </button>
              <Link
                to="/creator/dashboard"
                className="px-6 py-3 text-sm font-semibold text-gray-500 hover:text-charcoal bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200/50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
