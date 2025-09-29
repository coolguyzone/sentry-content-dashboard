#!/usr/bin/env node

/**
 * GitHub Polling Script
 * Polls the sentry-docs repository for new commits and triggers processing
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/github/webhook';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

const STATE_FILE = path.join(__dirname, '..', 'data', 'github-polling-state.json');

class GitHubPoller {
  constructor() {
    this.lastProcessedSha = null;
    this.isRunning = false;
  }

  async loadState() {
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      const state = JSON.parse(data);
      this.lastProcessedSha = state.lastProcessedSha;
      console.log(`Loaded state: last processed SHA = ${this.lastProcessedSha || 'none'}`);
    } catch (error) {
      console.log('No previous state found, starting fresh');
      this.lastProcessedSha = null;
    }
  }

  async saveState() {
    try {
      await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
      await fs.writeFile(STATE_FILE, JSON.stringify({
        lastProcessedSha: this.lastProcessedSha,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  async getLatestCommits() {
    try {
      const response = await axios.get(
        'https://api.github.com/repos/getsentry/sentry-docs/commits',
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: {
            sha: 'master',
            per_page: 10
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching commits:', error.response?.data || error.message);
      return [];
    }
  }

  async getCommitDetails(sha) {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/getsentry/sentry-docs/commits/${sha}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching commit ${sha}:`, error.response?.data || error.message);
      return null;
    }
  }

  async triggerWebhook(commit) {
    try {
      const webhookPayload = {
        ref: 'refs/heads/master',
        commits: [{
          id: commit.sha,
          message: commit.commit.message,
          timestamp: commit.commit.author.date,
          url: commit.html_url,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email
          },
          added: commit.files?.filter(f => f.status === 'added').map(f => f.filename) || [],
          removed: commit.files?.filter(f => f.status === 'removed').map(f => f.filename) || [],
          modified: commit.files?.filter(f => f.status === 'modified').map(f => f.filename) || []
        }],
        repository: {
          name: 'sentry-docs',
          full_name: 'getsentry/sentry-docs',
          html_url: 'https://github.com/getsentry/sentry-docs'
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'push'
      };

      if (WEBHOOK_SECRET) {
        const crypto = require('crypto');
        const signature = crypto
          .createHmac('sha256', WEBHOOK_SECRET)
          .update(JSON.stringify(webhookPayload))
          .digest('hex');
        headers['X-Hub-Signature-256'] = `sha256=${signature}`;
      }

      await axios.post(WEBHOOK_URL, webhookPayload, { headers });
      console.log(`✅ Triggered webhook for commit ${commit.sha}`);
      return true;
    } catch (error) {
      console.error(`❌ Error triggering webhook for commit ${commit.sha}:`, error.message);
      return false;
    }
  }

  async processNewCommits() {
    console.log('🔍 Checking for new commits...');
    
    const commits = await this.getLatestCommits();
    if (commits.length === 0) {
      console.log('No commits found');
      return;
    }

    const latestSha = commits[0].sha;
    console.log(`Latest commit: ${latestSha}`);

    if (this.lastProcessedSha === latestSha) {
      console.log('No new commits since last check');
      return;
    }

    // Find new commits
    let newCommits = commits;
    if (this.lastProcessedSha) {
      const lastProcessedIndex = commits.findIndex(c => c.sha === this.lastProcessedSha);
      if (lastProcessedIndex > 0) {
        newCommits = commits.slice(0, lastProcessedIndex);
      }
    }

    console.log(`Found ${newCommits.length} new commits`);

    // Process each new commit
    for (const commit of newCommits) {
      console.log(`Processing commit ${commit.sha}: ${commit.commit.message.split('\n')[0]}`);
      
      // Get detailed commit info
      const commitDetails = await this.getCommitDetails(commit.sha);
      if (!commitDetails) continue;

      // Check if it has documentation changes
      const docFiles = commitDetails.files?.filter(file => 
        file.filename.endsWith('.md') || 
        file.filename.endsWith('.mdx') ||
        file.filename.includes('/docs/') ||
        file.filename.includes('/documentation/')
      ) || [];

      if (docFiles.length > 0) {
        console.log(`  📚 Found ${docFiles.length} documentation files changed`);
        await this.triggerWebhook(commitDetails);
      } else {
        console.log(`  ⏭️  No documentation files changed, skipping`);
      }
    }

    // Update state
    this.lastProcessedSha = latestSha;
    await this.saveState();
  }

  async start() {
    if (this.isRunning) {
      console.log('Poller is already running');
      return;
    }

    if (!GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN environment variable is required');
      process.exit(1);
    }

    console.log('🚀 Starting GitHub poller...');
    console.log(`   Polling every ${POLL_INTERVAL / 1000} seconds`);
    console.log(`   Webhook URL: ${WEBHOOK_URL}`);
    console.log(`   Repository: getsentry/sentry-docs`);

    await this.loadState();
    this.isRunning = true;

    // Process immediately on start
    await this.processNewCommits();

    // Then poll every interval
    setInterval(async () => {
      try {
        await this.processNewCommits();
      } catch (error) {
        console.error('Error in polling cycle:', error);
      }
    }, POLL_INTERVAL);

    console.log('✅ Poller started successfully');
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Poller stopped');
  }
}

// Handle graceful shutdown
const poller = new GitHubPoller();

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  poller.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  poller.stop();
  process.exit(0);
});

// Start the poller
poller.start().catch(console.error);
