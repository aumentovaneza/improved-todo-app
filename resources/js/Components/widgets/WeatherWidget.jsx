import { useState, useEffect } from "react";
import {
    Cloud,
    Sun,
    CloudRain,
    CloudSnow,
    MapPin,
    RefreshCw,
    AlertCircle,
    Droplets,
    Wind,
    Eye,
    Thermometer,
    Calendar,
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

    const getWeatherGradient = (condition) => {
        if (
            condition?.toLowerCase().includes("sunny") ||
            condition?.toLowerCase().includes("clear")
        ) {
            return "from-yellow-400 to-orange-500";
        } else if (
            condition?.toLowerCase().includes("rain") ||
            condition?.toLowerCase().includes("shower")
        ) {
            return "from-blue-400 to-blue-600";
        } else if (condition?.toLowerCase().includes("snow")) {
            return "from-blue-200 to-blue-400";
        } else if (condition?.toLowerCase().includes("cloud")) {
            return "from-gray-400 to-gray-600";
        }
        return "from-blue-400 to-purple-500";
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
                visibility: data.current.vis_km,
                feelsLike: Math.round(data.current.feelslike_c),
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
            <div className="card h-80 sm:h-96">
                <div className="p-4 sm:p-6 flex items-center justify-center h-full">
                    <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <p className="text-sm text-adaptive-muted">
                            Loading weather...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card h-80 sm:h-96">
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-adaptive-primary mb-2">
                        Weather Unavailable
                    </h3>
                    <p className="text-sm text-adaptive-muted mb-4 max-w-xs">
                        Unable to fetch weather data. Please check your
                        connection and try again.
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Try Again</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden flex flex-col">
            {/* Header with gradient background - Full width design */}
            <div
                className={`bg-gradient-to-r ${getWeatherGradient(
                    weather?.condition
                )} p-6 sm:p-8 text-white relative`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold flex items-center space-x-3">
                        <span>Weather</span>
                    </h3>
                    <button
                        onClick={handleRefresh}
                        className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        title="Refresh weather data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                {/* Current Weather - Enhanced for full width */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        {weather?.icon ? (
                            <img
                                src={weather.icon}
                                alt={weather.condition}
                                className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-lg"
                            />
                        ) : (
                            <div className="h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center">
                                {getWeatherIcon(weather?.condition || "")}
                            </div>
                        )}
                        <div>
                            <div className="text-3xl sm:text-4xl font-bold mb-1">
                                {weather?.temperature}°
                            </div>
                            <div className="text-sm sm:text-base text-white/90 capitalize mb-1">
                                {weather?.condition}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-white/80">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span>{location}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="text-center sm:text-right">
                            <div className="text-xs sm:text-sm text-white/90 mb-1">
                                Feels like
                            </div>
                            <div className="text-2xl sm:text-3xl font-semibold">
                                {weather?.feelsLike}°
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weather Details - Side by side layout for full width */}
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Weather Stats */}
                    <div>
                        <h4 className="text-sm sm:text-base font-semibold text-adaptive-primary mb-3 flex items-center">
                            <Thermometer className="h-4 w-4 mr-2" />
                            Current Conditions
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <Droplets className="h-5 w-5 text-blue-500 mb-1" />
                                <span className="text-xs text-adaptive-muted mb-1">
                                    Humidity
                                </span>
                                <span className="text-sm font-semibold text-adaptive-primary">
                                    {weather?.humidity}%
                                </span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <Wind className="h-5 w-5 text-green-500 mb-1" />
                                <span className="text-xs text-adaptive-muted mb-1">
                                    Wind
                                </span>
                                <span className="text-sm font-semibold text-adaptive-primary">
                                    {weather?.windSpeed} km/h
                                </span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <Eye className="h-5 w-5 text-purple-500 mb-1" />
                                <span className="text-xs text-adaptive-muted mb-1">
                                    Visibility
                                </span>
                                <span className="text-sm font-semibold text-adaptive-primary">
                                    {weather?.visibility} km
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3-Day Forecast */}
                    <div>
                        <h4 className="text-sm sm:text-base font-semibold text-adaptive-primary mb-3 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            3-Day Forecast
                        </h4>
                        <div className="space-y-2">
                            {forecast.map((day, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={day.icon}
                                            alt={day.condition}
                                            className="h-8 w-8"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-adaptive-primary">
                                                {day.dayName}
                                            </div>
                                            <div className="text-xs text-adaptive-muted capitalize">
                                                {day.condition}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {day.chanceOfRain > 0 && (
                                            <div className="flex items-center space-x-1 text-blue-500">
                                                <Droplets className="h-3 w-3" />
                                                <span className="text-xs font-medium">
                                                    {day.chanceOfRain}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-adaptive-primary">
                                                {day.maxTemp}°
                                            </span>
                                            <span className="text-xs text-adaptive-muted ml-1">
                                                / {day.minTemp}°
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
