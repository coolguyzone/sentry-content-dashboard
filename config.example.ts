// Sentry Content Aggregator Configuration
// Copy this file to config.ts and update the values as needed

export const config = {
  // YouTube Data API v3 Key (required for real YouTube integration)
  // Get your API key from: https://console.cloud.google.com/
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || 'your_youtube_api_key_here',
    channelId: 'UCJQJAI7IZDmYvQw8tJ9KZqg', // Sentry's YouTube channel ID
    maxResults: 50,
  },
  
  // Blog configuration
  blog: {
    rssUrl: 'https://blog.sentry.io/feed.xml',
    maxPosts: 100,
  },
  
  // Content filtering
  content: {
    daysToShow: 90, // Show content from the last X days
    maxContentItems: 200,
  },
  
  // Cache settings
  cache: {
    ttl: 3600, // Cache TTL in seconds
    maxSize: 100, // Maximum cache entries
  },
  
  // Rate limiting
  rateLimit: {
    requests: 100, // Max requests per window
    windowMs: 900000, // Window in milliseconds (15 minutes)
  },
  
  // App settings
  app: {
    name: 'Sentry Content Aggregator',
    description: 'Latest content from Sentry blog and YouTube channel',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default config;
