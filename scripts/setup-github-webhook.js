#!/usr/bin/env node

/**
 * Setup script for GitHub webhook integration
 * This script helps you configure the necessary GitHub webhook and API keys
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🚀 Sentry Docs Changelog Setup\n');
  
  console.log('This script will help you set up the GitHub webhook integration for tracking Sentry docs changes.\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. GitHub Personal Access Token with repo access');
  console.log('2. OpenAI API Key for generating summaries');
  console.log('3. A webhook secret (you can generate a random string)\n');
  
  const githubToken = await question('Enter your GitHub Personal Access Token: ');
  const openaiKey = await question('Enter your OpenAI API Key: ');
  const webhookSecret = await question('Enter a webhook secret (or press Enter to generate one): ');
  
  const finalWebhookSecret = webhookSecret || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  console.log('\n📝 Environment Variables to add to your .env.local file:');
  console.log('```');
  console.log(`GITHUB_TOKEN=${githubToken}`);
  console.log(`OPENAI_API_KEY=${openaiKey}`);
  console.log(`GITHUB_WEBHOOK_SECRET=${finalWebhookSecret}`);
  console.log('```');
  
  console.log('\n🔗 GitHub Webhook Setup:');
  console.log('1. Go to: https://github.com/getsentry/sentry-docs/settings/hooks');
  console.log('2. Click "Add webhook"');
  console.log('3. Set Payload URL to: https://your-domain.com/api/github/webhook');
  console.log('4. Set Content type to: application/json');
  console.log('5. Set Secret to:', finalWebhookSecret);
  console.log('6. Select "Just the push event"');
  console.log('7. Click "Add webhook"');
  
  console.log('\n🧪 Testing:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Test the manual trigger: POST to /api/github/trigger');
  console.log('4. Check the changelog: GET /api/changelog');
  
  console.log('\n✅ Setup complete! Your changelog will now automatically track Sentry docs changes.');
  
  rl.close();
}

setup().catch(console.error);
