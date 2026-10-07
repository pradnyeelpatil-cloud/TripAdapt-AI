import os
import json

from dotenv import load_dotenv
from groq import Groq


# ==========================================================
# ENVIRONMENT
# ==========================================================

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

client = None

if API_KEY:
    client = Groq(api_key=API_KEY)


# ==========================================================
# HELPER: CALL GROQ
# ==========================================================

def call_groq(prompt):
    """
    Sends a prompt to Groq and returns the JSON response.
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an intelligent travel planning AI. "
                    "Follow the user's instructions carefully. "
                    "Return ONLY valid JSON."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        response_format={
            "type": "json_object"
        }
    )

    text = response.choices[0].message.content.strip()

    return json.loads(text)


# ==========================================================
# GENERATE AI ITINERARY
# ==========================================================

def generate_ai_itinerary(
    destination,
    start_date,
    end_date,
    activities,
    travel_mode,
    weather,
    news
):

    # ------------------------------------------------------
    # Check Groq availability
    # ------------------------------------------------------

    if not client:
        return {
            "success": False,
            "message": "Groq API key is missing"
        }

    # ------------------------------------------------------
    # Weather information
    # ------------------------------------------------------

    weather_info = "Weather information unavailable."

    if weather.get("success"):

        weather_info = (
            f"Temperature: {weather.get('temperature')}°C, "
            f"Condition: {weather.get('description')}, "
            f"Humidity: {weather.get('humidity')}%, "
            f"Wind: {weather.get('wind_speed')} m/s"
        )

    # ------------------------------------------------------
    # News information
    # ------------------------------------------------------

    news_info = "No recent travel-related news available."

    if news.get("success") and news.get("articles"):

        news_items = []

        for article in news["articles"]:

            news_items.append(
                f"- {article.get('title')}: "
                f"{article.get('description') or ''}"
            )

        news_info = "\n".join(news_items)

    # ------------------------------------------------------
    # Prompt
    # ------------------------------------------------------

    prompt = f"""
You are an intelligent travel itinerary planner.

Create a detailed, realistic and destination-specific travel itinerary.

Trip details:

Destination: {destination}

Start date: {start_date}

End date: {end_date}

Preferred activities:
{activities}

Travel mode:
{travel_mode}

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

14. Preserve the exact dates provided by the user.

15. Create one object for every day from {start_date} to {end_date}.


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

    # ------------------------------------------------------
    # Call Groq
    # ------------------------------------------------------

    try:

        itinerary = call_groq(prompt)

        return {
            "success": True,
            "days": itinerary.get("days", [])
        }

    except json.JSONDecodeError:

        return {
            "success": False,
            "message": "Groq returned an invalid itinerary format"
        }

    except Exception as error:

        print("Groq itinerary generation error:")
        print(error)

        return {
            "success": False,
            "message": "Unable to generate itinerary using Groq"
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

    # ------------------------------------------------------
    # Check Groq availability
    # ------------------------------------------------------

    if not client:

        return {
            "success": False,
            "message": "Groq API key is missing"
        }

    # ------------------------------------------------------
    # Weather information
    # ------------------------------------------------------

    weather_info = "Weather information unavailable."

    if weather.get("success"):

        weather_info = (
            f"Temperature: {weather.get('temperature')}°C, "
            f"Condition: {weather.get('description')}, "
            f"Humidity: {weather.get('humidity')}%, "
            f"Wind: {weather.get('wind_speed')} m/s"
        )

    # ------------------------------------------------------
    # News information
    # ------------------------------------------------------

    news_info = "No recent travel-related news available."

    if news.get("success") and news.get("articles"):

        news_items = []

        for article in news["articles"]:

            news_items.append(
                f"- {article.get('title')}: "
                f"{article.get('description') or ''}"
            )

        news_info = "\n".join(news_items)

    # ------------------------------------------------------
    # Current itinerary
    # ------------------------------------------------------

    itinerary_json = json.dumps(
        itinerary_days,
        indent=2,
        ensure_ascii=False
    )

    # ------------------------------------------------------
    # Impact information
    # ------------------------------------------------------

    affected_days_text = ", ".join(
        str(day) for day in affected_days
    )

    reasons_text = "\n".join(
        f"- {reason}" for reason in reasons
    )

    changes_text = "\n".join(
        f"- {change}" for change in changes_required
    )

    # ------------------------------------------------------
    # Replanning prompt
    # ------------------------------------------------------

    prompt = f"""
You are an intelligent travel itinerary re-planning system.

The traveler already has an itinerary for:

Destination:
{destination}

Fresh weather:
{weather_info}

Fresh destination-related news:
{news_info}


CURRENT ITINERARY:

{itinerary_json}


IMPACT ANALYSIS:

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

13. Return the COMPLETE itinerary, including unchanged days.

14. Do not modify unaffected days unless absolutely necessary.


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

    # ------------------------------------------------------
    # Call Groq
    # ------------------------------------------------------

    try:

        replanned = call_groq(prompt)

        return {
            "success": True,
            "days": replanned.get("days", [])
        }

    except json.JSONDecodeError:

        return {
            "success": False,
            "message": "Groq returned an invalid replanned itinerary"
        }

    except Exception as error:

        print("Groq itinerary replanning error:")
        print(error)

        return {
            "success": False,
            "message": "Unable to re-plan itinerary using Groq"
        }