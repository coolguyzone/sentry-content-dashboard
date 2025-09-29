#!/usr/bin/env node

/**
 * Simple cron-based GitHub checker
 * Run this script via cron to check for new commits
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/github/webhook';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

const STATE_FILE = path.join(__dirname, '..', 'data', 'last-commit-sha.txt');

async function checkForNewCommits() {
  try {
    console.log('🔍 Checking for new commits...');

    // Get latest commit
    const response = await axios.get(
      'https://api.github.com/repos/getsentry/sentry-docs/commits/master',
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const latestCommit = response.data;
    const latestSha = latestCommit.sha;

    // Read last processed SHA
    let lastSha = null;
    try {
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      lastSha = data.trim();
    } catch (error) {
      console.log('No previous state found');
    }

    console.log(`Latest SHA: ${latestSha}`);
    console.log(`Last processed SHA: ${lastSha || 'none'}`);

    if (lastSha === latestSha) {
      console.log('✅ No new commits');
      return;
    }

    console.log('🆕 New commit found!');

    // Get detailed commit info
    const commitResponse = await axios.get(
      `https://api.github.com/repos/getsentry/sentry-docs/commits/${latestSha}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const commitDetails = commitResponse.data;

    // Check if it has documentation changes
    const docFiles = commitDetails.files?.filter(file => 
      file.filename.endsWith('.md') || 
      file.filename.endsWith('.mdx') ||
      file.filename.includes('/docs/') ||
      file.filename.includes('/documentation/')
    ) || [];

    if (docFiles.length === 0) {
      console.log('⏭️  No documentation files changed, skipping');
      // Still update the SHA to avoid checking the same commit again
      await fs.writeFile(STATE_FILE, latestSha);
      return;
    }

    console.log(`📚 Found ${docFiles.length} documentation files changed`);

    // Trigger webhook
    const webhookPayload = {
      ref: 'refs/heads/master',
      commits: [{
        id: latestSha,
        message: commitDetails.commit.message,
        timestamp: commitDetails.commit.author.date,
        url: commitDetails.html_url,
        author: {
          name: commitDetails.commit.author.name,
          email: commitDetails.commit.author.email
        },
        added: commitDetails.files?.filter(f => f.status === 'added').map(f => f.filename) || [],
        removed: commitDetails.files?.filter(f => f.status === 'removed').map(f => f.filename) || [],
        modified: commitDetails.files?.filter(f => f.status === 'modified').map(f => f.filename) || []
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
    console.log('✅ Webhook triggered successfully');

    // Save the new SHA
    await fs.writeFile(STATE_FILE, latestSha);
    console.log('💾 State updated');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the check
checkForNewCommits();
