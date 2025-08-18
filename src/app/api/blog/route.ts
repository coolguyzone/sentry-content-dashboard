import { NextResponse } from 'next/server';
import { subDays, parseISO } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'blog';
  author?: string;
}

export async function GET() {
  try {
    // Sentry blog RSS feed URL
    const rssUrl = 'https://blog.sentry.io/feed.xml';
    
    // Fetch the RSS feed
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Parse the XML to extract blog posts
    const posts = parseRSSFeed(xmlText);
    
    // Filter posts from the last 90 days
    const ninetyDaysAgo = subDays(new Date(), 90);
    const recentPosts = posts.filter(post => {
      const postDate = parseISO(post.publishedAt);
      return postDate >= ninetyDaysAgo;
    });
    
    return NextResponse.json(recentPosts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

function parseRSSFeed(xmlText: string): BlogPost[] {
  const posts: BlogPost[] = [];
  
  try {
    // Simple XML parsing using regex (for production, consider using a proper XML parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      // Extract title
      const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? decodeXMLEntities(titleMatch[1].trim()) : '';
      
      // Extract description
      const descriptionMatch = itemContent.match(/<description>(.*?)<\/description>/);
      const description = descriptionMatch ? decodeXMLEntities(descriptionMatch[1].trim()) : '';
      
      // Extract link
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
      const url = linkMatch ? linkMatch[1].trim() : '';
      
      // Extract publication date
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      const publishedAt = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();
      
      // Extract author
      const authorMatch = itemContent.match(/<dc:creator>(.*?)<\/dc:creator>/);
      const author = authorMatch ? decodeXMLEntities(authorMatch[1].trim()) : undefined;
      
      if (title && url) {
        posts.push({
          id: `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: cleanCDATA(title),
          description: cleanCDATA(description),
          url,
          publishedAt,
          source: 'blog',
          author,
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
  }
  
  return posts;
}

function cleanCDATA(text: string): string {
  // Remove CDATA tags and clean up the content
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Remove CDATA tags
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .trim();
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
