# 🚀 Quick Start: GitHub Actions Setup

## **TL;DR - 5 Minute Setup**

### 1. Create Repository
- Go to GitHub → New repository
- Name: `sentry-docs-monitor`
- Make it **public** (for free Actions)
- Don't initialize with anything

### 2. Copy Files
```bash
# Clone your new repo
git clone https://github.com/YOUR_USERNAME/sentry-docs-monitor.git
cd sentry-docs-monitor

# Copy monitoring files
cp -r /path/to/sentry-content-aggregator/monitoring-repo/* .
git add .
git commit -m "Add monitoring workflow"
git push origin main
```

### 3. Add Secrets
Go to **Settings** → **Secrets and variables** → **Actions**:

- **`WEBHOOK_URL`**: `https://your-domain.com/api/github/webhook`
- **`WEBHOOK_SECRET`**: `your-webhook-secret-here`

### 4. Enable Actions
- Go to **Actions** tab
- Click **"I understand my workflows, go ahead and enable them"**
- Wait for the first run (up to 15 minutes)

### 5. Test
- Go to **Actions** → **"Monitor Sentry Docs Changes"**
- Click **"Run workflow"** to test manually
- Check logs for "✅ Webhook triggered successfully"

## **What Happens Next**

- ✅ **Every 15 minutes**: Checks for new commits
- ✅ **Filters docs**: Only processes documentation changes
- ✅ **Triggers webhook**: Sends data to your application
- ✅ **Updates changelog**: Creates AI-powered summaries

## **Files You Need**

From `monitoring-repo/`:
- `.github/workflows/monitor-sentry-docs.yml`
- `README.md`

## **Troubleshooting**

**Not working?**
1. Check Actions tab for errors
2. Verify webhook URL is accessible
3. Test webhook manually with curl
4. Check your application logs

**Need help?**
- Check `GITHUB_ACTIONS_SETUP.md` for detailed guide
- Run `npm run setup-github-actions` for interactive setup

## **Success Indicators**

You'll know it's working when:
- ✅ Actions run every 15 minutes
- ✅ Logs show webhook success
- ✅ Changelog API returns docs entries
- ✅ New commits appear in your app

**That's it! Your monitoring is now automated.** 🎉
