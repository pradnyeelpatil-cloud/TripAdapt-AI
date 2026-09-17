import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("NEWS_API_KEY")


def get_news(destination):
    if not API_KEY:
        return {
            "success": False,
            "message": "News API key is missing"
        }

    url = "https://newsapi.org/v2/everything"

    search_query = (
        f'"{destination}" AND '
        '(travel OR tourism OR tourist OR road OR traffic OR '
        'weather OR flood OR closure OR closed OR accident OR '
        'protest OR temple OR railway)'
    )

    params = {
        "q": search_query,
        "sortBy": "publishedAt",
        "pageSize": 20,
        "language": "en",
        "apiKey": API_KEY
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        if response.status_code != 200:
            return {
                "success": False,
                "message": "News information not found"
            }

        data = response.json()

        articles = []

        # Keywords that indicate travel-related information
        travel_keywords = [
            "travel",
            "tourism",
            "tourist",
            "road",
            "traffic",
            "weather",
            "flood",
            "flooding",
            "closure",
            "closed",
            "accident",
            "protest",
            "temple",
            "railway",
            "train",
            "station",
            "airport",
            "pilgrim",
            "pilgrimage",
            "festival"
        ]

        for article in data.get("articles", []):

            title = article.get("title") or ""
            description = article.get("description") or ""

            text = (
                title + " " + description
            ).lower()

            # Keep only articles containing travel-related terms
            if not any(
                keyword in text
                for keyword in travel_keywords
            ):
                continue

            articles.append({
                "title": title,
                "description": description,
                "url": article.get("url"),
                "publishedAt": article.get("publishedAt")
            })

            # Keep maximum 5 relevant articles
            if len(articles) >= 5:
                break

        return {
            "success": True,
            "articles": articles
        }

    except requests.RequestException:
        return {
            "success": False,
            "message": "Unable to connect to news service"
        }