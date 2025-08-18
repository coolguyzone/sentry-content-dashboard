# Sentry Content Aggregator

A Next.js web application that aggregates and displays content from the Sentry blog and YouTube channel from the last 90 days. The app provides a beautiful, modern interface to browse through recent Sentry content with direct links to the original sources.

## Features

- 📝 **Blog Posts**: Fetches recent blog posts from [Sentry's blog](https://blog.sentry.io/)
- 🎥 **YouTube Videos**: Displays recent videos from Sentry's YouTube channel
- 📊 **Content Overview**: Shows statistics and counts for different content types
- 🔍 **Smart Filtering**: Automatically filters content to show only items from the last 90 days
- 📱 **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- ⚡ **Real-time Updates**: Content is fetched fresh on each page load

## Screenshots

The application features a dark theme with:
- Header with Sentry branding and last updated timestamp
- Statistics cards showing content counts
- Content cards with source indicators, titles, descriptions, and direct links
- Hover effects and smooth transitions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd sentry-content-aggregator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Integration

### Blog Posts

The app currently fetches blog posts from Sentry's RSS feed at `https://blog.sentry.io/feed.xml`. This is implemented in `/api/blog/route.ts`.

### YouTube Videos

The YouTube integration currently uses mock data for demonstration purposes. To integrate with the real YouTube Data API v3:

1. **Get a YouTube Data API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3
   - Create credentials (API Key)

2. **Set up Environment Variables**:
   Create a `.env.local` file:
   ```env
   YOUTUBE_API_KEY=your_api_key_here
   ```

3. **Update the YouTube API Route**:
   Replace the mock data function in `/api/youtube/route.ts` with the commented real API implementation.

4. **Rate Limiting**:
   The YouTube Data API has quotas. Consider implementing caching to avoid hitting limits.

## Production Deployment

### Environment Variables

For production, you may want to set:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
YOUTUBE_API_KEY=your_production_api_key
```

### Caching

Consider implementing caching strategies:
- Cache RSS feed responses (blog posts don't change frequently)
- Cache YouTube API responses with appropriate TTL
- Use Next.js built-in caching mechanisms

### Monitoring

- Monitor API rate limits
- Set up error tracking (ironically, you could use Sentry!)
- Monitor performance metrics

## Customization

### Adding New Content Sources

To add new content sources:

1. Create a new API route in `/api/[source]/route.ts`
2. Update the main page component to fetch from the new source
3. Add the new source type to the `ContentItem` interface
4. Update the UI to display the new content type

### Styling

The app uses Tailwind CSS with a custom color scheme. You can customize:
- Colors in `tailwind.config.js`
- Component styles in the page components
- Global styles in `globals.css`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Sentry](https://sentry.io/) for providing excellent monitoring tools and content
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

---

Built with ❤️ for the Sentry community
