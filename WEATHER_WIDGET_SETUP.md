# Weather Widget Setup

## API Key Configuration

To use the Weather widget, you need to obtain a free API key from WeatherAPI.com and add it to your environment variables.

### Steps:

1. **Get WeatherAPI.com API Key:**

    - Visit [WeatherAPI.com](https://www.weatherapi.com/)
    - Sign up for a free account
    - Get your API key from the dashboard

2. **Add to Environment Variables:**
   Add the following line to your `.env` file:

    ```
    VITE_WEATHER_API_KEY=your_api_key_here
    ```

3. **Restart Development Server:**
   After adding the API key, restart your development server:
    ```bash
    npm run dev
    ```

## Widget Features

-   **Current Weather:** Shows real-time temperature, condition, and weather icon
-   **3-Day Forecast:** Displays Today, Tomorrow, and the next day with high/low temps
-   **Rain Probability:** Shows chance of rain percentage when applicable
-   **Automatic Location Detection:** Uses browser geolocation API
-   **Fallback Location:** Defaults to Davao City, Philippines if geolocation fails
-   **Auto Refresh:** Updates weather data every 30 minutes
-   **Manual Refresh:** Click the refresh button to update immediately
-   **Error Handling:** Graceful fallback when API is unavailable

## Troubleshooting

-   If weather data doesn't load, check that your API key is correctly set
-   Ensure your browser allows geolocation for the site
-   Check browser console for any error messages
