import { useState } from "react";
import api from "../api/axios";

export default function SalonSetupForm({
  onCreated,
  heading = "Create your salon",
  description = "Add your salon details to unlock uploads.",
}) {
  const [form, setForm] = useState({
    name: "",
    city: "Bangalore",
    neighborhood: "",
    description: "",
  });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const { data } = await api.post("/virality/salon", form);
      setStatus("ok");
      setMessage("Salon created.");
      onCreated?.(data);
    } catch (err) {
      setStatus("err");
      setMessage(err.response?.data?.detail || "Salon creation failed");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl text-charcoal">{heading}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Salon Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. AURA Studio"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              placeholder="Bangalore"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Neighborhood</label>
            <input
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              placeholder="e.g. Indiranagar"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="What makes your salon special?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy transition resize-none"
          />
        </div>

        {status !== "idle" && (
          <p
            className={`text-sm rounded-lg px-4 py-2 ${
              status === "ok"
                ? "bg-green-50 text-green-700"
                : status === "err"
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-50 text-gray-500"
            }`}
          >
            {status === "loading" ? "Creating salon..." : message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-burgundy text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
        >
          {status === "loading" ? "Creating..." : "Create Salon"}
        </button>
      </form>
    </div>
  );
}
