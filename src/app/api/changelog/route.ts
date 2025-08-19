import { NextResponse } from 'next/server';
import { parseISO } from 'date-fns';

interface ChangelogItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'changelog';
}

export async function GET() {
  try {
    console.log('Changelog API request received');

    const feedUrl = 'https://sentry.io/changelog/feed.xml';
    const response = await fetch(feedUrl);
    if (!response.ok) {
      console.error('Changelog feed fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch changelog feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const items = parseChangelogFeed(xmlText);

    // Filter items from the last 90 days for consistency with other dynamic sources
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentItems = items.filter(item => {
      const itemDate = parseISO(item.publishedAt);
      return itemDate >= ninetyDaysAgo;
    });

    return NextResponse.json(recentItems);
  } catch (error) {
    console.error('Error fetching changelog entries:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch changelog entries',
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

function parseChangelogFeed(xmlText: string): ChangelogItem[] {
  const items: ChangelogItem[] = [];

  try {
    // Support both RSS (<item>) and Atom (<entry>) formats
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

    let match;

    // RSS items
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const title = extractTag(content, 'title');
      const link = extractTag(content, 'link');
      const description = extractTag(content, 'description');
      const pubDate = extractTag(content, 'pubDate');

      if (title && link) {
        const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
        items.push({
          id: `changelog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: cleanCDATA(title),
          description: cleanCDATA(description || ''),
          url: link.trim(),
          publishedAt,
          source: 'changelog'
        });
      }
    }

    // Atom entries
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const title = extractTag(content, 'title');
      const updated = extractTag(content, 'updated');
      const summary = extractTag(content, 'summary') || extractTag(content, 'content');
      const linkHrefMatch = content.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/>/);
      const link = linkHrefMatch ? linkHrefMatch[1] : '';

      if (title && link) {
        const publishedAt = updated ? new Date(updated).toISOString() : new Date().toISOString();
        items.push({
          id: `changelog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: cleanCDATA(title),
          description: cleanCDATA(summary || ''),
          url: link.trim(),
          publishedAt,
          source: 'changelog'
        });
      }
    }
  } catch (error) {
    console.error('Error parsing changelog feed:', error);
  }

  return items;
}

function extractTag(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : undefined;
}

function cleanCDATA(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}


