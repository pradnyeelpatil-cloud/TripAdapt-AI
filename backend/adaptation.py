import os
import json

from dotenv import load_dotenv
from groq import Groq


# ==================================================
# ENVIRONMENT
# ==================================================

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

client = None

if API_KEY:
    client = Groq(api_key=API_KEY)


# ==================================================
# GROQ TRIP IMPACT VERIFICATION
# ==================================================

def verify_trip_impact(destination, itinerary_days, weather, news):
    """
    Verify whether current weather/news affects the itinerary.

    Groq is used as the AI verifier.
    If Groq fails, a local fallback is used so the
    real-time monitoring system continues working.
    """

    # ==========================================================
    # PREPARE WEATHER
    # ==========================================================

    weather_info = {}

    if weather.get("success"):
        weather_info = {
            "temperature": weather.get("temperature"),
            "description": weather.get("description"),
            "humidity": weather.get("humidity"),
            "wind_speed": weather.get("wind_speed"),
            "rain": weather.get("rain", 0),
        }
    else:
        weather_info = {
            "status": "unavailable"
        }

    # ==========================================================
    # PREPARE NEWS
    # ==========================================================

    news_articles = []

    if news.get("success"):
        for article in news.get("articles", []):
            news_articles.append({
                "title": article.get("title", ""),
                "description": article.get("description", ""),
                "url": article.get("url", ""),
                "publishedAt": article.get("publishedAt", "")
            })

    # ==========================================================
    # TRY GROQ AI
    # ==========================================================

    if client:

        try:

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

            prompt = f"""
You are a travel impact verification AI.

Destination:
{destination}

CURRENT WEATHER:
{weather_text}

RECENT NEWS:
{news_text}

CURRENT ITINERARY:
{itinerary_text}

Determine whether the current weather or recent news
genuinely affects the travel itinerary.

Rules:

- Normal weather = no impact.
- Light rain = usually no impact.
- Heavy rain can affect outdoor activities.
- Severe weather can affect travel.
- A real attraction closure can affect the itinerary.
- A genuine road closure can affect travel.
- Unrelated news must not trigger an alert.
- Do not invent facts.
- Do not automatically change the itinerary.
- Only identify whether a change is required.

Return ONLY JSON.

Use:

{{
    "affected": false,
    "severity": "none",
    "affected_days": [],
    "reasons": [],
    "weather_impact": false,
    "news_impact": false,
    "changes_required": []
}}
"""

            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a careful travel impact "
                            "verification AI. Return valid JSON only."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0,
                response_format={
                    "type": "json_object"
                }
            )

            raw_text = (
                response.choices[0]
                .message.content
                .strip()
            )

            result = json.loads(raw_text)

            return {
                "success": True,
                "affected": bool(
                    result.get("affected", False)
                ),
                "severity": result.get(
                    "severity",
                    "none"
                ),
                "affected_days": result.get(
                    "affected_days",
                    []
                ),
                "reasons": result.get(
                    "reasons",
                    []
                ),
                "weather_impact": bool(
                    result.get(
                        "weather_impact",
                        False
                    )
                ),
                "news_impact": bool(
                    result.get(
                        "news_impact",
                        False
                    )
                ),
                "changes_required": result.get(
                    "changes_required",
                    []
                ),
                "verification_method": "Groq AI"
            }

        except Exception as error:

            print(
                "\nGROQ VERIFICATION ERROR:"
            )
            print(str(error))

    # ==========================================================
    # LOCAL FALLBACK
    # ==========================================================

    print(
        "\nUsing local travel impact verification fallback."
    )

    reasons = []
    affected_days = []
    changes_required = []

    weather_impact = False
    news_impact = False

    # ----------------------------------------------------------
    # WEATHER FALLBACK
    # ----------------------------------------------------------

    if weather.get("success"):

        rain = float(
            weather.get("rain", 0) or 0
        )

        wind = float(
            weather.get("wind_speed", 0) or 0
        )

        description = str(
            weather.get(
                "description",
                ""
            )
        ).lower()

        severe_weather = (
            rain >= 15
            or wind >= 50
            or "thunderstorm" in description
            or "heavy rain" in description
        )

        warning_weather = (
            rain >= 5
            or wind >= 30
        )

        if severe_weather:

            weather_impact = True

            affected_days = [
                day.get("day")
                for day in itinerary_days
                if day.get("day") is not None
            ]

            reasons.append(
                "Current weather conditions may significantly "
                "affect outdoor travel activities."
            )

            changes_required.append(
                "Outdoor activities should be reviewed "
                "and safer alternatives considered."
            )

        elif warning_weather:

            weather_impact = True

            affected_days = [
                day.get("day")
                for day in itinerary_days
                if day.get("day") is not None
            ]

            reasons.append(
                "Current weather conditions may affect "
                "some outdoor activities."
            )

            changes_required.append(
                "Keep outdoor activities flexible."
            )

    # ----------------------------------------------------------
    # NEWS FALLBACK
    # ----------------------------------------------------------

    disruption_words = [
        "closure",
        "closed",
        "road blocked",
        "road closure",
        "landslide",
        "flood",
        "flooding",
        "heavy rain",
        "cyclone",
        "strike",
        "protest",
        "traffic restriction"
    ]

    destination_lower = destination.lower()

    for article in news_articles:

        title = str(
            article.get("title", "")
        ).lower()

        description = str(
            article.get("description", "")
        ).lower()

        article_text = (
            title + " " + description
        )

        destination_match = (
            destination_lower in article_text
        )

        disruption_match = any(
            word in article_text
            for word in disruption_words
        )

        if (
            destination_match
            and disruption_match
        ):

            news_impact = True

            if not affected_days:
                affected_days = [
                    day.get("day")
                    for day in itinerary_days
                    if day.get("day") is not None
                ]

            reasons.append(
                "Recent destination-related news "
                "indicates a possible travel disruption."
            )

            changes_required.append(
                "Review activities or routes related "
                "to the reported disruption."
            )

            break

    # ==========================================================
    # FINAL FALLBACK RESULT
    # ==========================================================

    affected = (
        weather_impact
        or news_impact
    )

    if not affected:

        return {
            "success": True,
            "affected": False,
            "severity": "none",
            "affected_days": [],
            "reasons": [],
            "weather_impact": False,
            "news_impact": False,
            "changes_required": [],
            "verification_method": "Local fallback"
        }

    severity = "medium"

    if weather.get("success"):

        rain = float(
            weather.get("rain", 0) or 0
        )

        wind = float(
            weather.get("wind_speed", 0) or 0
        )

        if rain >= 15 or wind >= 50:
            severity = "high"

    return {
        "success": True,
        "affected": True,
        "severity": severity,
        "affected_days": affected_days,
        "reasons": reasons,
        "weather_impact": weather_impact,
        "news_impact": news_impact,
        "changes_required": changes_required,
        "verification_method": "Local fallback"
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