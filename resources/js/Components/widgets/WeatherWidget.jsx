import { useState, useEffect } from "react";
import {
    Cloud,
    Sun,
    CloudRain,
    CloudSnow,
    MapPin,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState("Davao City, Philippines");

    const getWeatherIcon = (condition) => {
        const iconClass = "h-8 w-8";

        if (
            condition.toLowerCase().includes("sunny") ||
            condition.toLowerCase().includes("clear")
        ) {
            return <Sun className={`${iconClass} text-yellow-500`} />;
        } else if (
            condition.toLowerCase().includes("rain") ||
            condition.toLowerCase().includes("shower")
        ) {
            return <CloudRain className={`${iconClass} text-blue-500`} />;
        } else if (condition.toLowerCase().includes("snow")) {
            return <CloudSnow className={`${iconClass} text-blue-300`} />;
        } else {
            return <Cloud className={`${iconClass} text-gray-500`} />;
        }
    };

    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                }
            );
        });
    };

    const fetchWeatherData = async (coords = null) => {
        try {
            setLoading(true);
            setError(null);

            const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
            if (!apiKey) {
                throw new Error("Weather API key not found");
            }

            let query = "Davao City, Philippines"; // Default fallback

            if (coords) {
                query = `${coords.lat},${coords.lon}`;
            }

            const response = await fetch(
                `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=3&aqi=no&alerts=no`
            );

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();

            setWeather({
                location: data.location.name,
                country: data.location.country,
                temperature: Math.round(data.current.temp_c),
                condition: data.current.condition.text,
                icon: data.current.condition.icon,
                humidity: data.current.humidity,
                windSpeed: data.current.wind_kph,
            });

            // Process forecast data
            const forecastData = data.forecast.forecastday.map(
                (day, index) => ({
                    date: new Date(day.date),
                    isToday: index === 0,
                    dayName:
                        index === 0
                            ? "Today"
                            : index === 1
                            ? "Tomorrow"
                            : new Date(day.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                              }),
                    maxTemp: Math.round(day.day.maxtemp_c),
                    minTemp: Math.round(day.day.mintemp_c),
                    condition: day.day.condition.text,
                    icon: day.day.condition.icon,
                    chanceOfRain: day.day.daily_chance_of_rain,
                })
            );

            setForecast(forecastData);
            setLocation(`${data.location.name}, ${data.location.country}`);
        } catch (err) {
            console.error("Weather fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            const coords = await getUserLocation();
            await fetchWeatherData(coords);
        } catch (err) {
            // Fallback to default location if geolocation fails
            await fetchWeatherData();
        }
    };

    useEffect(() => {
        const initializeWeather = async () => {
            try {
                const coords = await getUserLocation();
                await fetchWeatherData(coords);
            } catch (err) {
                // Fallback to default location if geolocation fails
                await fetchWeatherData();
            }
        };

        initializeWeather();

        // Set up interval to refresh every 30 minutes
        const interval = setInterval(() => {
            handleRefresh();
        }, 30 * 60 * 1000); // 30 minutes

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="card h-80">
                <div className="p-6 flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card h-80">
                <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p className="text-sm text-adaptive-muted mb-3">
                        Weather data unavailable
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="btn-primary text-xs px-3 py-1"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card h-80">
            <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-adaptive-primary">
                        Weather
                    </h3>
                    <button
                        onClick={handleRefresh}
                        className="text-adaptive-muted hover:text-adaptive-primary transition-colors"
                        title="Refresh weather data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                {/* Current Weather */}
                <div className="mb-4">
                    <div className="flex items-center space-x-3 mb-2">
                        {weather?.icon ? (
                            <img
                                src={weather.icon}
                                alt={weather.condition}
                                className="h-12 w-12"
                            />
                        ) : (
                            getWeatherIcon(weather?.condition || "")
                        )}
                        <div>
                            <div className="text-2xl font-bold text-adaptive-primary">
                                {weather?.temperature}°C
                            </div>
                            <div className="text-sm text-adaptive-muted">
                                {weather?.condition}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-adaptive-muted">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                {/* 3-Day Forecast */}
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-adaptive-primary mb-3">
                        3-Day Forecast
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {forecast.map((day, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center py-3 px-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                                <div className="text-xs font-medium text-adaptive-primary mb-1">
                                    {day.dayName}
                                </div>
                                <img
                                    src={day.icon}
                                    alt={day.condition}
                                    className="h-8 w-8 mb-1"
                                />
                                <div className="flex items-center space-x-1 mb-1">
                                    <span className="text-sm font-medium text-adaptive-primary">
                                        {day.maxTemp}°
                                    </span>
                                    <span className="text-xs text-adaptive-muted">
                                        {day.minTemp}°
                                    </span>
                                </div>
                                {day.chanceOfRain > 0 && (
                                    <div className="text-xs text-blue-500">
                                        {day.chanceOfRain}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
