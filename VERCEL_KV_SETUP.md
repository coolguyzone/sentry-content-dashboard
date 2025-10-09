# Vercel KV Setup Guide

This guide explains how to set up Vercel KV (Redis) for persistent changelog storage.

## Why Vercel KV?

Vercel's serverless functions have a **read-only filesystem**. When the webhook receives new commits and tries to write to `data/docs-changelog.json`, those changes don't persist between function invocations. Vercel KV provides persistent storage that survives across deployments and function invocations.

## Setup Steps

### 1. Create a Vercel KV Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your `sentry-content-aggregator` project
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **KV (Redis)**
6. Choose a name (e.g., `docs-changelog-kv`)
7. Select the region closest to your users
8. Click **Create**

### 2. Connect KV to Your Project

Vercel will automatically add these environment variables to your project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

These are automatically available in production. For local development, you need to pull them:

```bash
# Pull environment variables from Vercel
npx vercel env pull .env.local
```

This will update your `.env.local` file with the KV credentials.

### 3. Migrate Existing Data

Run the migration script to upload your existing changelog data to Vercel KV:

```bash
node scripts/migrate-to-kv.js
```

You should see:
```
📚 Found 10 changelog entries
⬆️  Uploading to Vercel KV...
✅ Successfully migrated data to Vercel KV
🎉 Migration complete!
```

### 4. Deploy to Vercel

```bash
git push
```

Vercel will automatically deploy your changes. The KV environment variables are already configured.

### 5. Test the Webhook

Manually trigger your GitHub Actions workflow to send a webhook with a new commit. The webhook should now successfully save data to Vercel KV, and you'll see it appear on your dashboard!

## How It Works

### Development (Local)
- Uses the local file system (`data/docs-changelog.json`)
- Changes are written to disk immediately
- Good for testing and development

### Production (Vercel)
- Uses Vercel KV (Redis)
- Data persists across deployments
- Shared across all function invocations
- Fast read/write operations

### The Code

`src/utils/changelogStorage.ts` handles both environments:

```typescript
if (isProduction()) {
  // Use Vercel KV in production
  await kv.set(KV_KEY, limitedEntries);
} else {
  // Use file system in development
  await writeFile(CHANGELOG_FILE, JSON.stringify(limitedEntries, null, 2));
}
```

## Troubleshooting

### Local Development Issues

If you see errors about KV in local development, make sure you've pulled the environment variables:

```bash
npx vercel env pull .env.local
```

### Production Issues

Check Vercel function logs:
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Deployments**
4. Click on the latest deployment
5. Go to **Functions** tab
6. Check logs for `/api/github/webhook`

### Verify Data in KV

You can check if data is in KV by making a test API call:

```bash
curl https://sentry-content-dashboard.vercel.app/api/docs
```

You should see your changelog entries in the response.

## Cost

Vercel KV pricing (as of 2024):
- **Hobby Plan**: 256 MB storage, 3K commands/month - **FREE**
- **Pro Plan**: More storage and commands as needed

Your use case (storing ~100 changelog entries) will easily fit in the free tier.

## Alternative: Vercel Postgres

If you prefer a relational database, you can also use Vercel Postgres. The migration would be similar but require schema setup.

