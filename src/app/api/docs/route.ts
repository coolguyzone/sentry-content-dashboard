import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DocsPage {
  url: string;
  title: string;
  description: string;
  lastModified: string;
  source: 'docs';
}

interface DocsChangelogEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'docs';
  categories: string[];
  commitId?: string;
  author?: string;
  filesChanged?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  aiSummary?: string;
  lastModified?: string; // Added for sorting consistency
}

export async function GET() {
  try {
    console.log('Docs API request received');
    
    // Get both static docs pages and changelog entries
    const [staticDocs, changelogEntries] = await Promise.all([
      fetchStaticDocs(),
      fetchDocsChangelog()
    ]);
    
    // Combine and sort by date
    const allDocs = [...staticDocs, ...changelogEntries].sort((a, b) => {
      const dateA = new Date(a.lastModified || a.publishedAt).getTime();
      const dateB = new Date(b.lastModified || b.publishedAt).getTime();
      return dateB - dateA;
    });
    
    console.log(`Total docs items found: ${allDocs.length} (${staticDocs.length} static + ${changelogEntries.length} changelog)`);
    
    return NextResponse.json(allDocs);
  } catch (error) {
    console.error('Error fetching docs pages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch docs pages',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

async function fetchStaticDocs(): Promise<DocsPage[]> {
  try {
    // Path to the docs storage file
    const docsFile = path.join(process.cwd(), 'data', 'docs-pages.json');
    
    // Check if the docs file exists
    if (!fs.existsSync(docsFile)) {
      console.log('Docs storage file not found, returning empty array');
      return [];
    }
    
    // Read and parse the docs data
    const docsData = JSON.parse(fs.readFileSync(docsFile, 'utf8'));
    const allPages: DocsPage[] = docsData.knownPages || [];
    
    console.log('Static docs pages found:', allPages.length);
    return allPages;
  } catch (error) {
    console.error('Error fetching static docs:', error);
    return [];
  }
}

async function fetchDocsChangelog(): Promise<DocsChangelogEntry[]> {
  try {
    // Try to fetch docs changelog from GitHub integration first
    if (process.env.GITHUB_TOKEN && process.env.OPENAI_API_KEY) {
      const { getDocsChangelog } = await import('../../utils/githubProcessor');
      const changelogEntries = await getDocsChangelog();
      
      // Transform changelog entries to match docs format
      const transformedEntries: DocsChangelogEntry[] = changelogEntries.map(entry => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        url: entry.url,
        publishedAt: entry.publishedAt,
        source: 'docs' as const,
        categories: entry.categories,
        commitId: entry.commitId,
        author: entry.author,
        filesChanged: entry.filesChanged,
        aiSummary: entry.aiSummary,
        lastModified: entry.publishedAt // Use publishedAt as lastModified for sorting
      }));
      
      console.log('Docs changelog entries found:', transformedEntries.length);
      return transformedEntries;
    } else {
      // Fallback: try to load from local file for testing
      try {
        const changelogFile = path.join(process.cwd(), 'data', 'docs-changelog.json');
        if (fs.existsSync(changelogFile)) {
          const changelogData = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));
              const transformedEntries: DocsChangelogEntry[] = changelogData.map((entry: DocsChangelogEntry) => ({
            id: entry.id,
            title: entry.title,
            description: entry.description,
            url: entry.url,
            publishedAt: entry.publishedAt,
            source: 'docs' as const,
            categories: entry.categories,
            commitId: entry.commitId,
            author: entry.author,
            filesChanged: entry.filesChanged,
            aiSummary: entry.aiSummary,
            lastModified: entry.publishedAt
          }));
          
          console.log('Docs changelog entries loaded from file:', transformedEntries.length);
          return transformedEntries;
        }
      } catch (fileError) {
        console.log('Error loading docs changelog from file:', fileError);
      }
      
      console.log('GitHub integration not configured, no docs changelog available');
      return [];
    }
  } catch (error) {
    console.log('GitHub integration error (non-fatal):', error);
    return [];
  }
}
