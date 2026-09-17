import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")


def get_weather(destination):
    if not API_KEY:
        return {
            "success": False,
            "message": "OpenWeather API key is missing"
        }

    url = "https://api.openweathermap.org/data/2.5/weather"

    params = {
        "q": destination,
        "appid": API_KEY,
        "units": "metric"
    }

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            return {
                "success": False,
                "message": "Weather information not found"
            }

        data = response.json()

        return {
            "success": True,
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"]
        }

    except requests.RequestException:
        return {
            "success": False,
            "message": "Unable to connect to weather service"
        }