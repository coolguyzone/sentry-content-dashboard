#!/usr/bin/env node

/**
 * One-time script to seed the docs changelog with the last 10 commits
 * from getsentry/sentry-docs that contain documentation changes
 * with AI-generated summaries
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'getsentry';
const REPO_NAME = 'sentry-docs';
const BRANCH = 'master';
const MAX_COMMITS = 10;

// GitHub token is optional but recommended to avoid rate limits
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Sentry-Content-Aggregator',
        'Accept': 'application/vnd.github.v3+json',
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function httpsPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getRecentCommits() {
  console.log('📥 Fetching recent commits from getsentry/sentry-docs...');
  const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${BRANCH}&per_page=50`;
  return await httpsGet(url);
}

async function getCommitDetails(sha) {
  const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits/${sha}`;
  return await httpsGet(url);
}

function hasDocumentationFiles(commit) {
  if (!commit.files) return false;
  
  return commit.files.some(file => {
    const filename = file.filename.toLowerCase();
    return filename.endsWith('.md') || 
           filename.endsWith('.mdx') ||
           filename.startsWith('docs/') ||
           filename.includes('/docs/');
  });
}

function getDocumentationFiles(commit) {
  if (!commit.files) return [];
  
  return commit.files.filter(file => {
    const filename = file.filename.toLowerCase();
    return filename.endsWith('.md') || 
           filename.endsWith('.mdx') ||
           filename.startsWith('docs/') ||
           filename.includes('/docs/');
  });
}

function generateBasicSummary(commit, docFiles) {
  const fileList = docFiles.map(f => f.filename).join(', ');
  const addedCount = docFiles.filter(f => f.status === 'added').length;
  const modifiedCount = docFiles.filter(f => f.status === 'modified').length;
  const removedCount = docFiles.filter(f => f.status === 'removed').length;
  
  let summary = `Documentation changes in ${docFiles.length} file(s)`;
  
  if (addedCount > 0) summary += `, ${addedCount} added`;
  if (modifiedCount > 0) summary += `, ${modifiedCount} modified`;
  if (removedCount > 0) summary += `, ${removedCount} removed`;
  
  summary += `. Files: ${fileList}`;
  
  // Truncate if too long
  if (summary.length > 300) {
    summary = summary.substring(0, 297) + '...';
  }
  
  return summary;
}

async function generateAISummary(commit, docFiles) {
  if (!OPENAI_API_KEY) {
    console.log('   ℹ️  OpenAI API key not configured, using basic summary');
    return generateBasicSummary(commit, docFiles);
  }

  try {
    console.log('   🤖 Generating AI summary...');
    
    const fileChanges = docFiles.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions || 0,
      deletions: file.deletions || 0,
      changes: file.changes || 0,
    }));

    const prompt = `Analyze these documentation changes from the Sentry docs repository and provide a brief, user-friendly summary (2-3 sentences max):

Commit Message: ${commit.commit.message}
Files Changed: ${fileChanges.length}
Author: ${commit.commit.author.name}

File Details:
${fileChanges.map(f => `- ${f.filename} (${f.status}): +${f.additions} -${f.deletions} lines`).join('\n')}

Please provide a concise summary focusing on what documentation was updated and why it might be important to users.`;

    const response = await httpsPost(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a technical writer who creates clear, concise summaries of documentation changes. Focus on user impact and key improvements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    );

    const aiSummary = response.choices[0]?.message?.content;
    if (aiSummary) {
      console.log('   ✅ AI summary generated');
      return aiSummary;
    } else {
      console.log('   ⚠️  No AI response, using basic summary');
      return generateBasicSummary(commit, docFiles);
    }

  } catch (error) {
    console.log(`   ⚠️  AI summary failed: ${error.message}, using basic summary`);
    return generateBasicSummary(commit, docFiles);
  }
}

async function createChangelogEntry(commit, docFiles) {
  const aiSummary = await generateAISummary(commit, docFiles);
  
  return {
    id: `docs-${commit.sha}`,
    title: `Docs Update: ${commit.commit.message.split('\n')[0]}`,
    description: aiSummary,
    url: commit.html_url,
    publishedAt: commit.commit.author.date,
    source: 'docs',
    categories: ['technical', 'documentation'],
    commitId: commit.sha,
    author: commit.commit.author.name,
    filesChanged: {
      added: docFiles.filter(f => f.status === 'added').map(f => f.filename),
      removed: docFiles.filter(f => f.status === 'removed').map(f => f.filename),
      modified: docFiles.filter(f => f.status === 'modified').map(f => f.filename),
    },
    aiSummary: aiSummary,
  };
}

async function main() {
  try {
    console.log('🚀 Starting docs changelog seed script...\n');

    if (OPENAI_API_KEY) {
      console.log('✅ OpenAI API key detected - AI summaries enabled');
    } else {
      console.log('ℹ️  OpenAI API key not found - using basic summaries');
      console.log('   Set OPENAI_API_KEY environment variable to enable AI summaries\n');
    }

    // Fetch recent commits
    const commits = await getRecentCommits();
    console.log(`✅ Found ${commits.length} recent commits\n`);

    // Filter commits with documentation changes
    const docsCommits = [];
    
    for (const commit of commits) {
      if (docsCommits.length >= MAX_COMMITS) break;
      
      console.log(`🔍 Checking commit ${commit.sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]}`);
      
      // Get full commit details with file list
      const fullCommit = await getCommitDetails(commit.sha);
      
      if (hasDocumentationFiles(fullCommit)) {
        const docFiles = getDocumentationFiles(fullCommit);
        console.log(`   ✅ Found ${docFiles.length} documentation file(s)`);
        docsCommits.push(fullCommit);
      } else {
        console.log(`   ⏭️  No documentation files`);
      }
      
      // Rate limit: wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Found ${docsCommits.length} commits with documentation changes\n`);

    // Create changelog entries with AI summaries
    const entries = [];
    for (const commit of docsCommits) {
      const docFiles = getDocumentationFiles(commit);
      const entry = await createChangelogEntry(commit, docFiles);
      entries.push(entry);
      
      // Rate limit for OpenAI API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save to file
    const dataDir = path.join(process.cwd(), 'data');
    const changelogFile = path.join(dataDir, 'docs-changelog.json');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(changelogFile, JSON.stringify(entries, null, 2), 'utf8');

    console.log('\n✅ Successfully saved changelog entries to data/docs-changelog.json\n');
    console.log('📋 Summary:');
    entries.forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.title}`);
      console.log(`      Author: ${entry.author}`);
      console.log(`      Date: ${new Date(entry.publishedAt).toLocaleDateString()}`);
      console.log(`      Files: ${entry.filesChanged.added.length + entry.filesChanged.modified.length + entry.filesChanged.removed.length}`);
      console.log(`      Summary: ${entry.aiSummary.substring(0, 100)}...`);
      console.log('');
    });

    console.log('🎉 Done! You can now see these entries in the Documentation tab of your app.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
