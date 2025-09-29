# GitHub Integration Workarounds

Since you don't have access to create webhooks on the `getsentry/sentry-docs` repository, here are several workaround solutions:

## 🔄 **Option 1: GitHub Actions (Recommended)**

### Setup Steps:

1. **Create a monitoring repository:**
   ```bash
   # Create a new repository on GitHub
   # Name it something like: your-username/sentry-docs-monitor
   ```

2. **Add the workflow file:**
   - Copy `.github/workflows/monitor-sentry-docs.yml` to your new repository
   - The workflow runs every 15 minutes and checks for new commits

3. **Set up repository secrets:**
   - Go to your monitoring repository → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `WEBHOOK_URL`: Your application's webhook URL (e.g., `https://your-domain.com/api/github/webhook`)
     - `WEBHOOK_SECRET`: Your webhook secret (same as in your `.env.local`)

4. **Enable the workflow:**
   - Go to Actions tab in your monitoring repository
   - Enable the workflow
   - It will start running automatically

### Pros:
- ✅ Runs in the cloud (no server needed)
- ✅ Reliable and always running
- ✅ Free for public repositories
- ✅ Easy to monitor and debug

### Cons:
- ❌ Requires a separate repository
- ❌ Runs every 15 minutes (not real-time)

---

## 🔄 **Option 2: Local Polling Script**

### Setup Steps:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export GITHUB_TOKEN=your_github_token
   export WEBHOOK_URL=http://localhost:3000/api/github/webhook
   export GITHUB_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Run the polling script:**
   ```bash
   npm run poll-github
   ```

### Pros:
- ✅ Runs locally
- ✅ Real-time checking (every 5 minutes)
- ✅ No additional repositories needed
- ✅ Easy to test and debug

### Cons:
- ❌ Requires your computer to be running
- ❌ Not suitable for production deployment

---

## 🔄 **Option 3: Cron Job**

### Setup Steps:

1. **Set up environment variables:**
   ```bash
   export GITHUB_TOKEN=your_github_token
   export WEBHOOK_URL=https://your-domain.com/api/github/webhook
   export GITHUB_WEBHOOK_SECRET=your_webhook_secret
   ```

2. **Add to crontab:**
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line to check every 10 minutes
   */10 * * * * cd /path/to/your/project && node scripts/cron-check.js
   ```

3. **Make sure the script is executable:**
   ```bash
   chmod +x scripts/cron-check.js
   ```

### Pros:
- ✅ Runs on your server
- ✅ Lightweight and efficient
- ✅ Can run every few minutes

### Cons:
- ❌ Requires server access
- ❌ More complex setup

---

## 🔄 **Option 4: Vercel Cron Jobs**

If you're deploying to Vercel, you can use Vercel Cron:

### Setup Steps:

1. **Create a cron API route:**
   ```typescript
   // app/api/cron/check-github/route.ts
   import { NextRequest } from 'next/server';
   
   export async function GET(request: NextRequest) {
     // Your cron logic here
     // Call the same logic as cron-check.js
   }
   ```

2. **Add to vercel.json:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/check-github",
         "schedule": "*/10 * * * *"
       }
     ]
   }
   ```

### Pros:
- ✅ Runs in the cloud
- ✅ Integrated with your deployment
- ✅ No additional setup needed

### Cons:
- ❌ Vercel-specific
- ❌ Limited to Vercel's cron schedule

---

## 🧪 **Testing Your Setup**

### Test the polling script:
```bash
# Test the manual trigger
curl -X POST http://localhost:3000/api/github/trigger

# Test the cron script
node scripts/cron-check.js

# Test the polling script
npm run poll-github
```

### Check the logs:
```bash
# Check if commits are being processed
tail -f data/docs-changelog.json

# Check webhook processing
# Look at your application logs
```

---

## 🚀 **Recommended Approach**

For most users, I recommend **Option 1 (GitHub Actions)** because:

1. **No server required** - runs in the cloud
2. **Reliable** - GitHub handles the infrastructure
3. **Free** - no additional costs
4. **Easy to monitor** - you can see the action runs in the GitHub UI
5. **Scalable** - can easily adjust the polling frequency

### Quick Start with GitHub Actions:

1. Create a new repository on GitHub
2. Copy the workflow file from `.github/workflows/monitor-sentry-docs.yml`
3. Add the required secrets
4. Enable the workflow
5. Wait for commits to be processed!

---

## 🔧 **Troubleshooting**

### Common Issues:

1. **"No commits found"**
   - Check your GitHub token has the right permissions
   - Verify the repository name is correct

2. **"Webhook failed"**
   - Check your webhook URL is accessible
   - Verify the webhook secret matches

3. **"No documentation files changed"**
   - This is normal - not all commits change docs
   - The script will skip non-doc commits

### Debug Commands:

```bash
# Test GitHub API access
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/getsentry/sentry-docs/commits/master

# Test webhook manually
curl -X POST http://localhost:3000/api/github/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 📊 **Monitoring**

### Check if it's working:

1. **View the changelog API:**
   ```bash
   curl http://localhost:3000/api/changelog | jq '.[] | select(.commitId)'
   ```

2. **Check the data file:**
   ```bash
   cat data/docs-changelog.json | jq '.[0]'
   ```

3. **Monitor the logs:**
   - GitHub Actions: Check the Actions tab
   - Local polling: Watch the console output
   - Cron: Check your server logs

Choose the option that works best for your setup and requirements!
