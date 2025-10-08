import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Load changelog
    const changelogFile = path.join(process.cwd(), 'data', 'docs-changelog.json');
    const changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sentry Documentation Changelog</title>
    <link>https://docs.sentry.io/changelog</link>
    <description>Recent updates to Sentry documentation</description>
    <atom:link href="https://sentry-content-dashboard.sentry.dev/api/docs/feed" rel="self" type="application/rss+xml"/>
    ${changelog.map((entry: any) => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.url)}</link>
      <description>${escapeXml(entry.description || entry.aiSummary)}</description>
      <pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>
      <guid>${entry.url}</guid>
      <author>${escapeXml(entry.author)}</author>
    </item>
    `).join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

