import { useParams, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(!state?.transformation);

  useEffect(() => {
    if (!state?.transformation) {
      api
        .get(`/bookings/${bookingId}`)
        .then((r) => setBooking(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [bookingId, state]);

  const resultUrl = state?.resultUrl;
  const t = state?.transformation || booking;
  const salonName = state?.salonName || booking?.salon_name;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6B2737] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <div className="max-w-lg mx-auto px-6 pb-12">
        {/* Success badge */}
        <div className="text-center pt-12 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]" style={{ fontFamily: "Playfair Display, serif" }}>
            Booking Confirmed
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Saturday, 3 PM · See you there</p>
        </div>

        {/* AI try-on result */}
        {resultUrl && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Your AI Preview</p>
            <img
              src={resultUrl}
              alt="AI mirror result"
              className="w-full rounded-2xl shadow-md object-cover max-h-72"
            />
          </div>
        )}

        {/* Details card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Booking Details</p>

          {t?.after_image_url && (
            <div className="flex gap-4 items-start mb-5">
              <img
                src={t.after_image_url}
                alt="Target style"
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-[#2D2D2D]">{t.service_type || "Hair Service"}</p>
                {t.artist_name && (
                  <p className="text-sm text-gray-500 mt-0.5">by {t.artist_name}</p>
                )}
                {t.hair_texture_tag && (
                  <span className="inline-block mt-2 text-xs bg-[#FAF7F4] border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-500">
                    {t.hair_texture_tag}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-3">
            {salonName && (
              <Row label="Salon" value={salonName} />
            )}
            <Row label="Date & Time" value="Saturday, 3 PM" />
            <Row label="Status" value="Confirmed" valueClass="text-green-600" />
            <Row label="Booking ID" value={`#${bookingId}`} valueClass="font-mono text-gray-400 text-sm" />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/profile"
            className="block w-full text-center bg-[#6B2737] text-white py-3 rounded-xl font-medium hover:bg-[#5a1f2d] transition-colors"
          >
            View My Bookings
          </Link>
          <Link
            to="/explore"
            className="block w-full text-center border border-gray-200 text-[#2D2D2D] py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Explore More Salons
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "font-medium text-[#2D2D2D]" }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
