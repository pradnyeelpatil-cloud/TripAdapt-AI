
const API_URL = "http://127.0.0.1:8000";


// ==================================================
// GENERATE ITINERARY
// ==================================================

export async function generateItinerary(tripData) {
  const response = await fetch(`${API_URL}/generate-itinerary`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    throw new Error("Failed to generate itinerary");
  }

  return await response.json();
}


// ==================================================
// CHECK BACKEND
// ==================================================

export async function checkBackend() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is not running");
  }

  return await response.json();
}


// ==================================================
// REAL-TIME TRIP STATUS CHECK
// ==================================================

export async function checkTripStatus(tripData) {
  const response = await fetch(`${API_URL}/check-trip-status`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    throw new Error("Failed to check trip status");
  }

  return await response.json();
}
