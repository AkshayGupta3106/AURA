import { useState } from "react";
import api from "../api/axios";

// ── Transformation Upload ──────────────────────────────────────────────────────
function TransformationUpload() {
  const [fields, setFields] = useState({
    artist_name: "",
    service_type: "",
    hair_texture_tag: "",
  });
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [status, setStatus] = useState(null);   // null | "loading" | "ok" | "err"
  const [message, setMessage] = useState("");

  function handleChange(e) {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!beforeFile || !afterFile) {
      setMessage("Select both before and after images.");
      setStatus("err");
      return;
    }

    setStatus("loading");
    const fd = new FormData();
    fd.append("before_image", beforeFile);
    fd.append("after_image", afterFile);
    fd.append("artist_name", fields.artist_name);
    fd.append("service_type", fields.service_type);
    if (fields.hair_texture_tag) fd.append("hair_texture_tag", fields.hair_texture_tag);

    try {
      const { data } = await api.post("/upload/transformation", fd);
      setMessage(`Transformation #${data.id} uploaded! Style description will be generated in Day 2.`);
      setStatus("ok");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Upload failed");
      setStatus("err");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-display text-xl text-charcoal mb-4">Upload Before / After</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Before Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBeforeFile(e.target.files[0])}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cream file:text-charcoal hover:file:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">After Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterFile(e.target.files[0])}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cream file:text-charcoal hover:file:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Artist Name</label>
          <input
            name="artist_name"
            value={fields.artist_name}
            onChange={handleChange}
            required
            placeholder="e.g. Preethi"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
            <select
              name="service_type"
              value={fields.service_type}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy bg-white transition"
            >
              <option value="">Select...</option>
              <option>Balayage</option>
              <option>Keratin</option>
              <option>Brazilian Blowout</option>
              <option>Hair Color</option>
              <option>Haircut</option>
              <option>Hair Extensions</option>
              <option>Perm</option>
              <option>Highlights</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hair Texture</label>
            <select
              name="hair_texture_tag"
              value={fields.hair_texture_tag}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy bg-white transition"
            >
              <option value="">Any</option>
              <option>Straight</option>
              <option>Wavy</option>
              <option>Curly</option>
              <option>Coily</option>
            </select>
          </div>
        </div>

        {status && (
          <p className={`text-sm rounded-lg px-4 py-2 ${status === "ok" ? "bg-green-50 text-green-700" : status === "err" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
            {status === "loading" ? "Uploading..." : message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-burgundy text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
        >
          {status === "loading" ? "Uploading..." : "Upload Transformation"}
        </button>
      </form>
    </div>
  );
}

// ── Video Upload ───────────────────────────────────────────────────────────────
function VideoUpload() {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!videoFile) {
      setMessage("Select a video file.");
      setStatus("err");
      return;
    }

    setStatus("loading");
    const fd = new FormData();
    fd.append("video", videoFile);
    fd.append("title", title);

    try {
      const { data } = await api.post("/upload/video", fd);
      setMessage(`Video #${data.id} "${data.title}" uploaded with status: ${data.status}`);
      setStatus("ok");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Upload failed");
      setStatus("err");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-display text-xl text-charcoal mb-4">Upload Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Video Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Summer Balayage 2024"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Video File (MP4 / MOV / WebM)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cream file:text-charcoal hover:file:bg-gray-100"
          />
          {videoFile && (
            <p className="text-xs text-gray-400 mt-1">
              {videoFile.name} — {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}
        </div>

        {status && (
          <p className={`text-sm rounded-lg px-4 py-2 ${status === "ok" ? "bg-green-50 text-green-700" : status === "err" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
            {status === "loading" ? "Uploading video..." : message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-charcoal text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-opacity-80 transition disabled:opacity-50"
        >
          {status === "loading" ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}

// ── Main Upload Page ───────────────────────────────────────────────────────────
export default function UploadPage() {
  const [tab, setTab] = useState("transformation");

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl text-charcoal mb-1">Studio</h1>
        <p className="text-gray-500 text-sm mb-8">Upload your work to start getting bookings.</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("transformation")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              tab === "transformation"
                ? "bg-burgundy text-white"
                : "bg-white border border-gray-200 text-charcoal hover:border-burgundy"
            }`}
          >
            Before / After
          </button>
          <button
            onClick={() => setTab("video")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              tab === "video"
                ? "bg-charcoal text-white"
                : "bg-white border border-gray-200 text-charcoal hover:border-charcoal"
            }`}
          >
            Video
          </button>
        </div>

        {tab === "transformation" ? <TransformationUpload /> : <VideoUpload />}
      </div>
    </div>
  );
}
