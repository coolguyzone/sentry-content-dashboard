# GitHub Integration for Sentry Docs Changelog

This document explains how the GitHub integration works to automatically track changes in the Sentry docs repository and generate AI-powered summaries.

## Overview

The system monitors the `getsentry/sentry-docs` repository for changes to the master branch and automatically:

1. **Detects Documentation Changes**: Filters commits to only include changes to documentation files (`.md`, `.mdx`, files in `/docs/` directories)
2. **Fetches Detailed Information**: Uses the GitHub API to get commit details, file changes, and metadata
3. **Generates AI Summaries**: Uses OpenAI's ChatGPT API to create user-friendly summaries of the changes
4. **Stores Changelog Entries**: Saves the processed changes to a local JSON file
5. **Serves via API**: Makes the changelog available through the existing `/api/changelog` endpoint

## Architecture

```
GitHub Repository (getsentry/sentry-docs)
    ↓ (webhook on push to master)
GitHub Webhook Handler (/api/github/webhook)
    ↓ (process commit details)
GitHub API Integration (Octokit)
    ↓ (filter doc files, get diffs)
OpenAI API (ChatGPT)
    ↓ (generate summaries)
Local Storage (data/docs-changelog.json)
    ↓ (serve via API)
Changelog API (/api/changelog)
    ↓ (display in UI)
Frontend (changelog filter)
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file with the following variables:

```env
# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key_here

# YouTube API (existing)
YOUTUBE_API_KEY=your_youtube_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Get Required API Keys

#### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token to your `.env.local` file

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key to your `.env.local` file

### 4. Set Up GitHub Webhook

1. Go to https://github.com/getsentry/sentry-docs/settings/hooks
2. Click "Add webhook"
3. Set Payload URL to: `https://your-domain.com/api/github/webhook`
4. Set Content type to: `application/json`
5. Set Secret to your `GITHUB_WEBHOOK_SECRET`
6. Select "Just the push event"
7. Click "Add webhook"

### 5. Run Setup Script (Optional)

```bash
npm run setup-github
```

This interactive script will guide you through the setup process.

## API Endpoints

### Webhook Endpoint
- **POST** `/api/github/webhook` - Receives GitHub webhook notifications
- **GET** `/api/github/webhook` - Health check

### Manual Trigger
- **POST** `/api/github/trigger` - Manually process recent commits
- **GET** `/api/github/trigger` - Get endpoint information

### Changelog API
- **GET** `/api/changelog` - Returns combined changelog (official + docs changes)

## Data Structure

Each changelog entry includes:

```typescript
interface ChangelogEntry {
  id: string;                    // Unique identifier
  title: string;                 // Commit message or generated title
  description: string;           // AI-generated summary
  url: string;                   // GitHub commit URL
  publishedAt: string;           // Commit timestamp
  source: 'changelog';           // Source type
  categories: string[];          // Detected categories
  commitId: string;              // GitHub commit SHA
  author: string;                // Commit author
  filesChanged: {                // File change details
    added: string[];
    removed: string[];
    modified: string[];
  };
  aiSummary: string;             // AI-generated summary
}
```

## File Filtering

The system only processes commits that include changes to documentation files:

- Files ending with `.md` or `.mdx`
- Files in directories containing `/docs/` or `/documentation/`
- Other documentation-related files as needed

## AI Summary Generation

The OpenAI integration:

1. Analyzes commit messages and file changes
2. Generates user-friendly summaries (2-3 sentences)
3. Focuses on user impact and key improvements
4. Falls back to basic summaries if AI is unavailable

## Storage

Changelog entries are stored in `data/docs-changelog.json`:

- JSON format for easy reading and debugging
- Limited to 100 most recent entries
- Automatically pruned to prevent file growth
- Can be easily migrated to a database later

## Testing

### Manual Testing
1. Start the development server: `npm run dev`
2. Test the manual trigger: `POST /api/github/trigger`
3. Check the changelog: `GET /api/changelog`
4. View in the UI with the changelog filter

### Webhook Testing
1. Make a test commit to the sentry-docs repository
2. Check the webhook logs in your application
3. Verify the changelog entry appears in the API

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check GitHub webhook delivery logs

2. **GitHub API rate limits**
   - Ensure you have a valid GitHub token
   - Check rate limit status in API responses

3. **OpenAI API errors**
   - Verify API key is valid
   - Check API usage limits
   - System will fall back to basic summaries

4. **No documentation files detected**
   - Check file filtering logic
   - Verify commit actually changed doc files

### Debugging

Enable debug logging by checking the console output for:
- Webhook processing logs
- GitHub API responses
- OpenAI API calls
- File processing details

## Security Considerations

1. **Webhook Security**: Always verify webhook signatures
2. **API Keys**: Store securely in environment variables
3. **Rate Limiting**: Implement rate limiting for webhook endpoints
4. **Input Validation**: Validate all incoming webhook data

## Future Enhancements

- Database storage instead of JSON files
- More sophisticated file change analysis
- Custom AI prompts for different types of changes
- Integration with other Sentry repositories
- Real-time notifications for significant changes
- Change impact scoring and prioritization
