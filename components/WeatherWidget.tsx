import React, { useState, useEffect, useCallback } from "react";
import { getWeather, getCoordsForCity } from "../services/weatherService";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLogger } from "../services/logger";
import type { WeatherData } from "../types";

import { Clock } from "./Clock";

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
      icon = " şiddetli 🌧️";
      break;
    case 85:
    case 86:
      icon = " şiddetli ❄️";
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
  return <span className="text-2xl">{icon}</span>;
};

export const WeatherWidget: React.FC<{ timeFormat: "12h" | "24h" }> = ({
  timeFormat,
}) => {
  const logger = useLogger("WeatherWidget");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useLocalStorage<string>("weather-city", "Lisbon");
  const [isEditing, setIsEditing] = useState(false);
  const [inputCity, setInputCity] = useState(city);

  const fetchWeatherForCity = useCallback(
    async (cityName: string) => {
      setError(null);
      setWeather(null);
      try {
        const coords = await getCoordsForCity(cityName);
        if (!coords) {
          setError(`City "${cityName}" not found.`);
          return;
        }
        const weatherData = await getWeather(coords.latitude, coords.longitude);
        setWeather(weatherData);
        setCity(coords.name); // Use the name returned by the API for consistency
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

  return (
    <section
      className="bg-gray-800/50 p-4 rounded-lg mb-6"
      aria-labelledby="weather-widget-heading"
      role="region"
    >
      <h3 id="weather-widget-heading" className="sr-only">
        Weather Information
      </h3>
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex items-center space-x-2"
        >
          <label htmlFor="city-input" className="sr-only">
            Enter city name
          </label>
          <input
            id="city-input"
            type="text"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent)))]"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
            aria-label="City name for weather"
            placeholder="Enter city name"
          />
          <button
            type="submit"
            className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-1 px-3 rounded"
            aria-label="Save city selection"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-gray-400 hover:text-white"
            aria-label="Cancel city editing"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex flex-col w-full">
          {weather ? (
            <>
              <div className="flex justify-between items-center w-full">
                <div>
                  <p
                    className="font-bold text-xl"
                    aria-label={`Current location: ${city}`}
                  >
                    {city}
                  </p>
                  <time
                    className="text-sm text-gray-400"
                    dateTime={new Date().toISOString()}
                    aria-label={`Today is ${new Date().toLocaleDateString(
                      undefined,
                      { weekday: "long", month: "long", day: "numeric" }
                    )}`}
                  >
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className="text-4xl font-bold"
                    aria-label={`Current temperature: ${Math.round(
                      weather.temperature
                    )} degrees Celsius`}
                  >
                    {Math.round(weather.temperature)}°C
                  </span>
                  <div
                    aria-label={`Weather condition: ${
                      weather.isDay ? "Day" : "Night"
                    } time`}
                  >
                    <WeatherIcon
                      code={weather.weatherCode}
                      isDay={weather.isDay}
                    />
                  </div>
                  <Clock city={city} timeFormat={timeFormat} />
                </div>
              </div>
              <div className="w-full text-left mt-2">
                <button
                  onClick={() => {
                    setInputCity(city);
                    setIsEditing(true);
                  }}
                  className="text-gray-400 hover:text-white text-xs"
                  aria-label={`Change weather location from ${city}`}
                >
                  Change
                </button>
              </div>
            </>
          ) : (
            <div
              className="w-full text-center text-gray-400"
              role="status"
              aria-live="polite"
            >
              {error ? (
                <span role="alert">{error}</span>
              ) : (
                <span>Loading weather for {city}...</span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
