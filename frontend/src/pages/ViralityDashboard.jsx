import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

// ── Constants ─────────────────────────────────────────────────────────────────

const PERSONA_META = {
  Priya:  { emoji: "👩‍💼", bg: "bg-rose-50",   ring: "ring-rose-200",   text: "text-rose-700",   bar: "bg-rose-400",   label: "24 · Working Pro · Koramangala" },
  Ananya: { emoji: "👩‍🍼", bg: "bg-amber-50",  ring: "ring-amber-200",  text: "text-amber-700",  bar: "bg-amber-400",  label: "31 · New Mom · Whitefield" },
  Riya:   { emoji: "🎓",  bg: "bg-violet-50", ring: "ring-violet-200", text: "text-violet-700", bar: "bg-violet-400", label: "19 · College Student · Indiranagar" },
  Meera:  { emoji: "💄",  bg: "bg-teal-50",   ring: "ring-teal-200",   text: "text-teal-700",   bar: "bg-teal-400",   label: "28 · Beauty Creator · HSR Layout" },
  Divya:  { emoji: "🏠",  bg: "bg-slate-50",  ring: "ring-slate-200",  text: "text-slate-600",  bar: "bg-slate-400",  label: "42 · Homemaker · Jayanagar" },
};

const BREAKDOWN_LABELS = {
  hook_rate:       { label: "Hook Rate",       hint: "Watched past 5s",        color: "bg-burgundy" },
  completion:      { label: "Completion",      hint: "Avg watch-through",      color: "bg-amber-500" },
  social_velocity: { label: "Social Velocity", hint: "Share rate",             color: "bg-violet-500" },
  sentiment:       { label: "Sentiment",       hint: "Like rate",              color: "bg-teal-500" },
};

function scoreDiagnostic(score) {
  if (score < 50) return {
    label: "Needs Rework",
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
    text: "Most personas dropped off early — check the first 5 seconds.",
  };
  if (score < 75) return {
    label: "Solid, Limited Reach",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
    text: "Try adding price and location in the first 3 seconds.",
  };
  return {
    label: "Viral Potential",
    color: "text-teal-600",
    bg: "bg-teal-50 border-teal-100",
    text: "Strong content. Publish and consider a paid boost.",
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1500, trigger = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === null || !trigger) return;
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);   // cubic ease-out
      setVal(Math.round(target * ease * 10) / 10);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target, duration, trigger]);
  return val;
}

function useStreamedComments(personas, trigger) {
  const [visible, setVisible] = useState({});
  useEffect(() => {
    if (!trigger || !personas.length) return;
    setVisible({});
    personas.forEach((p, i) => {
      if (p.comment) {
        setTimeout(() => {
          setVisible(prev => ({ ...prev, [p.name]: true }));
        }, 800 + i * 300);
      }
    });
  }, [trigger, personas]);
  return visible;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 52, stroke = 7;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = score >= 75 ? "#0d9488" : score >= 50 ? "#f59e0b" : "#dc2626";

  return (
    <svg width={130} height={130} className="rotate-[-90deg]">
      <circle cx={65} cy={65} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle
        cx={65} cy={65} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

function BreakdownBars({ breakdown, animate }) {
  return (
    <div className="space-y-3">
      {Object.entries(BREAKDOWN_LABELS).map(([key, meta]) => {
        const val = breakdown[key] ?? 0;
        return (
          <div key={key}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-charcoal">{meta.label}</span>
              <span className="text-xs text-gray-400">{meta.hint} · <span className="font-semibold text-charcoal">{val.toFixed(0)}%</span></span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${meta.color} transition-all duration-1000`}
                style={{ width: animate ? `${val}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonaCard({ persona, showComment, index }) {
  const meta = PERSONA_META[persona.name] || PERSONA_META.Priya;
  return (
    <div
      className={`${meta.bg} rounded-2xl p-4 ring-1 ${meta.ring} transition-all duration-500`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5 flex-shrink-0">{meta.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${meta.text}`}>{persona.name}</span>
            <span className="text-xs text-gray-400">{meta.label}</span>
          </div>

          {/* Watch bar */}
          <div className="mt-2 mb-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Watch-through</span>
              <span className="font-medium text-charcoal">{persona.watch_through}%</span>
            </div>
            <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${meta.bar} transition-all duration-1000`}
                style={{ width: `${persona.watch_through}%`, transitionDelay: `${index * 150 + 400}ms` }}
              />
            </div>
          </div>

          {/* Engagement icons */}
          <div className="flex gap-3 mt-2">
            <span className={`text-xs flex items-center gap-1 ${persona.liked ? "text-rose-500" : "text-gray-300"}`}>
              {persona.liked ? "♥" : "♡"} Liked
            </span>
            <span className={`text-xs flex items-center gap-1 ${persona.shared ? "text-violet-500" : "text-gray-300"}`}>
              {persona.shared ? "↗" : "↗"} {persona.shared ? "Shared" : "Didn't share"}
            </span>
            {persona.skipped_at != null && (
              <span className="text-xs text-orange-500">⏭ Stopped at {persona.skipped_at}s</span>
            )}
          </div>

          {/* Comment — streamed in */}
          {persona.comment && (
            <div className={`mt-2 transition-all duration-500 ${showComment ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
              <p className="text-xs italic text-gray-600 bg-white/70 rounded-lg px-3 py-2 leading-relaxed">
                "{persona.comment}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DropoffTimeline({ personas, durationSec }) {
  const duration = durationSec || 30;
  const totalWatchers = personas.length;

  // Build drop-off data: at each persona's skipped_at, one watcher leaves
  const dropoffs = personas
    .filter(p => p.skipped_at != null)
    .sort((a, b) => a.skipped_at - b.skipped_at);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-charcoal">Drop-off Timeline</span>
        <span className="text-xs text-gray-400">{duration}s video</span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-gray-100 rounded-full overflow-visible mb-6">
        {/* Gradient fill showing viewers retained */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 to-teal-200 rounded-full opacity-30"
          style={{ width: "100%" }}
        />

        {/* Tick marks every 5s */}
        {Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => i * 5).map(t => (
          <div
            key={t}
            className="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${(t / duration) * 100}%` }}
          />
        ))}

        {/* Drop-off markers */}
        {dropoffs.map((p, i) => {
          const meta = PERSONA_META[p.name] || PERSONA_META.Priya;
          const leftPct = Math.min((p.skipped_at / duration) * 100, 98);
          return (
            <div
              key={p.name}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-default"
              style={{ left: `${leftPct}%`, zIndex: 10 + i }}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ring-2 ring-white shadow ${meta.bg}`}>
                {meta.emoji}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-20">
                {p.name} left at {p.skipped_at}s
              </div>
            </div>
          );
        })}

        {/* Personas who watched fully */}
        {personas.filter(p => p.skipped_at == null).map((p, i) => {
          const meta = PERSONA_META[p.name] || PERSONA_META.Priya;
          return (
            <div
              key={p.name}
              className="absolute top-1/2 -translate-y-1/2 group cursor-default"
              style={{ right: `${2 + i * 8}%`, zIndex: 20 + i }}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ring-2 ring-white shadow ${meta.bg}`}>
                {meta.emoji}
              </div>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-20">
                {p.name} watched fully ✓
              </div>
            </div>
          );
        })}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-gray-300 -mt-4 px-0">
        <span>0s</span>
        {duration >= 10 && <span>{Math.round(duration / 2)}s</span>}
        <span>{duration}s</span>
      </div>
    </div>
  );
}

// ── Simulating view (pulsing persona cards) ───────────────────────────────────

function SimulatingView() {
  const personas = ["Priya", "Ananya", "Riya", "Meera", "Divya"];
  return (
    <div className="py-8 space-y-4">
      <div className="text-center space-y-2 mb-6">
        <div className="w-10 h-10 border-4 border-burgundy/20 border-t-burgundy rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-charcoal">Simulating your audience…</p>
        <p className="text-xs text-gray-400">5 personas are watching your video right now</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {personas.map((name, i) => {
          const meta = PERSONA_META[name];
          return (
            <div
              key={name}
              className={`${meta.bg} rounded-2xl p-4 ring-1 ${meta.ring} animate-pulse`}
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{meta.emoji}</div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${meta.text} mb-1`}>{name}</div>
                  <div className="text-xs text-gray-400">{meta.label}</div>
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full ${meta.bar} w-1/2 rounded-full animate-pulse`} />
                  </div>
                </div>
                <div className="text-gray-300 text-lg animate-bounce" style={{ animationDelay: `${i * 300}ms` }}>
                  👀
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ViralityDashboard() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [barsVisible, setBarsVisible] = useState(false);
  const resultsRef = useRef(null);

  // Load existing results on mount
  useEffect(() => {
    api.get(`/virality/results/${videoId}`)
      .then(({ data: d }) => {
        setData(d);
        if (d.personas?.length) {
          setTimeout(() => setBarsVisible(true), 300);
        }
      })
      .catch(() => {});
  }, [videoId]);

  const countedScore = useCountUp(
    data?.virality_score ?? null,
    1500,
    !!(data?.personas?.length)
  );
  const visibleComments = useStreamedComments(
    data?.personas ?? [],
    !!(data?.personas?.length)
  );

  async function runSimulation() {
    setError("");
    setSimulating(true);
    setBarsVisible(false);
    try {
      const { data: d } = await api.post(`/virality/simulate/${videoId}`, {}, { timeout: 120000 });
      setData(d);
      setTimeout(() => setBarsVisible(true), 400);
    } catch (err) {
      setError(err.response?.data?.detail || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }

  async function publishVideo() {
    setPublishing(true);
    try {
      await api.post(`/virality/publish/${videoId}`);
      setData(prev => ({ ...prev, status: "published" }));
    } catch (err) {
      setError(err.response?.data?.detail || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const hasResults = data?.personas?.length > 0;
  const diagnostic = data?.virality_score != null ? scoreDiagnostic(data.virality_score) : null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <Link to="/creator/dashboard" className="text-sm text-gray-400 hover:text-charcoal transition">
          ← Dashboard
        </Link>
        <span className="text-gray-200">|</span>
        <span className="text-sm font-medium text-charcoal truncate max-w-xs">
          {data?.title || "Video"}
        </span>
        {data?.status === "published" && (
          <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
            Published ✓
          </span>
        )}
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ── No results yet ── */}
        {!hasResults && !simulating && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
            <div className="text-5xl">🎬</div>
            <div>
              <p className="font-display text-xl text-charcoal">Ready to simulate?</p>
              <p className="text-sm text-gray-400 mt-1">
                5 AI personas will watch your video and tell you how it'll perform.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}
            <button
              onClick={runSimulation}
              className="bg-burgundy text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-opacity-90 transition"
            >
              ✨ Run Simulation
            </button>
          </div>
        )}

        {/* ── Simulating ── */}
        {simulating && <SimulatingView />}

        {/* ── Results ── */}
        {hasResults && !simulating && (
          <div ref={resultsRef} className="space-y-5">

            {/* Score hero */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <ScoreRing score={barsVisible ? (data?.virality_score ?? 0) : 0} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl text-charcoal leading-none">
                      {countedScore.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Virality Score</p>
                  <p className={`text-lg font-display ${diagnostic?.color}`}>{diagnostic?.label}</p>
                  {diagnostic && (
                    <div className={`mt-2 text-xs rounded-xl px-3 py-2 border ${diagnostic.bg} text-gray-600 leading-relaxed`}>
                      {diagnostic.text}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 1 — Score Breakdown */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">Score Breakdown</h3>
              <BreakdownBars breakdown={data?.breakdown ?? {}} animate={barsVisible} />
            </div>

            {/* Panel 2 — Persona Cards */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">
                Audience Reactions
                <span className="font-normal text-gray-400 ml-2">· Comments stream in</span>
              </h3>
              <div className="space-y-3">
                {(data?.personas ?? []).map((p, i) => (
                  <PersonaCard
                    key={p.name}
                    persona={p}
                    showComment={!!visibleComments[p.name]}
                    index={i}
                  />
                ))}
              </div>
            </div>

            {/* Panel 3 — Drop-off Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">Drop-off Timeline</h3>
              <DropoffTimeline personas={data?.personas ?? []} durationSec={data?.duration_sec ?? 30} />
            </div>

            {/* Actions */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2 text-center">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={runSimulation}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-3 text-sm font-medium hover:border-burgundy hover:text-burgundy transition"
              >
                ↺ Re-simulate
              </button>
              <button
                onClick={publishVideo}
                disabled={publishing || data?.status === "published"}
                className="flex-1 bg-charcoal text-white rounded-xl py-3 text-sm font-medium hover:bg-opacity-80 transition disabled:opacity-40"
              >
                {data?.status === "published" ? "Published ✓" : publishing ? "Publishing…" : "Publish to AURA →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
