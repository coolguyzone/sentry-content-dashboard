import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface ChangelogEntry {
  aiSummary: string;
  author: string;
  categories: string[];
  commitId: string;
  description: string;
  filesChanged: {
    added: string[];
    modified: string[];
    removed: string[];
  };
  id: string;
  publishedAt: string;
  source: 'changelog' | 'docs';
  title: string;
  url: string;
}

const CHANGELOG_FILE = path.join(process.cwd(), 'data', 'docs-changelog.json');
const KV_KEY = 'docs-changelog';

// Lazy load Redis client
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL not found in environment');
  }
  
  try {
    const Redis = (await import('ioredis')).default;
    redisClient = new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Save a changelog entry to persistent storage
 * Uses Vercel KV in production, local file in development
 */
export async function saveChangelogEntry(entry: ChangelogEntry): Promise<void> {
  try {
    // Get existing entries
    const existingEntries = await getChangelogEntries();
    
    // Check if entry already exists (deduplicate)
    const existingIndex = existingEntries.findIndex(e => e.id === entry.id);
    if (existingIndex !== -1) {
      console.log(`Changelog entry ${entry.id} already exists, updating...`);
      existingEntries[existingIndex] = entry;
    } else {
      // Add new entry at the beginning (most recent first)
      existingEntries.unshift(entry);
    }
    
    // Keep only the last 100 entries
    const limitedEntries = existingEntries.slice(0, 100);
    
    // Save to storage
    if (isProduction()) {
      // Use Vercel KV (Redis) in production
      const redis = await getRedisClient();
      await redis.set(KV_KEY, JSON.stringify(limitedEntries));
      console.log(`Saved changelog entry ${entry.id} to Vercel KV`);
    } else {
      // Use file system in development
      const dataDir = path.dirname(CHANGELOG_FILE);
      if (!existsSync(dataDir)) {
        await mkdir(dataDir, {recursive: true});
      }
      await writeFile(CHANGELOG_FILE, JSON.stringify(limitedEntries, null, 2));
      console.log(`Saved changelog entry ${entry.id} to local file`);
    }
  } catch (error) {
    console.error('Error saving changelog entry:', error);
    throw error;
  }
}

/**
 * Get all changelog entries from storage
 */
export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    if (isProduction()) {
      // Use Vercel KV (Redis) in production
      const redis = await getRedisClient();
      const data = await redis.get(KV_KEY);
      const entries = data ? JSON.parse(data) : [];
      console.log(`Loaded ${entries?.length || 0} changelog entries from Vercel KV`);
      return entries || [];
    } else {
      // Use file system in development
      if (!existsSync(CHANGELOG_FILE)) {
        console.log('No local changelog file found');
        return [];
      }
      const fileContent = await readFile(CHANGELOG_FILE, 'utf-8');
      const entries = JSON.parse(fileContent);
      console.log(`Loaded ${entries.length} changelog entries from local file`);
      return entries;
    }
  } catch (error) {
    console.error('Error loading changelog entries:', error);
    return [];
  }
}

/**
 * Check if we're running in production (Vercel)
 */
function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';
}

