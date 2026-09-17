import os
import json

from dotenv import load_dotenv
from google import genai


# ==================================================
# ENVIRONMENT
# ==================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

client = None

if API_KEY:
    client = genai.Client(api_key=API_KEY)


# ==================================================
# GEMINI TRIP IMPACT VERIFICATION
# ==================================================

def verify_trip_impact(
    destination,
    itinerary_days,
    weather,
    news
):
    """
    Uses Gemini to determine whether fresh weather or news
    genuinely affects the existing itinerary.

    IMPORTANT:
    This function does NOT change the itinerary.

    It only verifies:
    - whether a real impact exists
    - which days are affected
    - what caused the impact
    - why the impact matters
    """


    # --------------------------------------------------
    # Check Gemini availability
    # --------------------------------------------------

    if not client:
        return {
            "success": False,
            "message": "Gemini API key is missing"
        }


    # --------------------------------------------------
    # Prepare weather information
    # --------------------------------------------------

    if weather.get("success"):

        weather_info = {
            "temperature": weather.get("temperature"),
            "description": weather.get("description"),
            "humidity": weather.get("humidity"),
            "wind_speed": weather.get("wind_speed")
        }

    else:

        weather_info = {
            "status": "unavailable",
            "message": weather.get(
                "message",
                "Weather information unavailable."
            )
        }


    # --------------------------------------------------
    # Prepare news information
    # --------------------------------------------------

    news_articles = []

    if news.get("success"):

        for article in news.get("articles", []):

            news_articles.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "url": article.get("url"),
                "publishedAt": article.get("publishedAt")
            })


    # --------------------------------------------------
    # Prepare itinerary
    # --------------------------------------------------

    itinerary_text = json.dumps(
        itinerary_days,
        indent=2,
        ensure_ascii=False
    )

    news_text = json.dumps(
        news_articles,
        indent=2,
        ensure_ascii=False
    )

    weather_text = json.dumps(
        weather_info,
        indent=2,
        ensure_ascii=False
    )


    # --------------------------------------------------
    # Gemini prompt
    # --------------------------------------------------

    prompt = f"""
You are a travel itinerary impact verification AI.

Your job is NOT to automatically change the itinerary.

Your job is to carefully determine whether the CURRENT weather
or RECENT destination-related news genuinely affects the existing
travel itinerary.

Destination:
{destination}

CURRENT WEATHER:
{weather_text}

RECENT NEWS:
{news_text}

CURRENT ITINERARY:
{itinerary_text}


IMPORTANT RULES:

1. Compare the weather and news against the ACTUAL itinerary.

2. Do NOT mark something as an impact simply because it contains
   words such as:
   road, weather, temple, tourism, traffic, travel, rain, etc.

3. News must be genuinely relevant to the destination AND
   reasonably connected to something in the itinerary.

4. Do not assume that a news article affects the trip unless
   the article provides a meaningful reason.

5. Normal weather should NOT trigger a change.

6. Light rain should not automatically trigger a change.
   Consider whether the affected activity is actually outdoor.

7. A road closure should only affect the itinerary if the road
   or route is reasonably connected to a planned activity.

8. A closure of a tourist attraction should affect the itinerary
   if that attraction is actually planned.

9. General political, economic, promotional, ceremonial or
   unrelated destination news should NOT trigger a change.

10. Do not invent facts.

11. Do not assume an article is true beyond the information
    provided in the article.

12. If there is no genuine impact, return affected=false.

13. If there is a genuine impact, identify the specific itinerary
    day or days affected.

14. Explain exactly what information caused the impact.

15. Do NOT generate a replacement itinerary yet.


Return ONLY valid JSON.

Use EXACTLY this structure:

{{
    "affected": false,
    "severity": "none",
    "affected_days": [],
    "reasons": [],
    "weather_impact": false,
    "news_impact": false,
    "changes_required": []
}}

If there IS a genuine impact, use:

{{
    "affected": true,
    "severity": "medium",
    "affected_days": [2],
    "reasons": [
        "Heavy rain is likely to affect the outdoor activity planned for Day 2."
    ],
    "weather_impact": true,
    "news_impact": false,
    "changes_required": [
        "Day 2 outdoor activity may need to be replaced or moved."
    ]
}}

Severity must be one of:

"none"
"low"
"medium"
"high"
"""


    # --------------------------------------------------
    # Call Gemini
    # --------------------------------------------------

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )


        text = response.text.strip()


        # --------------------------------------------------
        # Remove markdown JSON fences if Gemini adds them
        # --------------------------------------------------

        if text.startswith("```"):

            text = text.replace(
                "```json",
                ""
            )

            text = text.replace(
                "```",
                ""
            )

            text = text.strip()


        # --------------------------------------------------
        # Convert response to JSON
        # --------------------------------------------------

        result = json.loads(text)


        # --------------------------------------------------
        # Validate important fields
        # --------------------------------------------------

        affected = bool(
            result.get("affected", False)
        )

        severity = result.get(
            "severity",
            "none"
        )

        affected_days = result.get(
            "affected_days",
            []
        )

        reasons = result.get(
            "reasons",
            []
        )

        changes_required = result.get(
            "changes_required",
            []
        )


        # --------------------------------------------------
        # Safety correction
        # --------------------------------------------------

        if not affected:

            severity = "none"
            affected_days = []
            reasons = []
            changes_required = []


        # --------------------------------------------------
        # Final verification result
        # --------------------------------------------------

        return {
            "success": True,
            "affected": affected,
            "severity": severity,
            "affected_days": affected_days,
            "reasons": reasons,
            "weather_impact": bool(
                result.get("weather_impact", False)
            ),
            "news_impact": bool(
                result.get("news_impact", False)
            ),
            "changes_required": changes_required
        }


    except json.JSONDecodeError:

        print(
            "Gemini returned invalid JSON during "
            "trip impact verification."
        )

        return {
            "success": False,
            "message": "Gemini returned an invalid verification format"
        }


    except Exception as error:

        print(
            "Gemini trip impact verification error:"
        )

        print(error)

        return {
            "success": False,
            "message": "Unable to verify trip impact using Gemini"
        }


# ==================================================
# OLD ADAPTATION FUNCTION
# ==================================================

def adapt_itinerary(
    itinerary_days,
    weather,
    news,
    destination=""
):
    """
    Compatibility function for the initial itinerary generation.

    The actual real-time verification is now handled by
    verify_trip_impact().
    """

    return {
        "days": itinerary_days,
        "changes": [],
        "alerts": [],
        "affected_days": [],
        "needs_replanning": False
    }
