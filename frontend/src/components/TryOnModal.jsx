import { useState, useRef, useEffect, useCallback } from "react";
import api from "../api/axios";

const PHASES = { IDLE: "idle", LOADING: "loading", RESULT: "result", BOOKED: "booked" };

export default function TryOnModal({ transformation, onClose }) {
  const [tab, setTab] = useState("upload");         // "upload" | "webcam"
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState("");
  const [webcamActive, setWebcamActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const dropRef = useRef(null);

  // ── webcam lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === "webcam") startWebcam();
    else stopWebcam();
    return () => stopWebcam();
  }, [tab]);

  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamActive(true);
    } catch {
      setError("Webcam access denied. Use file upload instead.");
      setTab("upload");
    }
  }

  function stopWebcam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
  }

  function captureWebcam() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
      setSelfieFile(file);
      setSelfiePreview(canvas.toDataURL("image/jpeg"));
    }, "image/jpeg", 0.92);
  }

  // ── file drag-drop ────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function loadFile(file) {
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
    setError("");
  }

  // ── try-on call ───────────────────────────────────────────────────────────────
  async function runTryOn() {
    if (!selfieFile) { setError("Capture or upload a selfie first."); return; }

    setError("");
    setPhase(PHASES.LOADING);

    const fd = new FormData();
    fd.append("selfie", selfieFile);
    fd.append("transformation_id", transformation.id);

    try {
      const { data } = await api.post("/mirror/try-on", fd, { timeout: 90000 });
      setResultUrl(data.result_url);
      setPhase(PHASES.RESULT);
    } catch (err) {
      setError(err.response?.data?.detail || "Try-on failed. The model may be cold — retry in 30s.");
      setPhase(PHASES.IDLE);
    }
  }

  // ── book ──────────────────────────────────────────────────────────────────────
  async function bookLook() {
    const fd = new FormData();
    fd.append("transformation_id", transformation.id);
    try {
      await api.post("/mirror/book", fd);
      setPhase(PHASES.BOOKED);
    } catch (err) {
      setError(err.response?.data?.detail || "Booking failed");
    }
  }

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl text-charcoal">Try On</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {transformation.service_type} by {transformation.artist_name}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition text-lg">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Reference after-image */}
          <div className="flex gap-3 items-center">
            <img
              src={transformation.after_image_url}
              alt="target style"
              className="w-16 h-16 rounded-xl object-cover border border-gray-100"
            />
            <div>
              <p className="text-xs font-medium text-charcoal">Target Style</p>
              {transformation.style_description ? (
                <p className="text-xs text-gray-400 leading-relaxed mt-0.5 line-clamp-2">
                  {transformation.style_description}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {transformation.hair_texture_tag} · {transformation.service_type}
                </p>
              )}
            </div>
          </div>

          {/* ── Phase: idle / upload ── */}
          {phase !== PHASES.LOADING && phase !== PHASES.RESULT && phase !== PHASES.BOOKED && (
            <>
              {/* Tabs */}
              <div className="flex gap-2">
                {["upload", "webcam"].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setSelfiePreview(null); setSelfieFile(null); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                      tab === t ? "bg-charcoal text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {t === "upload" ? "📁 Upload" : "📷 Webcam"}
                  </button>
                ))}
              </div>

              {/* Upload tab */}
              {tab === "upload" && (
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-burgundy/50 transition cursor-pointer"
                  onClick={() => document.getElementById("selfie-input").click()}
                >
                  <input
                    id="selfie-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {selfiePreview ? (
                    <img src={selfiePreview} alt="selfie" className="mx-auto w-40 h-40 object-cover rounded-xl" />
                  ) : (
                    <div className="py-4">
                      <div className="text-4xl mb-2">🤳</div>
                      <p className="text-sm text-gray-500">Drop a selfie or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG · PNG · WebP up to 10MB</p>
                    </div>
                  )}
                </div>
              )}

              {/* Webcam tab */}
              {tab === "webcam" && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {selfiePreview && (
                      <img src={selfiePreview} alt="captured" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  {!selfiePreview ? (
                    <button
                      onClick={captureWebcam}
                      disabled={!webcamActive}
                      className="w-full py-2.5 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-opacity-80 transition disabled:opacity-40"
                    >
                      📸 Capture
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}
                      className="w-full py-2 text-xs text-gray-400 hover:text-burgundy transition"
                    >
                      Retake
                    </button>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={runTryOn}
                disabled={!selfieFile}
                className="w-full bg-burgundy text-white rounded-xl py-3 text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-40"
              >
                ✨ Try This Look
              </button>
            </>
          )}

          {/* ── Phase: loading ── */}
          {phase === PHASES.LOADING && (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-burgundy/20 border-t-burgundy rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-sm font-medium text-charcoal">Running the mirror…</p>
                <p className="text-xs text-gray-400 mt-1">
                  AI model may need 20–40s to wake up on first use
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <img src={selfiePreview} alt="your selfie" className="w-20 h-20 rounded-xl object-cover opacity-60" />
                <div className="flex items-center text-gray-300 text-xl">→</div>
                <div className="w-20 h-20 rounded-xl bg-gray-100 animate-pulse" />
              </div>
            </div>
          )}

          {/* ── Phase: result ── */}
          {phase === PHASES.RESULT && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 text-center mb-2">You</p>
                  <img src={selfiePreview} alt="original" className="w-full aspect-square object-cover rounded-2xl" />
                </div>
                <div>
                  <p className="text-xs text-burgundy font-medium text-center mb-2">After AURA ✨</p>
                  <img
                    src={resultUrl}
                    alt="result"
                    className="w-full aspect-square object-cover rounded-2xl border-2 border-burgundy/30"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setPhase(PHASES.IDLE); setResultUrl(null); setSelfiePreview(null); setSelfieFile(null); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={bookLook}
                  className="flex-1 py-2.5 bg-burgundy text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition"
                >
                  Book This Look →
                </button>
              </div>
            </div>
          )}

          {/* ── Phase: booked ── */}
          {phase === PHASES.BOOKED && (
            <div className="py-10 text-center space-y-3">
              <div className="text-5xl">🎉</div>
              <p className="font-display text-xl text-charcoal">You&apos;re booked!</p>
              <p className="text-sm text-gray-400">
                The salon will reach out to confirm your appointment.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-2.5 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-opacity-80 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
