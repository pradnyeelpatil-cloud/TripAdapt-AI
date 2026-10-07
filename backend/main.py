from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from weather import get_weather
from news import get_news
from adaptation import adapt_itinerary, verify_trip_impact
from ai_itinerary import generate_ai_itinerary, replan_itinerary


app = FastAPI(title="TripAdapt AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_destination_list(destination):
    separators = [
        ",",
        "→",
        "->",
        "\n"
    ]

    destinations = [destination]

    for separator in separators:
        new_destinations = []

        for item in destinations:
            new_destinations.extend(
                item.split(separator)
            )

        destinations = new_destinations

    cleaned = []

    for item in destinations:

        item = item.strip()

        if item and item not in cleaned:
            cleaned.append(item)

    return cleaned

# ==========================================================
# REQUEST MODELS
# ==========================================================

class TripRequest(BaseModel):
    destination: str
    startDate: str
    endDate: str
    activities: str
    travelMode: str


class TripStatusRequest(BaseModel):
    destination: str
    itinerary: list
    startDate: str
    endDate: str
    travelMode: str


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
def health_check():

    return {
        "status": "success",
        "message": "TripAdapt AI backend is running"
    }


# ==========================================================
# GENERATE INITIAL ITINERARY
# ==========================================================

@app.post("/generate-itinerary")
def generate_itinerary(trip: TripRequest):

    print("\n================================")
    print("GENERATING AI ITINERARY")
    print("================================")

    destinations = get_destination_list(trip.destination)

    # --------------------------------
    # GET WEATHER
    # --------------------------------

    print("\nFetching weather...")

    weather_by_destination = {}

    for destination in destinations:

        print(
            f"\nFetching weather for {destination}..."
        )

        weather_by_destination[destination] = (
            get_weather(destination)
        )

        print("WEATHER RESULT:")
        print(weather_by_destination[destination])

    weather = weather_by_destination.get(
        destinations[0],
        {}
    )

    # --------------------------------
    # GET NEWS
    # --------------------------------

    print("\nFetching news...")

    news = get_news(trip.destination)

    print("NEWS RESULT:")
    print(news)

    # --------------------------------
    # GENERATE ITINERARY USING GEMINI
    # --------------------------------

    print("\nGenerating itinerary using Gemini...")

    ai_result = generate_ai_itinerary(
        destination=trip.destination,
        start_date=trip.startDate,
        end_date=trip.endDate,
        activities=trip.activities,
        travel_mode=trip.travelMode,
        weather=weather,
        news=news
    )

    if not ai_result["success"]:

        return {
            "success": False,
            "message": ai_result["message"],
            "weather": weather,
            "news": news
        }

    itinerary_days = ai_result["days"]

    # --------------------------------
    # INITIAL ADAPTATION
    # --------------------------------

    try:

        adaptation = adapt_itinerary(
            itinerary_days,
            weather,
            news,
            trip.destination
        )

    except Exception as error:

        print("\nADAPTATION ERROR:")
        print(error)

        adaptation = {
            "days": itinerary_days,
            "changes": [],
            "alerts": [],
            "affected_days": [],
            "needs_replanning": False
        }

    response = {
        "success": True,
        "destination": trip.destination,
        "startDate": trip.startDate,
        "endDate": trip.endDate,
        "travelMode": trip.travelMode,
        "days": adaptation["days"],
        "weather": weather,
        "weather_by_destination": weather_by_destination,
        "news": news,
        "adaptation": {
            "changes": adaptation["changes"],
            "alerts": adaptation["alerts"],
            "affected_days": adaptation["affected_days"],
            "needs_replanning": adaptation["needs_replanning"]
        },
        "message": "AI itinerary generated successfully"
    }

    print("\n================================")
    print("INITIAL ITINERARY READY")
    print("================================\n")

    return response


# ==========================================================
# REAL-TIME TRIP STATUS
# ==========================================================
@app.post("/check-trip-status")
def check_trip_status(trip: TripStatusRequest):

    print("\n================================")
    print("REAL-TIME TRIP STATUS CHECK")
    print("================================")

    print(
        "Destination:",
        trip.destination
    )

    # ==========================================================
    # GET ALL DESTINATIONS
    # ==========================================================

    destinations = get_destination_list(
        trip.destination
    )

    # ==========================================================
    # FRESH WEATHER FOR EVERY DESTINATION
    # ==========================================================

    weather_by_destination = {}

    for destination in destinations:

        print(
            f"\nFetching weather for {destination}..."
        )

        weather_by_destination[destination] = (
            get_weather(destination)
        )

    # Main weather = first destination
    weather = weather_by_destination[
        destinations[0]
    ]

    # ==========================================================
    # FRESH NEWS
    # ==========================================================

    news = get_news(
        trip.destination
    )

    # ==========================================================
    # AI / FALLBACK VERIFICATION
    # ==========================================================

    verification = verify_trip_impact(
        destination=trip.destination,
        itinerary_days=trip.itinerary,
        weather=weather,
        news=news
    )

    # ==========================================================
    # NO IMPACT
    # ==========================================================

    if not verification.get("affected"):

        return {
            "success": True,
            "status": "checked",

            "destination":
                trip.destination,

            "weather":
                weather,

            "weather_by_destination":
                weather_by_destination,

            "news":
                news,

            "affected":
                False,

            "severity":
                "none",

            "affected_days":
                [],

            "reasons":
                [],

            "weather_impact":
                verification.get(
                    "weather_impact",
                    False
                ),

            "news_impact":
                verification.get(
                    "news_impact",
                    False
                ),

            "changes_required":
                [],

            "itinerary_changed":
                False,

            "itinerary":
                trip.itinerary,

            "verification_method":
                verification.get(
                    "verification_method",
                    "Local fallback"
                ),

            "message":
                "Trip checked successfully. "
                "No significant impact detected."
        }

    # ==========================================================
    # IMPACT DETECTED
    # ==========================================================

    replanned_result = replan_itinerary(
        destination=trip.destination,
        itinerary_days=trip.itinerary,
        weather=weather,
        news=news,
        affected_days=
            verification.get(
                "affected_days",
                []
            ),
        reasons=
            verification.get(
                "reasons",
                []
            ),
        changes_required=
            verification.get(
                "changes_required",
                []
            )
    )

    # If replanning fails, DON'T show an error.
    # Return the original itinerary with the alert.

    if not replanned_result.get("success"):

        return {
            "success": True,
            "status": "impact_detected",

            "destination":
                trip.destination,

            "weather":
                weather,

            "weather_by_destination":
                weather_by_destination,

            "news":
                news,

            "affected":
                True,

            "severity":
                verification.get(
                    "severity",
                    "medium"
                ),

            "affected_days":
                verification.get(
                    "affected_days",
                    []
                ),

            "reasons":
                verification.get(
                    "reasons",
                    []
                ),

            "weather_impact":
                verification.get(
                    "weather_impact",
                    False
                ),

            "news_impact":
                verification.get(
                    "news_impact",
                    False
                ),

            "changes_required":
                verification.get(
                    "changes_required",
                    []
                ),

            "itinerary_changed":
                False,

            "itinerary":
                trip.itinerary,

            "message":
                "Travel conditions may affect "
                "your itinerary. Review the alert."
        }

    # ==========================================================
    # REPLANNED
    # ==========================================================

    return {
        "success": True,
        "status": "replanned",

        "destination":
            trip.destination,

        "weather":
            weather,

        "weather_by_destination":
            weather_by_destination,

        "news":
            news,

        "affected":
            True,

        "severity":
            verification.get(
                "severity",
                "medium"
            ),

        "affected_days":
            verification.get(
                "affected_days",
                []
            ),

        "reasons":
            verification.get(
                "reasons",
                []
            ),

        "weather_impact":
            verification.get(
                "weather_impact",
                False
            ),

        "news_impact":
            verification.get(
                "news_impact",
                False
            ),

        "changes_required":
            verification.get(
                "changes_required",
                []
            ),

        "itinerary_changed":
            True,

        "itinerary":
            replanned_result["days"],

        "verification_method":
            verification.get(
                "verification_method",
                "Groq AI"
            ),

        "message":
            "Travel conditions affected the itinerary. "
            "The itinerary was automatically replanned."
    }

    print("\n================================")
    print("REAL-TIME TRIP STATUS CHECK")
    print("================================")

    print("Destination:", trip.destination)

    # --------------------------------
    # FETCH FRESH WEATHER
    # --------------------------------

    print("\nFetching fresh weather...")

    weather = get_weather(trip.destination)

    print("FRESH WEATHER:")
    print(weather)

    # --------------------------------
    # FETCH FRESH NEWS
    # --------------------------------

    print("\nFetching fresh news...")

    news = get_news(trip.destination)

    print("FRESH NEWS:")

    if news.get("success"):

        print(
            "Articles received:",
            len(news.get("articles", []))
        )

    else:

        print(
            "News error:",
            news.get("message")
        )

    # --------------------------------
    # VERIFY TRIP IMPACT USING GEMINI
    # --------------------------------

    print("\nVerifying itinerary impact using Gemini...")

    verification = verify_trip_impact(
        destination=trip.destination,
        itinerary_days=trip.itinerary,
        weather=weather,
        news=news
    )

    print("\nGEMINI VERIFICATION:")
    print(verification)

    # --------------------------------
    # HANDLE VERIFICATION FAILURE
    # --------------------------------

    if not verification.get("success"):

        print("\nTrip status verification failed.")

        return {
            "success": False,
            "status": "verification_failed",
            "destination": trip.destination,
            "weather": weather,
            "news": news,
            "itinerary_changed": False,
            "message": verification.get(
                "message",
                "Unable to verify trip status"
            )
        }

    # --------------------------------
    # GET VERIFICATION RESULT
    # --------------------------------

    affected = verification.get(
        "affected",
        False
    )

    severity = verification.get(
        "severity",
        "none"
    )

    affected_days = verification.get(
        "affected_days",
        []
    )

    reasons = verification.get(
        "reasons",
        []
    )

    weather_impact = verification.get(
        "weather_impact",
        False
    )

    news_impact = verification.get(
        "news_impact",
        False
    )

    changes_required = verification.get(
        "changes_required",
        []
    )

    # --------------------------------
    # NO IMPACT
    # --------------------------------

    if not affected:

        print("\nNo significant impact detected.")

        return {
            "success": True,
            "status": "checked",
            "destination": trip.destination,

            "weather": weather,
            "news": news,

            "affected": False,
            "severity": "none",
            "affected_days": [],

            "reasons": [],

            "weather_impact": False,
            "news_impact": False,

            "changes_required": [],

            "itinerary_changed": False,

            "itinerary": trip.itinerary,

            "message": (
                "No significant impact detected on "
                "the current itinerary."
            )
        }

    # --------------------------------
    # IMPACT DETECTED
    # --------------------------------

    print("\n================================")
    print("TRIP IMPACT DETECTED")
    print("================================")

    print("Affected days:", affected_days)

    print("Reasons:")

    for reason in reasons:
        print("-", reason)

    # --------------------------------
    # REPLAN ITINERARY USING GEMINI
    # --------------------------------

    print("\nRe-planning itinerary using Gemini...")

    replanned_result = replan_itinerary(
        destination=trip.destination,
        itinerary_days=trip.itinerary,
        weather=weather,
        news=news,
        affected_days=affected_days,
        reasons=reasons,
        changes_required=changes_required
    )

    print("\nREPLANNING RESULT:")
    print(replanned_result)

    # --------------------------------
    # HANDLE REPLANNING FAILURE
    # --------------------------------

    if not replanned_result.get("success"):

        print("\nReplanning failed.")

        return {
            "success": False,
            "status": "replanning_failed",

            "destination": trip.destination,

            "weather": weather,
            "news": news,

            "affected": True,
            "severity": severity,
            "affected_days": affected_days,

            "reasons": reasons,

            "weather_impact": weather_impact,
            "news_impact": news_impact,

            "changes_required": changes_required,

            "itinerary_changed": False,

            "itinerary": trip.itinerary,

            "message": replanned_result.get(
                "message",
                "Unable to re-plan itinerary"
            )
        }

    # --------------------------------
    # GET UPDATED ITINERARY
    # --------------------------------

    updated_itinerary = replanned_result["days"]

    # --------------------------------
    # FINAL RESPONSE
    # --------------------------------

    print("\n================================")
    print("ITINERARY SUCCESSFULLY REPLANNED")
    print("================================")

    print(
        "Updated days:",
        len(updated_itinerary)
    )

    return {
        "success": True,
        "status": "replanned",

        "destination": trip.destination,

        "weather": weather,
        "news": news,

        "affected": True,
        "severity": severity,

        "affected_days": affected_days,

        "reasons": reasons,

        "weather_impact": weather_impact,
        "news_impact": news_impact,

        "changes_required": changes_required,

        "itinerary_changed": True,

        "itinerary": updated_itinerary,

        "message": (
            "Trip conditions affected the itinerary. "
            "The itinerary has been automatically replanned."
        )
    }