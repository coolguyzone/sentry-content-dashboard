import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'blog' | 'youtube' | 'docs' | 'changelog';
  thumbnail?: string;
  author?: string;
  duration?: string;
  lastModified?: string;
}

interface DocsPage {
  title: string;
  description: string;
  url: string;
  lastModified: string;
  source: 'docs';
}

export async function GET() {
  try {
    console.log('Markdown export API request received');

    // Get the base URL from the request headers
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    console.log('Base URL for API calls:', baseUrl);

    // Fetch all content sources using full URLs
    const [blogResponse, youtubeResponse, docsResponse, changelogResponse] = await Promise.all([
      axios.get(`${baseUrl}/api/blog`),
      axios.get(`${baseUrl}/api/youtube`),
      axios.get(`${baseUrl}/api/docs`),
      axios.get(`${baseUrl}/api/changelog`)
    ]);

    const blogPosts = blogResponse.data || [];
    const youtubeVideos = youtubeResponse.data || [];
    const docsPages = docsResponse.data || [];
    const changelogItems = changelogResponse.data || [];

    // Transform docs pages to match content item format
    const transformedDocs = docsPages.map((page: DocsPage) => ({
      id: `docs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: page.title,
      description: page.description,
      url: page.url,
      publishedAt: page.lastModified || page.lastModified,
      source: 'docs' as const,
      lastModified: page.lastModified
    }));

    // Combine and sort by publication date
    const allContent = [...blogPosts, ...youtubeVideos, ...transformedDocs, ...changelogItems].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Generate markdown content
    const markdown = generateMarkdown(allContent);

    // Return as markdown with proper content type
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sentry-content-export.md"'
      }
    });

  } catch (error) {
    console.error('Error generating markdown export:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate markdown export',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateMarkdown(content: ContentItem[]): string {
  const now = new Date().toISOString();
  
  let markdown = `# Sentry Content Aggregator - Export\n\n`;
  markdown += `Generated on: ${now}\n`;
  markdown += `Total items: ${content.length}\n\n`;
  
  // Group content by source
  const groupedContent = {
    blog: content.filter(item => item.source === 'blog'),
    youtube: content.filter(item => item.source === 'youtube'),
    docs: content.filter(item => item.source === 'docs'),
    changelog: content.filter(item => item.source === 'changelog')
  };

  // Blog Posts Section
  if (groupedContent.blog.length > 0) {
    markdown += `## 📝 Blog Posts (${groupedContent.blog.length})\n\n`;
    groupedContent.blog.forEach((post, index) => {
      markdown += `### ${index + 1}. ${post.title}\n`;
      markdown += `- **URL**: ${post.url}\n`;
      markdown += `- **Published**: ${post.publishedAt}\n`;
      if (post.author) markdown += `- **Author**: ${post.author}\n`;
      if (post.description) markdown += `- **Description**: ${post.description}\n`;
      markdown += `\n`;
    });
  }

  // YouTube Videos Section
  if (groupedContent.youtube.length > 0) {
    markdown += `## 🎥 YouTube Videos (${groupedContent.youtube.length})\n\n`;
    groupedContent.youtube.forEach((video, index) => {
      markdown += `### ${index + 1}. ${video.title}\n`;
      markdown += `- **URL**: ${video.url}\n`;
      markdown += `- **Published**: ${video.publishedAt}\n`;
      if (video.duration) markdown += `- **Duration**: ${video.duration}\n`;
      if (video.description) markdown += `- **Description**: ${video.description}\n`;
      markdown += `\n`;
    });
  }

  // Documentation Section
  if (groupedContent.docs.length > 0) {
    markdown += `## 📚 Documentation (${groupedContent.docs.length})\n\n`;
    groupedContent.docs.forEach((doc, index) => {
      markdown += `### ${index + 1}. ${doc.title}\n`;
      markdown += `- **URL**: ${doc.url}\n`;
      markdown += `- **Last Modified**: ${doc.lastModified || doc.publishedAt}\n`;
      if (doc.description) markdown += `- **Description**: ${doc.description}\n`;
      markdown += `\n`;
    });
  }

  // Changelog Section
  if (groupedContent.changelog.length > 0) {
    markdown += `## 🗒️ Changelog Updates (${groupedContent.changelog.length})\n\n`;
    groupedContent.changelog.forEach((item, index) => {
      markdown += `### ${index + 1}. ${item.title}\n`;
      markdown += `- **URL**: ${item.url}\n`;
      markdown += `- **Published**: ${item.publishedAt}\n`;
      if (item.description) markdown += `- **Description**: ${item.description}\n`;
      markdown += `\n`;
    });
  }

  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `- **Blog Posts**: ${groupedContent.blog.length}\n`;
  markdown += `- **YouTube Videos**: ${groupedContent.youtube.length}\n`;
  markdown += `- **Documentation**: ${groupedContent.docs.length}\n`;
  markdown += `- **Changelog Updates**: ${groupedContent.changelog.length}\n`;
  markdown += `- **Total Content Items**: ${content.length}\n\n`;
  
  markdown += `---\n`;
  markdown += `*This export was generated by the Sentry Content Aggregator for LLM ingestion and analysis.*\n`;

  return markdown;
}
