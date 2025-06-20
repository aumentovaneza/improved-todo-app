import { useState, useEffect } from "react";
import {
    Newspaper,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    Clock,
    TrendingUp,
    Globe,
} from "lucide-react";
import axios from "axios";

const NewsWidget = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState("general");

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const articleDate = new Date(dateString);
        const diffInMinutes = Math.floor((now - articleDate) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days}d ago`;
        }
    };

    const fetchUserNewsCategory = async () => {
        try {
            const response = await axios.get("/api/user/news-category");
            return response.data.news_category || "general";
        } catch (err) {
            console.error("Failed to fetch user news category:", err);
            return "general";
        }
    };

    const fetchNews = async (newsCategory = "general") => {
        try {
            setLoading(true);
            setError(null);

            const apiKey = import.meta.env.VITE_NEWS_ORG_API;
            if (!apiKey) {
                throw new Error("News API key not found");
            }

            const response = await fetch(
                `https://newsapi.org/v2/top-headlines?category=${newsCategory}&pageSize=5&apiKey=${apiKey}`
            );

            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "error") {
                throw new Error(data.message || "Failed to fetch news");
            }

            setArticles(data.articles || []);

            // Cache articles in localStorage for better UX
            localStorage.setItem(
                "newsWidgetCache",
                JSON.stringify({
                    articles: data.articles || [],
                    category: newsCategory,
                    timestamp: Date.now(),
                })
            );
        } catch (err) {
            console.error("News fetch error:", err);
            setError(err.message);

            // Try to load from cache if available
            const cached = localStorage.getItem("newsWidgetCache");
            if (cached) {
                const cachedData = JSON.parse(cached);
                // Use cache if it's less than 1 hour old
                if (Date.now() - cachedData.timestamp < 3600000) {
                    setArticles(cachedData.articles);
                    setError(null);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        const userCategory = await fetchUserNewsCategory();
        setCategory(userCategory);
        await fetchNews(userCategory);
    };

    const getCategoryDisplayName = (cat) => {
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    };

    const getCategoryColor = (cat) => {
        const colors = {
            general:
                "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
            business:
                "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
            entertainment:
                "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
            health: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
            science:
                "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200",
            sports: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
            technology:
                "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
        };
        return colors[cat] || colors.general;
    };

    useEffect(() => {
        const initializeNews = async () => {
            const userCategory = await fetchUserNewsCategory();
            setCategory(userCategory);
            await fetchNews(userCategory);
        };

        initializeNews();

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
                            Loading news...
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
                        News Unavailable
                    </h3>
                    <p className="text-sm text-adaptive-muted mb-4 max-w-xs">
                        Unable to fetch news articles. Please check your
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
        <div className="card h-80 sm:h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 text-white flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Newspaper className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold">
                                Latest News
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <Globe className="h-3 w-3" />
                                <span className="text-xs text-white/80">
                                    Live updates
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                        title="Refresh news"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(
                            category
                        )} bg-white/20 text-white`}
                    >
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        {getCategoryDisplayName(category)}
                    </span>
                    <span className="text-xs text-white/80">
                        {articles.length} articles
                    </span>
                </div>
            </div>

            {/* News Content */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
                {articles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <Newspaper className="h-8 w-8 text-adaptive-muted" />
                        </div>
                        <h4 className="text-lg font-semibold text-adaptive-primary mb-2">
                            No News Available
                        </h4>
                        <p className="text-sm text-adaptive-muted max-w-xs">
                            We couldn't find any news articles at the moment.
                            Try refreshing or check back later.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {articles.map((article, index) => (
                            <article
                                key={index}
                                className={`group ${
                                    index === 0
                                        ? "p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-l-4 border-blue-500"
                                        : "pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                }`}
                            >
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <div className="flex items-start space-x-3">
                                        {article.urlToImage && (
                                            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                <img
                                                    src={article.urlToImage}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4
                                                className={`font-semibold text-adaptive-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2 ${
                                                    index === 0
                                                        ? "text-base sm:text-lg"
                                                        : "text-sm"
                                                }`}
                                            >
                                                {article.title}
                                                <ExternalLink className="inline h-3 w-3 ml-1 opacity-50" />
                                            </h4>

                                            {index === 0 &&
                                                article.description && (
                                                    <p className="text-sm text-adaptive-muted line-clamp-2 mb-3">
                                                        {article.description}
                                                    </p>
                                                )}

                                            <div className="flex items-center justify-between text-xs text-adaptive-muted">
                                                <div className="flex items-center space-x-3">
                                                    <span className="truncate max-w-24 sm:max-w-32">
                                                        {article.source?.name ||
                                                            "Unknown Source"}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                        <span className="whitespace-nowrap">
                                                            {formatTimeAgo(
                                                                article.publishedAt
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                {index === 0 && (
                                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsWidget;
