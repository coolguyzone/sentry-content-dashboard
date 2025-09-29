# Sentry Docs Monitor

This repository monitors the `getsentry/sentry-docs` repository for changes and triggers webhooks to update the Sentry Content Aggregator.

## How it works

- Runs every 15 minutes via GitHub Actions
- Checks for new commits in the `getsentry/sentry-docs` repository
- Filters for commits that change documentation files
- Triggers webhook to the main application

## Setup

1. Fork or clone this repository
2. Add the following secrets in Settings → Secrets and variables → Actions:
   - `WEBHOOK_URL`: Your application's webhook URL
   - `WEBHOOK_SECRET`: Your webhook secret
3. Enable GitHub Actions in the Actions tab

## Monitoring

- Check the Actions tab to see when the workflow runs
- View logs to see what commits are being processed
- The workflow will automatically start running once enabled

## Configuration

The workflow runs every 15 minutes and checks for:
- New commits in the `master` branch
- Changes to documentation files (`.md`, `.mdx`, files in `/docs/` directories)
- Triggers webhook only for relevant changes
