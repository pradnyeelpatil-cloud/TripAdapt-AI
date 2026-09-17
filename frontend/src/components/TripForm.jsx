import { useState, useEffect } from "react";
import {
  generateItinerary,
  checkTripStatus,
} from "../lib/api";

function TripForm() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activities, setActivities] = useState("");
  const [travelMode, setTravelMode] = useState("car");

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // TRIP STATUS
  // ==================================================

  const [lastChecked, setLastChecked] = useState(null);
  const [nextCheck, setNextCheck] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [tripStatus, setTripStatus] = useState("not_checked");
  const [statusError, setStatusError] = useState("");
  const [statusResult, setStatusResult] = useState(null);

  // ==================================================
  // REAL TRIP STATUS CHECK
  // ==================================================

  const performTripStatusCheck = async () => {
    if (!itinerary) {
      return;
    }

    setCheckingStatus(true);
    setStatusError("");

    try {
      console.log("================================");
      console.log("REAL-TIME STATUS CHECK");
      console.log("================================");

      const tripStatusData = {
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        travelMode: itinerary.travelMode,
        itinerary: itinerary.days,
      };

      console.log(
        "Sending status request:",
        tripStatusData
      );

      // Call the FastAPI endpoint
      const result = await checkTripStatus(
        tripStatusData
      );

      console.log(
        "REAL-TIME STATUS RESPONSE:",
        result
      );

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to check trip status"
        );
      }

      // --------------------------------------------------
      // Save complete status result
      // --------------------------------------------------

      setStatusResult(result);

      // --------------------------------------------------
      // Update weather, news and itinerary
      // --------------------------------------------------

      setItinerary((currentItinerary) => {
        if (!currentItinerary) {
          return currentItinerary;
        }

        return {
          ...currentItinerary,

          // Always use fresh weather
          weather: result.weather,

          // Always use fresh news
          news: result.news,

          // Replace itinerary only when Gemini
          // actually replanned the trip
          days: result.itinerary_changed
            ? result.itinerary
            : currentItinerary.days,
        };
      });

      // --------------------------------------------------
      // Update check time
      // --------------------------------------------------

      const now = new Date();

      setLastChecked(now);

      const next = new Date(
        now.getTime() + 10 * 60 * 1000
      );

      setNextCheck(next);

      // --------------------------------------------------
      // Update trip status
      // --------------------------------------------------

      if (result.itinerary_changed) {
        setTripStatus("changed");

        console.log(
          "🔄 TripAdapt AI automatically replanned the itinerary."
        );

        console.log(
          "Affected days:",
          result.affected_days
        );

        console.log(
          "Reasons:",
          result.reasons
        );
      } else {
        setTripStatus("no_change");

        console.log(
          "🟢 No significant itinerary impact detected."
        );
      }

      console.log(
        "Trip status check completed."
      );

    } catch (error) {
      console.error(
        "REAL-TIME STATUS CHECK FAILED:",
        error
      );

      setTripStatus("error");

      setStatusError(
        error.message ||
          "Unable to check the latest trip status."
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  // ==================================================
  // AUTOMATIC CHECK EVERY 10 MINUTES
  // ==================================================

  useEffect(() => {
    if (!itinerary) {
      return;
    }

    console.log(
      "Automatic trip status monitoring started."
    );

    const interval = setInterval(() => {
      console.log(
        "⏱️ Automatic 10-minute trip status check started."
      );

      performTripStatusCheck();
    }, 10 * 60 * 1000);

    return () => {
      console.log(
        "Automatic trip status monitoring stopped."
      );

      clearInterval(interval);
    };
  }, [itinerary]);

  // ==================================================
  // GENERATE ITINERARY
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setItinerary(null);

    // Reset trip status
    setLastChecked(null);
    setNextCheck(null);
    setCheckingStatus(false);
    setTripStatus("not_checked");
    setStatusError("");
    setStatusResult(null);

    if (new Date(endDate) < new Date(startDate)) {
      setError(
        "End date must be after or equal to the start date."
      );

      return;
    }

    setLoading(true);

    const tripData = {
      destination,
      startDate,
      endDate,
      activities,
      travelMode,
    };

    try {
      const result = await generateItinerary(
        tripData
      );

      console.log(
        "Itinerary:",
        result
      );

      console.log(
        "Weather:",
        result.weather
      );

      console.log(
        "News:",
        result.news
      );

      console.log(
        "Adaptation:",
        result.adaptation
      );

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to generate itinerary"
        );
      }

      setItinerary(result);

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to connect to the backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ==================================================
          INJECTED STYLES (UI ONLY)
      ================================================== */}
      <style>{`
        /* ---------- Form ---------- */
        .trip-form {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(108, 92, 231, 0.12);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(108, 92, 231, 0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation: formReveal 0.7s ease-out;
        }

        @keyframes formReveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .trip-form::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6c5ce7, #00b4d8, #6c5ce7);
          background-size: 200% 100%;
          animation: gradientSlide 4s linear infinite;
        }

        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .trip-form:hover {
          box-shadow: 0 12px 48px rgba(108, 92, 231, 0.18);
          transform: translateY(-2px);
        }

        .trip-form h2 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #1a1a2e, #6c5ce7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .form-description {
          color: #8888aa;
          font-size: 0.9rem;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        /* ---------- Form Group ---------- */
        .form-group {
          margin-bottom: 22px;
          position: relative;
        }

        .form-group label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: #4a4a6a;
          margin-bottom: 8px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .form-group:focus-within label {
          color: #6c5ce7;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 14px 18px;
          background: #ffffff;
          border: 1.5px solid rgba(108, 92, 231, 0.12);
          border-radius: 14px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1a1a2e;
          outline: none;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          -webkit-appearance: none;
          appearance: none;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #b0b0c8;
          font-size: 0.9rem;
        }

        .form-group input:hover,
        .form-group textarea:hover,
        .form-group select:hover {
          border-color: rgba(108, 92, 231, 0.3);
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: #6c5ce7;
          box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.1),
                      0 0 24px rgba(108, 92, 231, 0.08);
          transform: translateY(-1px);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-group select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%236c5ce7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 18px center;
          padding-right: 44px;
        }

        /* ---------- Date Row ---------- */
        .date-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ---------- Error ---------- */
        .form-error {
          background: rgba(255, 107, 107, 0.08);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: #d63031;
          padding: 14px 18px;
          border-radius: 14px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          animation: shakeIn 0.5s ease;
        }

        @keyframes shakeIn {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* ---------- Primary Button ---------- */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #6c5ce7, #00b4d8);
          background-size: 200% 200%;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.3);
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }

        .btn-primary:hover:not(:disabled)::before {
          left: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(108, 92, 231, 0.45);
          background-position: 100% 50%;
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          animation: pulseBtn 1.5s ease-in-out infinite;
        }

        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 4px 16px rgba(108, 92, 231, 0.3); }
          50% { box-shadow: 0 4px 28px rgba(108, 92, 231, 0.55); }
        }

        .trip-form .btn-primary {
          width: 100%;
          padding: 16px 32px;
          font-size: 1rem;
          margin-top: 8px;
        }

        /* ---------- Itinerary Result ---------- */
        .itinerary-result {
          margin-top: 40px;
          animation: resultReveal 0.7s ease-out;
        }

        @keyframes resultReveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .itinerary-result > h2 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #1a1a2e, #00b4d8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 24px;
          text-align: center;
        }

        /* ---------- Trip Status Card ---------- */
        .trip-status-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(108, 92, 231, 0.12);
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(108, 92, 231, 0.1);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }

        .trip-status-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6c5ce7, #00b4d8, #6c5ce7);
          background-size: 200% 100%;
          animation: gradientSlide 4s linear infinite;
        }

        .trip-status-card:hover {
          box-shadow: 0 12px 48px rgba(108, 92, 231, 0.18);
        }

        .trip-status-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .trip-status-header h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .trip-status-neutral {
          color: #8888aa;
          font-size: 0.88rem;
          padding: 8px 14px;
          background: rgba(136, 136, 170, 0.08);
          border-radius: 12px;
          display: inline-block;
        }

        .trip-status-success {
          color: #00b894;
          font-size: 0.88rem;
          font-weight: 700;
          padding: 8px 14px;
          background: rgba(0, 184, 148, 0.08);
          border: 1px solid rgba(0, 184, 148, 0.2);
          border-radius: 12px;
          display: inline-block;
          animation: fadeInStatus 0.5s ease;
        }

        @keyframes fadeInStatus {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .trip-status-error {
          color: #d63031;
          font-size: 0.88rem;
          font-weight: 700;
          padding: 8px 14px;
          background: rgba(255, 107, 107, 0.08);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 12px;
          display: inline-block;
        }

        /* ---------- Trip Status Change ---------- */
        .trip-status-change {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.06), rgba(0, 180, 216, 0.06));
          border: 1px solid rgba(108, 92, 231, 0.15);
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 20px;
          animation: slideDown 0.5s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 800px; }
        }

        .trip-status-change h4 {
          font-size: 1rem;
          font-weight: 800;
          color: #6c5ce7;
          margin-bottom: 10px;
        }

        .trip-status-change p {
          font-size: 0.88rem;
          color: #4a4a6a;
          line-height: 1.7;
          margin-bottom: 6px;
        }

        .trip-status-change strong {
          color: #1a1a2e;
          font-weight: 700;
        }

        .trip-status-change ul {
          margin: 8px 0 0 20px;
          padding: 0;
        }

        .trip-status-change li {
          font-size: 0.85rem;
          color: #4a4a6a;
          line-height: 1.7;
          margin-bottom: 4px;
        }

        /* ---------- Trip Status Info ---------- */
        .trip-status-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid rgba(108, 92, 231, 0.1);
          border-bottom: 1px solid rgba(108, 92, 231, 0.1);
          margin-bottom: 16px;
        }

        .trip-status-info > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .trip-status-info strong {
          font-size: 0.72rem;
          font-weight: 700;
          color: #8888aa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .trip-status-info span {
          font-size: 0.92rem;
          color: #1a1a2e;
          font-weight: 600;
        }

        /* ---------- Trip Status Services ---------- */
        .trip-status-services {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .trip-status-services > div {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #4a4a6a;
          font-weight: 600;
        }

        .trip-status-services span {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(0, 184, 148, 0.1);
          color: #00b894;
        }

        /* ---------- Result Item ---------- */
        .result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #ffffff;
          border: 1px solid rgba(108, 92, 231, 0.1);
          border-radius: 16px;
          margin-bottom: 12px;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .result-item:hover {
          border-color: rgba(108, 92, 231, 0.3);
          box-shadow: 0 6px 20px rgba(108, 92, 231, 0.1);
          transform: translateX(6px);
        }

        .result-item strong {
          font-size: 0.75rem;
          font-weight: 700;
          color: #8888aa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .result-item span {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1a1a2e;
        }

        /* ---------- Weather Card ---------- */
        .weather-card {
          background: linear-gradient(135deg, rgba(0, 180, 216, 0.06), rgba(108, 92, 231, 0.06));
          border: 1px solid rgba(0, 180, 216, 0.15);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 20px;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          animation: cardReveal 0.6s ease-out both;
        }

        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .weather-card::after {
          content: '🌤️';
          position: absolute;
          top: 16px; right: 20px;
          font-size: 1.6rem;
          opacity: 0.35;
          animation: floatIcon 4s ease-in-out infinite;
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .weather-card:hover {
          box-shadow: 0 10px 32px rgba(0, 180, 216, 0.15);
          transform: translateY(-3px);
        }

        .weather-card h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 16px;
        }

        .weather-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .weather-details > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .weather-details strong {
          font-size: 0.7rem;
          font-weight: 700;
          color: #8888aa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .weather-details span {
          font-size: 1.15rem;
          font-weight: 800;
          color: #00b4d8;
        }

        /* ---------- News Card ---------- */
        .news-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(108, 92, 231, 0.12);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 20px;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation: cardReveal 0.6s ease-out 0.1s both;
        }

        .news-card:hover {
          box-shadow: 0 12px 40px rgba(108, 92, 231, 0.15);
          transform: translateY(-3px);
        }

        .news-card h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 16px;
        }

        .news-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .news-item {
          padding: 16px;
          background: rgba(108, 92, 231, 0.03);
          border: 1px solid rgba(108, 92, 231, 0.08);
          border-radius: 16px;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .news-item:hover {
          background: rgba(108, 92, 231, 0.07);
          border-color: rgba(108, 92, 231, 0.2);
          transform: translateX(6px);
        }

        .news-item h4 {
          font-size: 0.92rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .news-item p {
          font-size: 0.82rem;
          color: #4a4a6a;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .news-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .news-meta span {
          font-size: 0.72rem;
          color: #8888aa;
        }

        .news-meta a {
          font-size: 0.78rem;
          font-weight: 700;
          color: #6c5ce7;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .news-meta a:hover {
          color: #00b4d8;
          transform: translateX(3px);
        }

        /* ---------- Success Message ---------- */
        .success-message {
          background: linear-gradient(135deg, rgba(0, 184, 148, 0.06), rgba(0, 180, 216, 0.06));
          border: 1px solid rgba(0, 184, 148, 0.15);
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 20px;
          animation: fadeInStatus 0.5s ease;
        }

        .success-message strong {
          display: block;
          font-size: 0.82rem;
          font-weight: 800;
          color: #00b894;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .success-message p {
          font-size: 0.88rem;
          color: #4a4a6a;
          line-height: 1.7;
          margin-bottom: 4px;
        }

        .itinerary-result > .success-message {
          text-align: center;
          font-size: 0.9rem;
          font-weight: 700;
          color: #00b894;
          padding: 20px;
          margin-top: 8px;
        }

        /* ---------- Day List ---------- */
        .day-list {
          margin-top: 24px;
        }

        .day-list > h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 20px;
          text-align: center;
        }

        /* ---------- Day Card ---------- */
        .day-card {
          display: flex;
          gap: 20px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(108, 92, 231, 0.12);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 16px;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          animation: dayReveal 0.5s ease-out both;
        }

        .day-card:nth-child(1) { animation-delay: 0.05s; }
        .day-card:nth-child(2) { animation-delay: 0.1s; }
        .day-card:nth-child(3) { animation-delay: 0.15s; }
        .day-card:nth-child(4) { animation-delay: 0.2s; }
        .day-card:nth-child(5) { animation-delay: 0.25s; }
        .day-card:nth-child(6) { animation-delay: 0.3s; }
        .day-card:nth-child(7) { animation-delay: 0.35s; }

        @keyframes dayReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .day-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #6c5ce7, #00b4d8, #6c5ce7);
          background-size: 100% 200%;
          animation: gradientSlide 3s linear infinite;
        }

        .day-card:hover {
          box-shadow: 0 12px 40px rgba(108, 92, 231, 0.16);
          transform: translateX(8px);
          border-color: rgba(108, 92, 231, 0.25);
        }

        /* ---------- Day Number ---------- */
        .day-number {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6c5ce7, #00b4d8);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 800;
          border-radius: 16px;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.3);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .day-card:hover .day-number {
          transform: scale(1.1) rotate(-4deg);
          box-shadow: 0 8px 28px rgba(108, 92, 231, 0.5);
        }

        /* ---------- Day Details ---------- */
        .day-details {
          flex: 1;
          min-width: 0;
        }

        .day-details > strong {
          font-size: 0.72rem;
          font-weight: 700;
          color: #00b4d8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .day-details > h4 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #1a1a2e;
          margin: 4px 0 16px;
          line-height: 1.35;
        }

        /* ---------- Plan Section ---------- */
        .plan-section {
          margin-bottom: 14px;
          padding: 12px 16px;
          background: rgba(108, 92, 231, 0.03);
          border-radius: 12px;
          border-left: 3px solid rgba(108, 92, 231, 0.15);
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .plan-section:hover {
          background: rgba(108, 92, 231, 0.07);
          border-left-color: #6c5ce7;
          transform: translateX(5px);
        }

        .plan-section strong {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          color: #4a4a6a;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .plan-section p {
          font-size: 0.88rem;
          color: #4a4a6a;
          line-height: 1.7;
          margin: 0;
        }

        .plan-section ul {
          margin: 4px 0 0 18px;
          padding: 0;
        }

        .plan-section li {
          font-size: 0.85rem;
          color: #4a4a6a;
          line-height: 1.7;
          margin-bottom: 2px;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 768px) {
          .trip-form {
            padding: 28px 20px;
          }

          .trip-form h2 {
            font-size: 1.4rem;
          }

          .date-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .itinerary-result > h2 {
            font-size: 1.4rem;
          }

          .trip-status-card {
            padding: 20px;
          }

          .trip-status-header {
            flex-direction: column;
          }

          .trip-status-header .btn-primary {
            width: 100%;
          }

          .trip-status-info {
            grid-template-columns: 1fr;
          }

          .trip-status-services {
            flex-direction: column;
            gap: 12px;
          }

          .weather-details {
            grid-template-columns: 1fr 1fr;
          }

          .day-card {
            flex-direction: column;
            gap: 16px;
            padding: 20px;
          }

          .day-number {
            width: 48px;
            height: 48px;
            font-size: 0.7rem;
          }

          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

        @media (max-width: 480px) {
          .trip-form {
            padding: 24px 16px;
            border-radius: 20px;
          }

          .trip-status-card,
          .weather-card,
          .news-card,
          .day-card {
            padding: 16px;
            border-radius: 20px;
          }

          .weather-details {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ==================================================
          TRIP FORM
      ================================================== */}

      <form
        className="trip-form"
        onSubmit={handleSubmit}
      >
        <h2>Plan Your Trip</h2>

        <p className="form-description">
          Enter your travel details and create a personalized AI itinerary.
        </p>

        <div className="form-group">
          <label htmlFor="destination">
            Destination
          </label>

          <input
            id="destination"
            type="text"
            placeholder="Example: Ujjain"
            value={destination}
            onChange={(event) =>
              setDestination(event.target.value)
            }
            required
          />
        </div>

        <div className="date-row">
          <div className="form-group">
            <label htmlFor="start-date">
              Start Date
            </label>

            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-date">
              End Date
            </label>

            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="activities">
            Activities
          </label>

          <textarea
            id="activities"
            placeholder="Example: Temple, Beach, Shopping, Museum"
            rows="4"
            value={activities}
            onChange={(event) =>
              setActivities(event.target.value)
            }
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="travel-mode">
            Travel Mode
          </label>

          <select
            id="travel-mode"
            value={travelMode}
            onChange={(event) =>
              setTravelMode(event.target.value)
            }
          >
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="train">Train</option>
            <option value="bus">Bus</option>
            <option value="flight">Flight</option>
          </select>
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading
            ? "Generating AI Itinerary..."
            : "Generate Itinerary"}
        </button>
      </form>

      {/* ==================================================
          ITINERARY RESULT
      ================================================== */}

      {itinerary && (
        <div className="itinerary-result">

          <h2>Your AI Trip Itinerary</h2>

          {/* ==================================================
              TRIP STATUS
          ================================================== */}

          <div className="trip-status-card">

            <div className="trip-status-header">

              <div>

                <h3>
                  Trip Status
                </h3>

                {tripStatus === "not_checked" && (
                  <p className="trip-status-neutral">
                    ℹ️ Trip status has not been checked yet.
                  </p>
                )}

                {tripStatus === "no_change" && (
                  <p className="trip-status-success">
                    🟢 No Changes — Everything looks fine
                  </p>
                )}

                {tripStatus === "changed" && (
                  <p className="trip-status-success">
                    🔄 Itinerary automatically updated.
                  </p>
                )}

                {tripStatus === "error" && (
                  <p className="trip-status-error">
                    ⚠️ Unable to check trip status.
                  </p>
                )}

                {statusError && (
                  <p className="trip-status-error">
                    {statusError}
                  </p>
                )}

              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={performTripStatusCheck}
                disabled={checkingStatus}
              >
                {checkingStatus
                  ? "Checking..."
                  : "🔄 Check Now"}
              </button>

            </div>


            {/* ==================================================
                CHANGE INFORMATION
            ================================================== */}

            {tripStatus === "changed" &&
              statusResult && (

                <div className="trip-status-change">

                  <h4>
                    🔄 Itinerary Updated
                  </h4>

                  <p>
                    TripAdapt AI detected conditions
                    that may affect your original
                    itinerary and automatically
                    replanned the trip.
                  </p>

                  {statusResult.severity &&
                    statusResult.severity !== "none" && (
                      <p>
                        <strong>
                          Severity:
                        </strong>{" "}
                        {statusResult.severity}
                      </p>
                    )}

                  {statusResult.affected_days &&
                    statusResult.affected_days.length > 0 && (

                      <p>
                        <strong>
                          Affected days:
                        </strong>{" "}
                        {statusResult.affected_days.join(
                          ", "
                        )}
                      </p>

                    )}

                  {statusResult.weather_impact && (
                    <p>
                      🌤️ Weather conditions
                      contributed to the change.
                    </p>
                  )}

                  {statusResult.news_impact && (
                    <p>
                      📰 Recent travel news
                      contributed to the change.
                    </p>
                  )}

                  {statusResult.reasons &&
                    statusResult.reasons.length > 0 && (

                      <div>

                        <strong>
                          Why was the itinerary changed?
                        </strong>

                        <ul>

                          {statusResult.reasons.map(
                            (reason, index) => (

                              <li key={index}>
                                {reason}
                              </li>

                            )
                          )}

                        </ul>

                      </div>

                    )}

                </div>

              )}


            {/* ==================================================
                CHECK TIMES
            ================================================== */}

            <div className="trip-status-info">

              <div>

                <strong>
                  Last checked
                </strong>

                <span>
                  {lastChecked
                    ? lastChecked.toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Not checked yet"}
                </span>

              </div>


              <div>

                <strong>
                  Next check
                </strong>

                <span>
                  {nextCheck
                    ? nextCheck.toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "10 minutes after first check"}
                </span>

              </div>

            </div>


            {/* ==================================================
                SERVICE STATUS
            ================================================== */}

            <div className="trip-status-services">

              <div>
                🌤️ Weather

                <span>
                  {itinerary.weather?.success
                    ? "Available"
                    : "Unavailable"}
                </span>
              </div>


              <div>
                📰 News

                <span>
                  {itinerary.news?.success
                    ? "Available"
                    : "Unavailable"}
                </span>
              </div>

            </div>

          </div>


          {/* ==================================================
              BASIC TRIP INFORMATION
          ================================================== */}

          <div className="result-item">

            <strong>
              Destination
            </strong>

            <span>
              {itinerary.destination}
            </span>

          </div>


          <div className="result-item">

            <strong>
              Travel Dates
            </strong>

            <span>
              {itinerary.startDate} →{" "}
              {itinerary.endDate}
            </span>

          </div>


          <div className="result-item">

            <strong>
              Travel Mode
            </strong>

            <span>
              {itinerary.travelMode}
            </span>

          </div>


          {/* ==================================================
              WEATHER
          ================================================== */}

          {itinerary.weather && (

            <div className="weather-card">

              <h3>
                Current Weather
              </h3>

              {itinerary.weather.success ? (

                <div className="weather-details">

                  <div>

                    <strong>
                      Temperature
                    </strong>

                    <span>
                      {itinerary.weather.temperature}°C
                    </span>

                  </div>


                  <div>

                    <strong>
                      Condition
                    </strong>

                    <span>
                      {itinerary.weather.description}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Humidity
                    </strong>

                    <span>
                      {itinerary.weather.humidity}%
                    </span>

                  </div>


                  <div>

                    <strong>
                      Wind
                    </strong>

                    <span>
                      {itinerary.weather.wind_speed} m/s
                    </span>

                  </div>

                </div>

              ) : (

                <p>
                  {itinerary.weather.message ||
                    "Weather information is currently unavailable."}
                </p>

              )}

            </div>

          )}


          {/* ==================================================
              NEWS
          ================================================== */}

          {itinerary.news && (

            <div className="news-card">

              <h3>
                Latest Travel News
              </h3>

              {itinerary.news.success &&
              itinerary.news.articles &&
              itinerary.news.articles.length > 0 ? (

                <div className="news-list">

                  {itinerary.news.articles.map(
                    (article, index) => (

                      <div
                        className="news-item"
                        key={index}
                      >

                        <h4>
                          {article.title}
                        </h4>

                        {article.description && (
                          <p>
                            {article.description}
                          </p>
                        )}

                        <div className="news-meta">

                          <span>
                            {article.publishedAt}
                          </span>

                          {article.url && (

                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Read More →
                            </a>

                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p>
                  {itinerary.news.message ||
                    "No recent travel news available."}
                </p>

              )}

            </div>

          )}


          {/* ==================================================
              AI ADAPTATION
          ================================================== */}

          {itinerary.adaptation &&
            itinerary.adaptation.changes &&
            itinerary.adaptation.changes.length > 0 && (

              <div className="success-message">

                <strong>
                  AI Adaptation
                </strong>

                {itinerary.adaptation.changes.map(
                  (change, index) => (

                    <p key={index}>
                      ✓ {change}
                    </p>

                  )
                )}

              </div>

            )}


          {/* ==================================================
              DAY-WISE AI PLAN
          ================================================== */}

          <div className="day-list">

            <h3>
              AI-Generated Day-wise Plan
            </h3>

            {itinerary.days &&
              itinerary.days.map((day) => (

                <div
                  className="day-card"
                  key={day.day}
                >

                  {/* DAY NUMBER */}

                  <div className="day-number">
                    Day {day.day}
                  </div>


                  {/* DAY DETAILS */}

                  <div className="day-details">

                    <strong>
                      {day.date}
                    </strong>

                    <h4>
                      {day.title}
                    </h4>


                    {/* MORNING */}

                    <div className="plan-section">

                      <strong>
                        🌅 Morning
                      </strong>

                      <p>
                        {day.morning}
                      </p>

                    </div>


                    {/* AFTERNOON */}

                    <div className="plan-section">

                      <strong>
                        ☀️ Afternoon
                      </strong>

                      <p>
                        {day.afternoon}
                      </p>

                    </div>


                    {/* EVENING */}

                    <div className="plan-section">

                      <strong>
                        🌆 Evening
                      </strong>

                      <p>
                        {day.evening}
                      </p>

                    </div>


                    {/* PLACES */}

                    {day.places &&
                      day.places.length > 0 && (

                        <div className="plan-section">

                          <strong>
                            📍 Places
                          </strong>

                          <ul>

                            {day.places.map(
                              (place, index) => (

                                <li key={index}>
                                  {place}
                                </li>

                              )
                            )}

                          </ul>

                        </div>

                      )}


                    {/* TRAVEL */}

                    <div className="plan-section">

                      <strong>
                        🚗 Travel
                      </strong>

                      <p>
                        {day.travel}
                      </p>

                    </div>


                    {/* FOOD */}

                    <div className="plan-section">

                      <strong>
                        🍽️ Food
                      </strong>

                      <p>
                        {day.food}
                      </p>

                    </div>


                    {/* TIPS */}

                    <div className="plan-section">

                      <strong>
                        💡 Tip
                      </strong>

                      <p>
                        {day.tips}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

          </div>


          {/* ==================================================
              FINAL SUCCESS MESSAGE
          ================================================== */}

          <p className="success-message">
            ✓ {itinerary.message}
          </p>

        </div>
      )}
    </>
  );
}

export default TripForm;