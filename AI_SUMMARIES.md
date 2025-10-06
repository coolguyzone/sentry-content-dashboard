# AI-Powered Documentation Summaries 🤖

The Sentry Content Dashboard can generate AI-powered summaries of documentation changes using OpenAI's GPT-3.5-turbo model.

## Current Status

- ✅ **AI Integration Ready**: The code is fully implemented and ready to use
- ⚠️ **Requires API Key**: You need to add an OpenAI API key to enable this feature
- 🔄 **Fallback Available**: Without an API key, the system uses basic file-list summaries

## What AI Summaries Provide

Instead of basic summaries like:
> "Documentation changes in 1 file(s), 1 modified. Files: docs/platforms/python/configuration/options.mdx"

AI summaries provide context like:
> "This update documents the new trace_ignore_status_codes configuration option for Python SDK users, allowing developers to filter out specific HTTP status codes from trace collection. This is particularly useful for reducing noise from expected error responses like 404s or 401s."

## How to Enable AI Summaries

### 1. Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. **Important**: Save it somewhere safe - you won't be able to see it again!

### 2. Add the API Key to Your Environment

#### For Local Development:

Create or edit `.env.local` in the project root:

```bash
# Add this line to your .env.local file
OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### For Production (Vercel):

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-api-key-here`
   - **Environment**: Production, Preview, Development (select all)
5. Click "Save"
6. Redeploy your app for changes to take effect

### 3. Run the Seed Script

```bash
npm run seed-docs
```

You should see:
```
✅ OpenAI API key detected - AI summaries enabled
🤖 Generating AI summary...
✅ AI summary generated
```

## Cost Considerations

- **Model Used**: GPT-3.5-turbo (cost-effective)
- **Tokens Per Summary**: ~150-300 tokens (~$0.0002-0.0004 per summary)
- **Typical Usage**: 10 commits = ~$0.004 (less than a cent)
- **Rate Limiting**: Built-in 500ms delay between requests

For most use cases, this will cost less than $1/month even with frequent updates.

## How It Works

### The AI Analysis Process:

1. **Fetches Commit Data**: Gets the commit message, author, and file changes from GitHub
2. **Prepares Context**: Includes file names, change types (added/modified/removed), and line counts
3. **Sends to OpenAI**: Uses GPT-3.5-turbo with a specialized prompt for technical writing
4. **Generates Summary**: Produces a 2-3 sentence user-friendly summary focusing on:
   - What was changed
   - Why it matters to users
   - Key improvements or features

### Example Prompt Template:

```
Analyze these documentation changes from the Sentry docs repository and 
provide a brief, user-friendly summary (2-3 sentences max):

Commit Message: feat(python): Document trace_ignore_status_codes option
Files Changed: 1
Author: Alex Alderman Webb

File Details:
- docs/platforms/python/configuration/options.mdx (modified): +15 -2 lines

Please provide a concise summary focusing on what documentation was updated 
and why it might be important to users.
```

## Webhook Integration

The AI summary generation is also used by the GitHub webhook integration (`src/utils/githubProcessor.ts`), so when new commits are pushed to sentry-docs, they'll automatically get AI summaries if the key is configured.

## Troubleshooting

### "OpenAI API key not found"
- Make sure you've added `OPENAI_API_KEY` to your `.env.local` file
- Verify there are no extra spaces or quotes around the key
- Restart your development server after adding the key

### "AI summary failed"
- Check your OpenAI account has credits available
- Verify the API key is still valid at https://platform.openai.com/api-keys
- Check the error message in the console for specific details

### Rate Limiting
- The script includes a 500ms delay between AI requests
- If you're processing many commits, the script will take longer but stay within rate limits

## Disabling AI Summaries

To disable AI summaries, simply remove or don't set the `OPENAI_API_KEY` environment variable. The system will automatically fall back to basic file-list summaries.

## Alternative: Use GPT-4 for Better Summaries

If you want even better summaries, edit `config.ts`:

```typescript
openai: {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4', // Change from 'gpt-3.5-turbo'
},
```

Note: GPT-4 is more expensive (~15x) but produces more nuanced summaries.

