import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

client = None

if API_KEY:
    client = genai.Client(api_key=API_KEY)


def generate_ai_itinerary(
    destination,
    start_date,
    end_date,
    activities,
    travel_mode,
    weather,
    news
):
    if not client:
        return {
            "success": False,
            "message": "Gemini API key is missing"
        }

    weather_info = "Weather information unavailable."

    if weather.get("success"):
        weather_info = (
            f"Temperature: {weather.get('temperature')}°C, "
            f"Condition: {weather.get('description')}, "
            f"Humidity: {weather.get('humidity')}%, "
            f"Wind: {weather.get('wind_speed')} m/s"
        )

    news_info = "No recent travel-related news available."

    if news.get("success") and news.get("articles"):

        news_items = []

        for article in news["articles"]:

            news_items.append(
                f"- {article.get('title')}: "
                f"{article.get('description') or ''}"
            )

        news_info = "\n".join(news_items)

    prompt = f"""
You are an intelligent travel itinerary planner.

Create a detailed, realistic and destination-specific travel itinerary.

Trip details:
Destination: {destination}
Start date: {start_date}
End date: {end_date}
Preferred activities: {activities}
Travel mode: {travel_mode}

Current weather:
{weather_info}

Recent destination-related news:
{news_info}

IMPORTANT INSTRUCTIONS:

1. Create the itinerary specifically for {destination}.
2. Do NOT use generic placeholder activities.
3. Select real and relevant attractions, landmarks, experiences,
   food areas, markets, cultural places or nature spots appropriate
   for the destination.
4. Distribute activities logically across the trip.
5. Consider travel time.
6. Respect the user's preferred activities.
7. Consider the selected travel mode.
8. Consider the provided weather.
9. Consider relevant travel-disruption news.
10. Do not invent closures, events or breaking news.
11. Each day should feel different.
12. Give practical suggestions such as meals, timing and travel tips.
13. Do not repeat the same attraction unless there is a good reason.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "days": [
        {{
            "day": 1,
            "date": "YYYY-MM-DD",
            "title": "Short title for the day",
            "morning": "Detailed morning plan",
            "afternoon": "Detailed afternoon plan",
            "evening": "Detailed evening plan",
            "places": [
                "Place 1",
                "Place 2"
            ],
            "travel": "Travel information for this day",
            "food": "Food or meal suggestion",
            "tips": "Useful practical tip"
        }}
    ]
}}

Create one object for every day from {start_date} to {end_date}.
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        text = response.text.strip()

        if text.startswith("```"):

            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        itinerary = json.loads(text)

        return {
            "success": True,
            "days": itinerary.get("days", [])
        }

    except json.JSONDecodeError:

        return {
            "success": False,
            "message": "Gemini returned an invalid itinerary format"
        }

    except Exception as error:

        print("Gemini error:", error)

        return {
            "success": False,
            "message": "Unable to generate itinerary using Gemini"
        }


# ==========================================================
# REPLAN AFFECTED ITINERARY
# ==========================================================

def replan_itinerary(
    destination,
    itinerary_days,
    weather,
    news,
    affected_days,
    reasons,
    changes_required
):

    if not client:

        return {
            "success": False,
            "message": "Gemini API key is missing"
        }

    weather_info = "Weather information unavailable."

    if weather.get("success"):

        weather_info = (
            f"Temperature: {weather.get('temperature')}°C, "
            f"Condition: {weather.get('description')}, "
            f"Humidity: {weather.get('humidity')}%, "
            f"Wind: {weather.get('wind_speed')} m/s"
        )

    news_info = "No recent travel-related news available."

    if news.get("success") and news.get("articles"):

        news_items = []

        for article in news["articles"]:

            news_items.append(
                f"- {article.get('title')}: "
                f"{article.get('description') or ''}"
            )

        news_info = "\n".join(news_items)

    itinerary_json = json.dumps(
        itinerary_days,
        indent=2
    )

    affected_days_text = ", ".join(
        str(day) for day in affected_days
    )

    reasons_text = "\n".join(
        f"- {reason}" for reason in reasons
    )

    changes_text = "\n".join(
        f"- {change}" for change in changes_required
    )

    prompt = f"""
You are an intelligent travel itinerary re-planning system.

The traveler already has an itinerary for:

Destination: {destination}

Fresh weather:
{weather_info}

Fresh destination-related news:
{news_info}

CURRENT ITINERARY:
{itinerary_json}

Gemini's impact analysis:

Affected days:
{affected_days_text}

Reasons:
{reasons_text}

Changes required:
{changes_text}

Your task is to re-plan the itinerary because current conditions
may affect the trip.

IMPORTANT RULES:

1. Modify ONLY the affected days when possible.
2. Keep unaffected days unchanged.
3. Do not unnecessarily replace activities.
4. Preserve the traveler's original trip structure.
5. Use realistic places and activities for {destination}.
6. If bad weather affects an outdoor activity, replace it with a
   suitable indoor or weather-safe activity.
7. If news indicates a genuine travel disruption, avoid the affected
   location and provide a realistic alternative.
8. Do not invent closures or breaking news.
9. Keep travel time practical.
10. Do not duplicate attractions unnecessarily.
11. Preserve the original day numbers and dates.
12. Clearly incorporate the reason for the change into the affected day.
13. Return the complete itinerary, including unchanged days.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "days": [
        {{
            "day": 1,
            "date": "YYYY-MM-DD",
            "title": "Short title for the day",
            "morning": "Detailed morning plan",
            "afternoon": "Detailed afternoon plan",
            "evening": "Detailed evening plan",
            "places": [
                "Place 1",
                "Place 2"
            ],
            "travel": "Travel information for this day",
            "food": "Food or meal suggestion",
            "tips": "Useful practical tip"
        }}
    ]
}}
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        text = response.text.strip()

        if text.startswith("```"):

            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        replanned = json.loads(text)

        return {
            "success": True,
            "days": replanned.get("days", [])
        }

    except json.JSONDecodeError:

        return {
            "success": False,
            "message": "Gemini returned an invalid replanned itinerary"
        }

    except Exception as error:

        print("Gemini replanning error:", error)

        return {
            "success": False,
            "message": "Unable to re-plan itinerary using Gemini"
        }