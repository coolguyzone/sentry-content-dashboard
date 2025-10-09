/**
 * Migration script to populate Vercel KV with existing changelog data
 * 
 * This script reads the local docs-changelog.json file and uploads it to Vercel KV.
 * Run this once after setting up Vercel KV to migrate existing data.
 * 
 * Usage: node scripts/migrate-to-kv.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Try to load environment variables from .env.local manually
try {
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        process.env[key] = value;
      }
    });
  }
} catch (error) {
  console.warn('Could not load .env.local, using existing environment variables');
}

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const REDIS_URL = process.env.REDIS_URL;

// Check if we have either REST API or Redis URL
if (!REDIS_URL && (!KV_REST_API_URL || !KV_REST_API_TOKEN)) {
  console.error('❌ Missing Vercel KV credentials in .env.local');
  console.error('   Please set either:');
  console.error('   - REDIS_URL (for Redis protocol), OR');
  console.error('   - KV_REST_API_URL and KV_REST_API_TOKEN (for REST API)');
  process.exit(1);
}

// Use Redis URL if available (simpler)
if (REDIS_URL) {
  console.log('✅ Using REDIS_URL for connection');
  migrateWithRedisURL(REDIS_URL);
} else {
  console.log('✅ Using REST API for connection');
  migrateWithRestAPI();
}

async function migrateWithRedisURL(redisUrl) {
  try {
    // Read local changelog file
    const changelogFile = path.join(__dirname, '..', 'data', 'docs-changelog.json');
    
    if (!fs.existsSync(changelogFile)) {
      console.error('❌ No docs-changelog.json file found');
      process.exit(1);
    }

    const changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));
    console.log(`📚 Found ${changelog.length} changelog entries`);

    // Use ioredis with Redis URL
    console.log('⬆️  Uploading to Vercel KV via Redis protocol...');
    
    const Redis = require('ioredis');
    const redis = new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
    });
    
    // Test connection
    await redis.ping();
    console.log('   Connected to Redis successfully');
    
    // Store the changelog
    await redis.set('docs-changelog', JSON.stringify(changelog));
    console.log('   Data uploaded successfully');
    
    // Verify it was saved
    const verify = await redis.get('docs-changelog');
    const savedCount = verify ? JSON.parse(verify).length : 0;
    console.log(`   Verified: ${savedCount} entries saved`);
    
    // Close connection
    await redis.quit();

    console.log('✅ Successfully migrated data to Vercel KV');
    console.log('\n🎉 Migration complete!');
    console.log('   You can now deploy to Vercel and the changelog data will persist.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('   Error details:', error.message);
    process.exit(1);
  }
}

async function migrateWithRestAPI() {
  try {
    // Read local changelog file
    const changelogFile = path.join(__dirname, '..', 'data', 'docs-changelog.json');
    
    if (!fs.existsSync(changelogFile)) {
      console.error('❌ No docs-changelog.json file found');
      process.exit(1);
    }

    const changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));
    console.log(`📚 Found ${changelog.length} changelog entries`);

    // Upload to Vercel KV using REST API
    const url = new URL('/set/docs-changelog', KV_REST_API_URL);
    const payload = JSON.stringify(JSON.stringify(changelog)); // Double stringify for KV

    console.log('⬆️  Uploading to Vercel KV via REST API...');

    const response = await new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    console.log('✅ Successfully migrated data to Vercel KV');
    console.log('   Response:', response);
    console.log('\n🎉 Migration complete!');
    console.log('   You can now deploy to Vercel and the changelog data will persist.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

