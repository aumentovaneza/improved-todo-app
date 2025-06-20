# News Widget Setup

## API Key Configuration

To use the News widget, you need to obtain a free API key from NewsAPI.org and add it to your environment variables.

### Steps:

1. **Get NewsAPI.org API Key:**

    - Visit [NewsAPI.org](https://newsapi.org/)
    - Sign up for a free account (allows 1,000 requests per day)
    - Get your API key from the dashboard

2. **Add to Environment Variables:**
   Add the following line to your `.env` file:

    ```
    VITE_NEWS_ORG_API=your_api_key_here
    ```

3. **Restart Development Server:**
   After adding the API key, restart your development server:
    ```bash
    npm run dev
    ```

## Widget Features

-   **Personalized News:** Shows news based on user's preferred category
-   **Top 5 Articles:** Displays the most recent top headlines from Philippines
-   **Clickable Articles:** Each article opens in a new tab
-   **Source Attribution:** Shows the news source name
-   **Time Stamps:** Displays "time ago" format (e.g., "3 hours ago")
-   **Auto Refresh:** Updates news every 30 minutes
-   **Manual Refresh:** Click the refresh button to update immediately
-   **Category Display:** Shows current active category as a badge
-   **Offline Cache:** Stores articles in localStorage for better UX
-   **Error Handling:** Graceful fallback when API is unavailable

## User Preferences

### Setting News Category:

1. Go to **Profile → Edit Profile**
2. Find the **News Preferences** section
3. Select your preferred category:
    - General (default)
    - Business
    - Entertainment
    - Health
    - Science
    - Sports
    - Technology
4. Click **Save Preferences**

### Backend Integration:

-   User preferences are stored in the `users` table (`news_category` column)
-   API endpoints: `GET/POST /api/user/news-category`
-   Uses Laravel Sanctum for authentication
-   Real-time preference updates without page refresh

## Supported Categories

The widget supports all NewsAPI.org categories for Philippines:

-   **General:** Mixed news topics
-   **Business:** Economic and business news
-   **Entertainment:** Celebrity and entertainment news
-   **Health:** Medical and health-related news
-   **Science:** Scientific discoveries and research
-   **Sports:** Sports news and updates
-   **Technology:** Tech industry and innovation news

## Troubleshooting

-   **No articles showing:** Check that your API key is correctly set
-   **API errors:** Ensure you haven't exceeded the daily request limit (1,000 for free accounts)
-   **Category not updating:** Check that the preference was saved in your profile
-   **Loading issues:** Check browser console for error messages
-   **Cached articles:** The widget uses localStorage to cache articles for better performance

## Technical Details

-   **API Endpoint:** `https://newsapi.org/v2/top-headlines`
-   **Country:** Philippines (`ph`)
-   **Page Size:** 5 articles
-   **Refresh Interval:** 30 minutes
-   **Cache Duration:** 1 hour
-   **Authentication:** Laravel Sanctum for user preferences
