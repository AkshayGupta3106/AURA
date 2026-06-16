# AURA — Hackathon Task Board
**Duration:** 3–5 Days | **Team:** Students | **Budget:** ₹0

---

## Free API Stack (Zero Cost)

| Purpose | Tool | Why |
|---|---|---|
| Hairstyle transformation | HuggingFace Inference API (free tier) | `timbrooks/instruct-pix2pix` — takes customer photo + text instruction, outputs transformed image |
| Style description from "after" photo | OpenRouter → `google/gemini-2.0-flash-exp` (free) | Vision model, reads after-photo and writes style description automatically |
| Persona simulation (virality) | OpenRouter → `google/gemini-2.0-flash-exp` (free) | Same model, prompted as different audience personas to simulate engagement behavior |
| Video frame extraction | `opencv-python` or `moviepy` | Local Python library, free, no API needed — extracts frames from uploaded video |
| Background/hair segmentation | `rembg` Python library | Local, free, no API needed |
| Image/video storage | Local filesystem `/static/` | Cloudinary free tier if you want persistent URLs |
| Database | SQLite via SQLAlchemy | Zero setup, file-based, perfect for demo |

---

## Two AI Pipelines — Plain English

**Mirror Pipeline (Customer side):**
1. Creator uploads after-photo → Gemini Flash describes the hairstyle in plain text
2. Customer uploads selfie → FastAPI sends selfie + description to instruct-pix2pix on HuggingFace
3. HuggingFace returns transformed image → show it next to the original after-photo
4. Customer hits Book → done

**Virality Pipeline (Creator side):**
1. Creator uploads a video before posting → FastAPI extracts 4–5 key frames using opencv
2. Each frame goes to Gemini Flash, prompted as 5 different city personas (different age, neighborhood, spending habit)
3. Each persona returns a JSON: `{watch_through: 0-100, liked: bool, shared: bool, skipped_at: seconds or null, comment: string}`
4. FastAPI aggregates all persona responses → computes virality score (0–100)
5. Creator sees: score, simulated comments, drop-off timeline, and what to fix
6. Creator edits video, re-runs simulation, publishes when satisfied

---

## Day 1 — Foundation (Backend + DB + Upload)

**Goal by end of day:** Auth works, creator can upload before/after photos and a video, all stored in DB.

### 1.1 Project Setup
- [ ] Init FastAPI project, folder structure: `/app`, `/routers`, `/models`, `/services`, `/static`
- [ ] Install deps: `fastapi`, `uvicorn`, `sqlalchemy`, `python-multipart`, `pillow`, `rembg`, `opencv-python`, `requests`, `python-jose`
- [ ] Init React project with Vite, install: `tailwindcss`, `axios`, `react-router-dom`, `framer-motion`
- [ ] Connect React dev server to FastAPI (CORS setup in FastAPI)

### 1.2 Database Models (SQLite)
- [ ] `User` table: id, name, email, password_hash, role (`creator` or `customer`)
- [ ] `Salon` table: id, owner_id, name, city, neighborhood, description
- [ ] `Transformation` table: id, salon_id, artist_name, service_type, hair_texture_tag, before_image_url, after_image_url, style_description, try_on_count, created_at
- [ ] `Video` table: id, salon_id, creator_id, video_url, title, status (`pending` / `simulating` / `done` / `published`), virality_score, created_at
- [ ] `SimulationResult` table: id, video_id, persona_name, persona_profile, watch_through, liked, shared, skipped_at, comment
- [ ] `Booking` table: id, customer_id, transformation_id, salon_id, status, booked_at
- [ ] Run `Base.metadata.create_all()` and verify all tables exist

### 1.3 Auth
- [ ] `POST /auth/register` — email + password + role
- [ ] `POST /auth/login` — returns JWT
- [ ] Auth middleware (decode JWT, attach user to request)
- [ ] Basic login + register page in React (functional only, no design yet)

### 1.4 Creator Upload Flow
- [ ] `POST /upload/transformation` — accepts before image, after image, service_type, hair_texture_tag, artist_name
- [ ] `POST /upload/video` — accepts video file + title, saves to `/static/videos/`, creates `Video` record with status `pending`
- [ ] Simple React upload form: file inputs, dropdowns, submit button

---

> ### ✅ DAY 1 CHECKPOINT
> Open Postman and verify these manually:
> - Register a creator account → `/auth/register` returns 200?
> - Log in → get JWT back?
> - Upload a before/after image pair → new row in Transformation table?
> - Upload a short video file → new row in Video table with status `pending`?
>
> **All four YES → move to Day 2.**
> **Any NO → stay here. Everything downstream depends on these.**

---

## Day 2 — The Mirror Feature (Customer AI Pipeline)

**Goal by end of day:** Customer uploads selfie → gets back a transformed hairstyle image. This is the consumer-facing wow moment.

### 2.1 OpenRouter — Style Extraction
- [ ] Sign up at openrouter.ai, get free API key (no card required for free models)
- [ ] Write `services/style_extractor.py`
- [ ] Call `google/gemini-2.0-flash-exp` via OpenRouter with the after-photo as base64
- [ ] Prompt: *"Describe only the hairstyle in this image in 1–2 sentences. Include: hair type (curly/straight/wavy), length, color, texture, and volume. Be specific and visual. No other commentary."*
- [ ] Save returned description into `Transformation.style_description` in DB
- [ ] Hook this into the upload endpoint — runs automatically after image upload

### 2.2 HuggingFace — Transformation Engine
- [ ] Sign up at huggingface.co, get free API token
- [ ] Write `services/mirror.py`
- [ ] Use `timbrooks/instruct-pix2pix` via HF Inference API
- [ ] Instruction format: *"Change this person's hair to: {style_description}. Keep the face, skin tone, and background exactly the same."*
- [ ] Handle cold starts — first call takes 20–40s, set timeout to 60s with one retry

### 2.3 Mirror Endpoint
- [ ] `POST /mirror/try-on` — accepts customer selfie + transformation_id
- [ ] Fetch `style_description` from DB, call HuggingFace, return result image URL
- [ ] Increment `try_on_count` on the Transformation record
- [ ] Error handling: HF failure returns clean message, not raw traceback

### 2.4 Mirror UI
- [ ] Before/after gallery grid on salon profile
- [ ] "Try on me" button on each after-photo card → opens modal
- [ ] Modal: file upload or webcam capture for selfie
- [ ] Loading state: *"Visualizing your look..."* with pulsing animation
- [ ] Result: generated image (left) side-by-side with original after-photo (right)
- [ ] "Book this look" button below result

---

> ### ✅ DAY 2 CHECKPOINT
> Run this flow end to end:
> 1. Upload before/after pair → is `style_description` populated in DB? Read it. Does it sound accurate?
> 2. Hit `/mirror/try-on` with a real selfie → image comes back?
> 3. Does the output loosely show the selfie's face with a different hairstyle?
>
> **Output quality doesn't need to be photorealistic. It needs to be clearly real and functional.**
> **HuggingFace timing out? → Switch to `stable-diffusion-v1-5` img2img on HF. Slightly lower quality but faster cold starts.**

---

## Day 3 — Virality Simulation Engine (Creator AI Pipeline)

**Goal by end of day:** Creator uploads a video, AI personas watch it, a virality score appears with breakdown. This is the innovation that separates AURA from every other beauty app.

### 3.1 Define the 5 Personas (Hardcode These)

Write these in `services/personas.py` as a Python list of dicts. These are your synthetic audience for a Bangalore/Mumbai context:

```
Priya   — 24yo, working professional, Koramangala/Bandra, scrolls fast, price-aware, shares rarely
Ananya  — 31yo, new mom, Juhu/Whitefield, trusts recommendations, forwards to WhatsApp groups
Riya    — 19yo, college student, Indiranagar/Powai, trend-follower, heavy sharer, low attention span
Meera   — 28yo, beauty enthusiast, HSR Layout/Versova, leaves detailed comments, saves everything
Divya   — 35yo, budget-conscious, Malad/Electronic City, skips expensive content in first 5 seconds
```

Each persona dict has: `name`, `age`, `location`, `income_level`, `attention_span_seconds`, `sharing_tendency` (low/medium/high), `price_sensitivity` (low/medium/high), `personality_blurb` (2-sentence description used in the prompt).

### 3.2 Video Frame Extraction
- [ ] Write `services/video_processor.py`
- [ ] Use `opencv-python` to open the uploaded video file
- [ ] Extract 1 frame every 5 seconds (so a 30s video gives 6 frames)
- [ ] Resize frames to 512x512, save as JPG to `/static/frames/{video_id}/`
- [ ] Return list of frame paths and total video duration

### 3.3 Persona Simulation — Core Logic
- [ ] Write `services/persona_simulator.py`
- [ ] For each persona, build a prompt that includes: the persona's full description + all extracted frames as base64 images
- [ ] Prompt structure:

```
You are {persona_name}, {persona_blurb}.
You are scrolling Instagram Reels and this beauty salon video appears.
Watch it (represented by these frames from a {duration}-second video) and respond ONLY in valid JSON:
{
  "watch_through": <integer 0-100, percentage of video you watched>,
  "liked": <true or false>,
  "shared": <true or false>,
  "skipped_at": <seconds into video when you stopped, or null if you watched till end>,
  "comment": <your comment text, or null if you wouldn't comment>
}
No explanation. JSON only.
```

- [ ] Call `google/gemini-2.0-flash-exp` via OpenRouter for each persona (5 sequential or concurrent calls)
- [ ] Parse JSON response for each persona, save each as a `SimulationResult` row in DB
- [ ] Handle JSON parse failures gracefully (Gemini sometimes adds preamble — strip it)

### 3.4 Virality Score Calculation
- [ ] Write `services/virality_scorer.py`
- [ ] After all 5 persona results are saved, compute:

```
hook_rate       = % of personas where skipped_at is null OR skipped_at > 5   → weight 30%
completion_rate = average watch_through across all personas                    → weight 25%
social_velocity = (total likes + total shares) / (2 × total personas)         → weight 25%
sentiment_score = % of comments that are non-null and non-negative             → weight 20%

virality_score  = (hook_rate×0.30 + completion_rate×0.25 + social_velocity×0.25 + sentiment_score×0.20) × 100
```

- [ ] Round to integer, clamp between 0 and 100
- [ ] Save score into `Video.virality_score`, update status to `done`

### 3.5 Simulation Endpoints
- [ ] `POST /virality/simulate/{video_id}` — triggers the full pipeline (frame extraction → persona sim → scoring), runs as FastAPI `BackgroundTask`, immediately returns `{status: "simulating"}`
- [ ] `GET /virality/result/{video_id}` — frontend polls this every 3 seconds; returns status + score + all persona results once done
- [ ] `POST /virality/publish/{video_id}` — creator confirms publish, sets Video status to `published`, makes it visible in the consumer discovery feed

### 3.6 Virality UI — Creator Studio
- [ ] Route: `/creator/studio`
- [ ] Video upload card: drag-and-drop or file picker, title input, "Run Simulation" button
- [ ] While simulating: show 5 persona avatar cards, each with a subtle pulsing animation — gives the feel of "real people watching"
- [ ] On result, reveal the score with an animated count-up (0 → final score over 1.5 seconds using Framer Motion) — this single interaction must feel satisfying
- [ ] Below score: 3 panels

**Panel 1 — Score Breakdown:** Four bars (Hook Rate / Completion / Social Velocity / Sentiment) with values

**Panel 2 — Persona Cards:** One card per persona showing their avatar, watch_through %, liked/shared icons, and their comment (if any). Comments appear one by one with 300ms delay between each — fake streaming effect using `setTimeout`

**Panel 3 — Drop-off Timeline:** A simple horizontal bar (the video duration) with colored markers showing at what timestamp each persona stopped watching. If Riya dropped at 8s and Divya dropped at 3s, you can see the video loses certain audiences early.

- [ ] Score diagnostic text below the number (hardcode 3 tiers):
  - Below 50: *"This video needs rework. Most personas dropped off early — check the first 5 seconds."*
  - 50–74: *"Solid content, limited reach. Try adding price and location in the first 3 seconds."*
  - 75+: *"Strong content. This has viral potential — publish and consider a paid boost."*
- [ ] "Re-simulate" button (after creator edits their video and re-uploads)
- [ ] "Publish to AURA" button — only active when score exists

---

> ### ✅ DAY 3 CHECKPOINT
> Run the virality pipeline on a real video (use any short beauty Reel or YouTube Short downloaded for testing):
> 1. Upload video → frames extracted and saved to `/static/frames/`? Count them — should be roughly `duration_in_seconds / 5`
> 2. Simulation triggered → 5 rows appear in `SimulationResult` table?
> 3. Open each row — do the persona responses make sense? Is Riya sharing more than Divya? Is the JSON valid?
> 4. Virality score computed and saved in `Video.virality_score`?
> 5. Does the UI show the score count-up and persona cards?
>
> **If persona JSON is malformed → your prompt needs stricter formatting instruction. Add: "Return ONLY raw JSON. No markdown. No backticks. No explanation."**
>
> **If score feels wrong (always 0 or always 100) → print each component separately and debug the formula, not the prompt.**

---

## Day 4 — Consumer Flow + Salon Profile

**Goal by end of day:** Customer can browse salons, try on a style, and reach booking confirmation. Published videos also appear in a discovery feed.

### 4.1 Salon Discovery APIs
- [ ] `GET /salons` — list with name, neighborhood, service count
- [ ] `GET /salons/{salon_id}` — salon detail + transformations + published videos
- [ ] `GET /salons?city=bangalore&service=curly` — simple SQL LIKE filter

### 4.2 Salon Profile Page
- [ ] Route: `/salon/:id`
- [ ] Hero: salon name, neighborhood, service tags
- [ ] Before/After gallery grid — clicking after-photo triggers Mirror modal
- [ ] Video tab — shows published videos (status = `published`) inline with autoplay on hover
- [ ] Mirror modal integrated (from Day 2)

### 4.3 Booking Flow
- [ ] `POST /bookings` — customer_id, transformation_id, salon_id
- [ ] Booking confirmation page: show selected style + salon + hardcoded time slot ("Saturday, 3 PM") + Mirror result image
- [ ] `GET /bookings/me` — booking history for customer profile

### 4.4 Creator Dashboard
- [ ] Route: `/creator/dashboard`
- [ ] List of uploaded transformations + try_on_count per transformation
- [ ] List of uploaded videos with virality score badge and publish status
- [ ] Links to Studio (upload new video) and upload new transformation

---

> ### ✅ DAY 4 CHECKPOINT
> Full demo run — no touching the code, just using the app:
> 1. Creator: upload before/after → see it in dashboard
> 2. Creator: upload video → run simulation → see virality score → publish
> 3. Customer: browse salon → see published video → click "Try on me" on a transformation → get Mirror result → book
>
> **Both flows should complete cleanly in under 4 minutes total.**
> **If booking flow feels clunky → cut it down. One screen with a confirm button is enough. The judges care about Mirror and Virality, not your calendar picker.**

---

## Day 5 — UI Polish + Demo Hardening

**Goal by end of day:** Looks premium, nothing crashes, seed data is ready, backup demo exists.

### 5.1 Design Pass (Warm Glassmorphism)
- [ ] Tailwind config: off-white `#FAF7F4`, burgundy `#6B2737`, gold `#C4A35A`, charcoal `#2D2D2D`
- [ ] Glassmorphism card style: `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl`
- [ ] Fonts: Playfair Display (headings via Google Fonts) + Inter (body)
- [ ] Warm gradient backgrounds: `from-[#FAF7F4] to-[#F0E6DC]`
- [ ] Virality score counter animation: count-up over 1.5s, ease-out — this is the demo's most important interaction
- [ ] Persona cards: staggered fade-in, 150ms delay between each card
- [ ] Mirror result: fade-in reveal (0.6s ease)

### 5.2 Seed Data
- [ ] `seed.py`: 1 demo salon, 1 creator account, 4 transformation records (download free stock hair photos), 1 customer account
- [ ] Pre-generate `style_description` for all seeded transformations — never depend on live OpenRouter for seeded data
- [ ] Pre-run one full virality simulation on a seeded video, save results — for demo, this should appear instantly without waiting

### 5.3 Demo Hardening
- [ ] If HuggingFace times out → show one pre-generated cached result image (silent fallback, judges won't know)
- [ ] If OpenRouter persona call fails → show pre-saved persona results from seed data
- [ ] All error states: human-readable message, never raw JSON
- [ ] Mobile responsive: salon profile and Mirror modal must work on phone
- [ ] Test entire flow 5 times back to back — does anything break on repeated use?

### 5.4 Pitch Prep
- [ ] Record 60-second backup screen recording of full demo
- [ ] One-paragraph pitch ready: *"Customers no longer imagine themselves in a transformation — they see it. Creators no longer guess if their content will work — they simulate it. AURA closes both gaps with AI, before a single booking is made or a single video is posted."*
- [ ] Answer ready for "how does the AI work?" → two sentences max, no jargon

---

> ### ✅ FINAL CHECKPOINT — Before You Walk Into the Hackathon
> Answer all of these. Every single one must be YES.
>
> 1. Can a creator upload a before/after pair and see it in their dashboard?
> 2. Can a creator upload a video, run simulation, see a virality score with persona breakdown?
> 3. Does re-running simulation on the same video work without crashing?
> 4. Does the Mirror feature return a transformed image for a real selfie?
> 5. Can a customer go from gallery → try-on → booking confirmation in under 2 minutes?
> 6. Do both API failures (HuggingFace + OpenRouter) have silent fallbacks?
> 7. Does the virality score count-up animation feel satisfying? (Show someone. Ask them. Their face will tell you.)
> 8. Does the app look warm and premium — not like a Tailwind template?
>
> **Any NO → fix it before anything else. A broken demo with a great idea loses. A working demo with a decent idea wins.**

---

## What NOT to Build

- Real payment processing — confirmation screen is enough
- Geolocation or city detection — hardcode Bangalore
- SMS/email notifications
- Multiple AI model comparisons or A/B testing
- More than 5 personas — diminishing returns and slower simulation
- Mobile app — responsive web is fine
- User reviews — out of scope

---

## The Two Things That Win This Hackathon

**Mirror** closes the confidence gap for customers. Judge uploads their photo, sees themselves with a new hairstyle generated from a real salon's actual work. That moment is visceral.

**Virality Simulation** closes the uncertainty gap for creators. Judge watches the score count up, reads Riya's comment ("omg love the volume but where is this salon??"), sees Divya dropped off at 3 seconds. That moment is useful in a way that's immediately understood.

One feature makes the audience trust the product. The other makes creators need it. Together they're a complete pitch. Everything else in the codebase exists to support these two moments.
