# Sentry Content Terminal 🎮

A retro 8-bit video game styled content aggregator that brings together the latest content from Sentry's blog, YouTube channel, and documentation.

## ✨ Features

- **🎥 YouTube Integration** - Real-time videos from Sentry's official channel
- **📝 Blog Aggregation** - Latest posts from blog.sentry.io
- **📚 Documentation Monitoring** - Track documentation changes with AI-powered summaries
- **🤖 AI Summaries** - ChatGPT generates user-friendly summaries of docs updates (optional)
- **📊 Analytics** - Vercel Analytics tracks visitor metrics and popular content
- **🎮 Retro Gaming UI** - 8-bit pixel art aesthetic with neon colors
- **🔍 Content Filtering** - Filter by source type (All, Blog, YouTube, Docs) and category (Gaming, Mobile, Web, Technical, Business)
- **📱 Responsive Design** - Works on all devices
- **⚡ Real-time Updates** - Fresh content every time you visit

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- YouTube Data API v3 key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sentry-content-aggregator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp config.example.ts config.ts
   # Edit config.ts with your YouTube API key
   ```

4. **Create .env.local**
   ```bash
   echo "YOUTUBE_API_KEY=your_actual_api_key_here" > .env.local
   # Optional: Add OPENAI_API_KEY for AI-powered doc summaries
   ```

5. **Seed the docs changelog**
   ```bash
   npm run seed-docs
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser** to `http://localhost:3000`

## 🔧 Configuration

### YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your `.env.local` file

### Content Sources

- **Blog**: Automatically fetches from `https://blog.sentry.io/feed.xml`
- **YouTube**: Uses your API key to fetch from Sentry's official channel
- **Documentation**: Tracks commit history from `getsentry/sentry-docs` with optional AI summaries

### AI-Powered Doc Summaries (Optional)

Enable ChatGPT to generate user-friendly summaries of documentation changes:

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Run `npm run seed-docs` to generate summaries

See [AI_SUMMARIES.md](./AI_SUMMARIES.md) for detailed setup instructions and examples.

## 🏷️ Content Categories

The app automatically categorizes content into 5 main categories:

- **🎮 Gaming** - Unity, Godot, game development, and gaming SDKs
- **📱 Mobile** - iOS, Android, Flutter, React Native, and mobile development
- **🌐 Web** - JavaScript, React, Node.js, and web development
- **⚙️ Technical** - SDKs, APIs, tutorials, and development guides
- **💼 Business** - Product announcements, company news, and business updates

Content is automatically categorized using intelligent keyword matching and can appear in multiple categories for better discoverability.

## 📊 Docs Monitoring Cron Job

The app includes an automated system to monitor Sentry's documentation for new pages.

### How It Works

1. **Daily Monitoring**: Runs automatically every day at 2 AM UTC via GitHub Actions
2. **Sitemap Crawling**: Checks `https://docs.sentry.io/sitemap.xml` for new pages
3. **Content Discovery**: Automatically discovers and indexes new documentation
4. **Smart Filtering**: Only shows documentation from the last 90 days

### Manual Monitoring

You can run the monitoring script manually:

```bash
npm run monitor-docs
```

This will:
- Fetch the current docs sitemap
- Compare with previously known pages
- Download and parse new pages
- Update the local storage

### GitHub Actions Setup

The cron job is configured in `.github/workflows/monitor-docs.yml` and will:

- Run automatically every day
- Use your repository's secrets for API keys
- Commit and push new content discoveries
- Keep your aggregator up-to-date

### Required Secrets

Add these to your GitHub repository secrets:

- `YOUTUBE_API_KEY`: Your YouTube Data API v3 key

## 🎨 Customization

### Retro Gaming Theme

The app uses a custom 8-bit video game aesthetic:

- **Fonts**: Press Start 2P (headings), VT323 (body text)
- **Colors**: Neon green, blue, red, cyan, and yellow
- **Effects**: Pixel borders, glowing text, scanning animations
- **Layout**: Card-based grid with hover effects

### Styling

All custom styles are in `src/app/globals.css`:

- `.pixel-border` - Pixel art borders
- `.retro-button` - Gaming-style buttons
- `.pixel-text` - Text with pixel shadows
- `.retro-scanner` - Loading animations

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel** at [vercel.com](https://vercel.com)
3. **Import your repository**
4. **Add environment variables**:
   - `YOUTUBE_API_KEY`: Your YouTube API key
5. **Deploy** - Vercel will auto-detect Next.js

### Environment Variables for Production

- `YOUTUBE_API_KEY`: Required for YouTube integration
- `NEXT_PUBLIC_APP_URL`: Your app's public URL

## 📁 Project Structure

```
sentry-content-aggregator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── blog/          # Blog RSS feed API
│   │   │   ├── youtube/       # YouTube API integration
│   │   │   └── docs/          # Documentation API
│   │   ├── globals.css        # Retro gaming styles
│   │   ├── layout.tsx         # App layout
│   │   └── page.tsx           # Main content page
│   └── ...
├── scripts/
│   └── monitor-docs.js        # Docs monitoring script
├── .github/
│   └── workflows/
│       └── monitor-docs.yml   # GitHub Actions cron job
├── data/
│   └── docs-pages.json        # Discovered docs storage
└── config.ts                  # App configuration
```

## 🔍 Content Filtering

The app provides powerful filtering capabilities:

### Source Filtering
- **All Content** - View everything from all sources
- **Blog Posts** - Only blog articles from Sentry
- **YouTube Videos** - Only video content
- **Documentation** - Only technical docs
- **Changelog** - Only product updates

### Category Filtering
- **All Categories** - View content from any category
- **Gaming** - Game development and gaming SDK content
- **Mobile** - Mobile app development content
- **Web** - Web development and frontend content
- **Technical** - SDKs, APIs, and development guides
- **Business** - Product announcements and company news

### Combined Filtering
You can combine source and category filters to find exactly what you're looking for. For example, show only technical blog posts or gaming-related videos.

## 🔍 API Endpoints

- `GET /api/blog` - Blog posts from RSS feed
- `GET /api/youtube` - YouTube videos from Sentry channel
- `GET /api/docs` - Documentation pages discovered by monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Sentry** for the amazing monitoring platform and content
- **Next.js** for the powerful React framework
- **Tailwind CSS** for the utility-first styling
- **Google** for the YouTube Data API

---

**Ready to monitor Sentry content like it's 1989! 🕹️✨**
