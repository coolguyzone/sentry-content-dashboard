'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import axios from 'axios';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'blog' | 'youtube';
  thumbnail?: string;
  author?: string;
  duration?: string;
}

export default function Home() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both blog posts and YouTube videos
      const [blogResponse, youtubeResponse] = await Promise.all([
        axios.get('/api/blog'),
        axios.get('/api/youtube')
      ]);

      const blogPosts = blogResponse.data || [];
      const youtubeVideos = youtubeResponse.data || [];

      // Combine and sort by publication date
      const allContent = [...blogPosts, ...youtubeVideos].sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      setContent(allContent);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to fetch content. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getContentStats = () => {
    const blogCount = content.filter(item => item.source === 'blog').length;
    const youtubeCount = content.filter(item => item.source === 'youtube').length;
    const totalCount = content.length;
    
    return { blogCount, youtubeCount, totalCount };
  };

  const stats = getContentStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading Sentry content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Content</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <button 
            onClick={fetchContent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Sentry Content Aggregator</h1>
              <p className="text-slate-300 mt-1">Latest content from the last 90 days</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">{stats.totalCount}</div>
              <div className="text-sm text-slate-400">Total Items</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-slate-800/30 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-300">{stats.blogCount} Blog Posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-300">{stats.youtubeCount} YouTube Videos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Content Found</h2>
            <p className="text-slate-400">No content was published in the last 90 days.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  const isYouTube = item.source === 'youtube';
  const publishedDate = format(new Date(item.publishedAt), 'MMM d, yyyy');
  
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/20">
      {/* Thumbnail */}
      {isYouTube && item.thumbnail && (
        <div className="relative">
          <img 
            src={item.thumbnail} 
            alt={item.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {item.duration}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Source Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isYouTube 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {isYouTube ? '🎥 YouTube' : '📝 Blog'}
          </span>
          <span className="text-xs text-slate-400">{publishedDate}</span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {item.title}
        </h3>
        
        {/* Description */}
        {item.description && (
          <p className="text-slate-300 text-sm mb-4 line-clamp-3">
            {item.description}
          </p>
        )}
        
        {/* Author */}
        {item.author && (
          <p className="text-xs text-slate-400 mb-4">By {item.author}</p>
        )}
        
        {/* Link */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isYouTube
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isYouTube ? 'Watch Video' : 'Read Post'}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
