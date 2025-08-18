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

export async function GET() {
  try {
    console.log('Docs API request received');
    
    // Path to the docs storage file
    const docsFile = path.join(process.cwd(), 'data', 'docs-pages.json');
    
    // Check if the docs file exists
    if (!fs.existsSync(docsFile)) {
      console.log('Docs storage file not found, returning empty array');
      return NextResponse.json([]);
    }
    
    // Read and parse the docs data
    const docsData = JSON.parse(fs.readFileSync(docsFile, 'utf8'));
    const allPages: DocsPage[] = docsData.knownPages || [];
    
    console.log('Total docs pages found:', allPages.length);
    
    // Return all pages without date filtering
    console.log('Returning all docs pages:', allPages.length);
    
    // Sort by last modified date (newest first) if dates are available
    const sortedPages = allPages.sort((a, b) => {
      try {
        const dateA = new Date(a.lastModified).getTime();
        const dateB = new Date(b.lastModified).getTime();
        return dateB - dateA;
      } catch (error) {
        return 0; // Keep original order if dates are invalid
      }
    });
    
    return NextResponse.json(sortedPages);
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
