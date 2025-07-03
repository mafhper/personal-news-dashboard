
import type { WeatherData } from '../types';

const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function getCoordsForCity(cityName: string): Promise<{ latitude: number; longitude: number; name: string } | null> {
    const params = new URLSearchParams({
        name: cityName,
        count: '1',
        language: 'en',
        format: 'json'
    });

    const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch geocoding data');
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        return null; // City not found
    }

    const city = data.results[0];
    return {
        latitude: city.latitude,
        longitude: city.longitude,
        name: city.name
    };
}

export async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current_weather: 'true',
    });

    const response = await fetch(`${FORECAST_API_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    if (!data.current_weather) {
        throw new Error('Invalid weather data received');
    }
    
    return {
        temperature: data.current_weather.temperature,
        weatherCode: data.current_weather.weathercode,
        isDay: data.current_weather.is_day === 1,
    };
}
