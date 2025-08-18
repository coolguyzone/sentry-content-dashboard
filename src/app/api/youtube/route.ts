import { NextResponse } from 'next/server';
import { subDays, parseISO } from 'date-fns';
import { config } from '../../../../config';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'youtube';
  thumbnail?: string;
  duration?: string;
}

interface YouTubeAPIResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
    };
  }>;
}

export async function GET() {
  try {
    console.log('YouTube API key configured:', !!config.youtube.apiKey);
    console.log('YouTube channel ID:', config.youtube.channelId);
    
    // Check if API key is configured
    if (!config.youtube.apiKey) {
      console.error('YouTube API key not configured');
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `key=${config.youtube.apiKey}&` +
      `channelId=${config.youtube.channelId}&` +
      `part=snippet&` +
      `order=date&` +
      `maxResults=${config.youtube.maxResults}&` +
      `type=video`;
    
    console.log('Fetching from YouTube API:', apiUrl.replace(config.youtube.apiKey, '[API_KEY_HIDDEN]'));

    // Fetch videos from Sentry's YouTube channel
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error:', response.status, errorText);
      throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
    }

    const data: YouTubeAPIResponse = await response.json();
    console.log('YouTube API response items:', data.items?.length || 0);
    
    // Transform API response to our video format
    const videos: YouTubeVideo[] = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
      source: 'youtube',
      thumbnail: item.snippet.thumbnails.medium.url,
    }));

    // Filter videos from the last 90 days
    const cutoffDate = subDays(new Date(), config.content.daysToShow);
    const recentVideos = videos.filter(video => {
      const videoDate = parseISO(video.publishedAt);
      return videoDate >= cutoffDate;
    });

    console.log('Returning videos:', recentVideos.length);
    return NextResponse.json(recentVideos);
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
