# GitHub Actions Setup Guide

This guide will walk you through setting up GitHub Actions to monitor the `getsentry/sentry-docs` repository.

## 🚀 **Step-by-Step Setup**

### Step 1: Create a Monitoring Repository

1. **Go to GitHub** and create a new repository
2. **Repository name**: `sentry-docs-monitor` (or any name you prefer)
3. **Make it public** (required for free GitHub Actions)
4. **Don't initialize** with README, .gitignore, or license
5. **Click "Create repository"**

### Step 2: Clone and Set Up the Repository

```bash
# Clone your new repository
git clone https://github.com/YOUR_USERNAME/sentry-docs-monitor.git
cd sentry-docs-monitor

# Copy the monitoring files from this project
cp -r /path/to/sentry-content-aggregator/monitoring-repo/* .

# Commit and push the files
git add .
git commit -m "Add monitoring workflow"
git push origin main
```

### Step 3: Configure Repository Secrets

1. **Go to your monitoring repository** on GitHub
2. **Click "Settings"** → **"Secrets and variables"** → **"Actions"**
3. **Click "New repository secret"** and add:

   **Secret 1:**
   - **Name**: `WEBHOOK_URL`
   - **Value**: `https://your-domain.com/api/github/webhook`
   - (Replace with your actual domain)

   **Secret 2:**
   - **Name**: `WEBHOOK_SECRET`
   - **Value**: `your-webhook-secret-here`
   - (Same value as in your `.env.local` file)

### Step 4: Enable GitHub Actions

1. **Go to the "Actions" tab** in your monitoring repository
2. **Click "I understand my workflows, go ahead and enable them"**
3. **The workflow will start running automatically**

### Step 5: Test the Setup

1. **Go to Actions** → **"Monitor Sentry Docs Changes"**
2. **Click "Run workflow"** to test manually
3. **Check the logs** to see if it's working
4. **Wait for a real commit** to the sentry-docs repository

## 🔍 **How It Works**

### Workflow Schedule
- **Runs every 15 minutes** via cron: `*/15 * * * *`
- **Can be triggered manually** via "Run workflow"

### What It Does
1. **Checks for new commits** in `getsentry/sentry-docs` master branch
2. **Compares with last processed SHA** (stored in the repository)
3. **Filters for documentation changes** (`.md`, `.mdx`, files in `/docs/`)
4. **Triggers webhook** to your application
5. **Updates the last processed SHA** for next run

### Monitoring
- **Check the Actions tab** to see when it runs
- **View logs** to see what commits are being processed
- **Look for "✅ Webhook triggered successfully"** messages

## 🧪 **Testing**

### Manual Test
1. **Go to Actions** → **"Monitor Sentry Docs Changes"**
2. **Click "Run workflow"**
3. **Check the logs** for any errors

### Real Test
1. **Make a test commit** to the sentry-docs repository
2. **Wait up to 15 minutes** for the workflow to run
3. **Check your application logs** for webhook processing
4. **Verify the changelog entry** appears in your API

## 🔧 **Troubleshooting**

### Common Issues

**1. "No new commits"**
- This is normal if there haven't been any new commits
- The workflow will skip and wait for the next run

**2. "Webhook failed"**
- Check your webhook URL is accessible
- Verify the webhook secret matches
- Check your application is running

**3. "No documentation files changed"**
- This is normal - not all commits change docs
- The workflow will skip non-doc commits

**4. "Workflow not running"**
- Check if GitHub Actions are enabled
- Verify the workflow file is in `.github/workflows/`
- Check the cron schedule is correct

### Debug Commands

```bash
# Test your webhook manually
curl -X POST https://your-domain.com/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"test": "data"}'

# Check your changelog API
curl https://your-domain.com/api/changelog | jq '.[] | select(.commitId)'
```

## 📊 **Monitoring Dashboard**

### GitHub Actions
- **Actions tab**: See when workflows run
- **Workflow runs**: View logs and status
- **Manual trigger**: Test the workflow

### Your Application
- **Changelog API**: Check for new entries
- **Application logs**: See webhook processing
- **Data file**: `data/docs-changelog.json`

## 🚀 **Deployment**

### For Production
1. **Use your production domain** in the webhook URL
2. **Set up proper monitoring** for the workflow
3. **Consider adjusting the cron schedule** if needed

### For Development
1. **Use localhost** with ngrok or similar
2. **Test with manual triggers** first
3. **Check logs frequently** during setup

## 🔄 **Maintenance**

### Regular Checks
- **Monitor the Actions tab** for failed runs
- **Check webhook processing** in your application
- **Verify changelog entries** are being created

### Updates
- **Update the workflow** if needed
- **Adjust the cron schedule** if necessary
- **Add more filtering** for specific file types

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ GitHub Actions run every 15 minutes
- ✅ Logs show "✅ Webhook triggered successfully"
- ✅ Your changelog API returns docs entries
- ✅ New commits appear in your application

## 🆘 **Getting Help**

If you run into issues:
1. **Check the GitHub Actions logs** for error messages
2. **Verify your webhook URL** is accessible
3. **Test the webhook manually** with curl
4. **Check your application logs** for processing errors

The setup should be working within 15 minutes of enabling the workflow!
