import React, { useState, useEffect, useCallback } from "react";
import { getWeather, getCoordsForCity } from "../services/weatherService";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLogger } from "../services/logger";
import type { WeatherData } from "../types";

const WeatherIcon: React.FC<{ code: number; isDay: boolean }> = ({
  code,
  isDay,
}) => {
  let icon;
  switch (code) {
    case 0:
      icon = isDay ? "☀️" : "🌙";
      break;
    case 1:
    case 2:
    case 3:
      icon = isDay ? "⛅️" : "☁️";
      break;
    case 45:
    case 48:
      icon = "🌫️";
      break;
    case 51:
    case 53:
    case 55:
      icon = "🌦️";
      break;
    case 61:
    case 63:
    case 65:
      icon = "🌧️";
      break;
    case 66:
    case 67:
      icon = "🌨️";
      break;
    case 71:
    case 73:
    case 75:
      icon = "❄️";
      break;
    case 80:
    case 81:
    case 82:
      icon = "🌧️";
      break;
    case 85:
    case 86:
      icon = "❄️";
      break;
    case 95:
    case 96:
    case 99:
      icon = "⛈️";
      break;
    default:
      icon = "🌍";
      break;
  }
  return <span className="text-lg">{icon}</span>;
};

export const HeaderWeatherWidget: React.FC = () => {
  const logger = useLogger("HeaderWeatherWidget");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useLocalStorage<string>("weather-city", "Lisbon");
  const [isEditing, setIsEditing] = useState(false);
  const [inputCity, setInputCity] = useState(city);

  const fetchWeatherForCity = useCallback(
    async (cityName: string) => {
      setError(null);
      try {
        const coords = await getCoordsForCity(cityName);
        if (!coords) {
          setError(`City "${cityName}" not found.`);
          return;
        }
        const weatherData = await getWeather(coords.latitude, coords.longitude);
        setWeather(weatherData);
        setCity(coords.name);
      } catch (e) {
        setError("Could not fetch weather data.");
        logger.error("Failed to fetch weather data", e as Error, {
          additionalData: { cityName },
        });
      }
    },
    [setCity]
  );

  useEffect(() => {
    if (city) {
      fetchWeatherForCity(city);
    }
  }, [city, fetchWeatherForCity]);

  const handleSave = () => {
    setCity(inputCity);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputCity(city);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-800/70 rounded-lg px-2 md:px-3 py-2 border border-gray-700/50 min-w-[150px] md:min-w-[200px]">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs md:text-sm w-full focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-accent))]"
            placeholder="Enter city name"
            autoFocus
          />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gray-800/70 rounded-lg px-2 md:px-3 py-2 border border-gray-700/50 min-w-[150px] md:min-w-[200px]">
        <div className="flex items-center justify-center">
          <span className="text-xs md:text-sm text-gray-400">
            {error || `Loading ${city}...`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setInputCity(city);
        setIsEditing(true);
      }}
      className="bg-gray-800/70 rounded-lg px-2 md:px-4 py-2 flex items-center space-x-2 md:space-x-3 border border-gray-700/50 hover:bg-gray-800/90 transition-all duration-200 group min-w-[150px] md:min-w-[200px]"
      aria-label={`Weather in ${city}: ${Math.round(
        weather.temperature
      )}°C. Click to change city.`}
    >
      <div className="text-center flex-1">
        <div className="text-xs md:text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">
          {city}
        </div>
        <div className="text-xs text-gray-400 hidden md:block">
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
        <span className="text-sm md:text-lg font-bold text-white">
          {Math.round(weather.temperature)}°C
        </span>
        <div className="text-sm md:text-lg">
          <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} />
        </div>
      </div>
    </button>
  );
};
