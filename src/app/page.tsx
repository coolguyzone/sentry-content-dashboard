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
  source: 'blog' | 'youtube' | 'docs';
  thumbnail?: string;
  author?: string;
  duration?: string;
  lastModified?: string;
}

export default function Home() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'blog' | 'youtube' | 'docs'>('all');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all content sources
      const [blogResponse, youtubeResponse, docsResponse] = await Promise.all([
        axios.get('/api/blog'),
        axios.get('/api/youtube'),
        axios.get('/api/docs')
      ]);

      const blogPosts = blogResponse.data || [];
      const youtubeVideos = youtubeResponse.data || [];
      const docsPages = docsResponse.data || [];

      // Transform docs pages to match content item format
      const transformedDocs = docsPages.map((page: any) => ({
        id: `docs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: page.title,
        description: page.description,
        url: page.url,
        publishedAt: page.lastModified || page.lastModified,
        source: 'docs' as const,
        lastModified: page.lastModified
      }));

      // Combine and sort by publication date
      const allContent = [...blogPosts, ...youtubeVideos, ...transformedDocs].sort((a, b) => 
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
    const docsCount = content.filter(item => item.source === 'docs').length;
    const totalCount = content.length;
    
    return { blogCount, youtubeCount, docsCount, totalCount };
  };

  const getFilteredContent = () => {
    if (selectedFilter === 'all') return content;
    return content.filter(item => item.source === selectedFilter);
  };

  const stats = getContentStats();
  const filteredContent = getFilteredContent();

  if (loading) {
    return (
      <div className="min-h-screen pixel-bg flex items-center justify-center">
        <div className="text-center">
          <div className="retro-scanner w-32 h-32 mx-auto mb-8 rounded-full"></div>
          <div className="pixel-text text-4xl font-bold text-green-400 mb-4 font-['Press_Start_2P']">
            LOADING...
          </div>
          <div className="text-cyan-400 text-xl font-['VT323']">
            Fetching Sentry content from the matrix...
          </div>
          <div className="mt-8 flex space-x-2 justify-center">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pixel-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-8xl mb-6">⚠️</div>
          <h1 className="pixel-text-red text-3xl font-bold mb-6 font-['Press_Start_2P']">
            SYSTEM ERROR
          </h1>
          <p className="text-red-300 mb-8 text-xl font-['VT323']">{error}</p>
          <button 
            onClick={fetchContent}
            className="retro-button px-8 py-4 text-xl font-['Press_Start_2P']"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pixel-bg">
      {/* Header */}
      <header className="pixel-border bg-retro-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="pixel-text text-5xl font-bold text-green-400 mb-4 font-['Press_Start_2P']">
              SENTRY CONTENT TERMINAL
            </h1>
            <p className="text-cyan-400 text-xl font-['VT323'] mb-6">
              Accessing latest content from Sentry's ecosystem...
            </p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="pixel-text text-4xl font-bold text-green-400 font-['Press_Start_2P']">{stats.totalCount}</div>
                <div className="text-sm text-cyan-400 font-['VT323']">TOTAL ITEMS</div>
              </div>
              <div className="text-center">
                <div className="pixel-text-blue text-4xl font-bold text-blue-400 font-['Press_Start_2P']">{stats.blogCount}</div>
                <div className="text-sm text-cyan-400 font-['VT323']">BLOG POSTS</div>
              </div>
              <div className="text-center">
                <div className="pixel-text-red text-4xl font-bold text-red-400 font-['Press_Start_2P']">{stats.youtubeCount}</div>
                <div className="text-sm text-cyan-400 font-['VT323']">VIDEOS</div>
              </div>
              <div className="text-center">
                <div className="pixel-text text-4xl font-bold text-yellow-400 font-['Press_Start_2P']">{stats.docsCount}</div>
                <div className="text-sm text-cyan-400 font-['VT323']">DOCS</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Controls */}
      <div className="bg-retro-card/50 border-b-2 border-green-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`retro-button px-6 py-3 font-['Press_Start_2P'] text-sm ${
                selectedFilter === 'all' ? 'bg-green-400 text-retro-bg' : ''
              }`}
            >
              ALL CONTENT
            </button>
            <button
              onClick={() => setSelectedFilter('blog')}
              className={`retro-button px-6 py-3 font-['Press_Start_2P'] text-sm ${
                selectedFilter === 'blog' ? 'bg-blue-400 text-retro-bg' : ''
              }`}
            >
              BLOG POSTS
            </button>
            <button
              onClick={() => setSelectedFilter('youtube')}
              className={`retro-button px-6 py-3 font-['Press_Start_2P'] text-sm ${
                selectedFilter === 'youtube' ? 'bg-red-400 text-retro-bg' : ''
              }`}
            >
              YOUTUBE VIDEOS
            </button>
            <button
              onClick={() => setSelectedFilter('docs')}
              className={`retro-button px-6 py-3 font-['Press_Start_2P'] text-sm ${
                selectedFilter === 'docs' ? 'bg-yellow-400 text-retro-bg' : ''
              }`}
            >
              DOCUMENTATION
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredContent.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-cyan-400 text-8xl mb-6">📭</div>
            <h2 className="pixel-text text-2xl font-bold text-green-400 mb-4 font-['Press_Start_2P']">
              NO CONTENT DETECTED
            </h2>
            <p className="text-cyan-400 text-xl font-['VT323']">
              No content available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredContent.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pixel-border bg-retro-card/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-cyan-400 font-['VT323'] text-lg">
            SENTRY CONTENT TERMINAL v1.0 - Ready for deployment
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  const isYouTube = item.source === 'youtube';
  const isDocs = item.source === 'docs';
  const publishedDate = format(new Date(item.publishedAt), 'MMM d, yyyy');
  
  return (
    <div className={`bg-retro-card backdrop-blur-sm rounded-lg transition-all duration-300 hover:scale-105 ${
      isYouTube ? 'pixel-border-red' : 
      isDocs ? 'pixel-border' : 
      'pixel-border-blue'
    }`}>
      {/* Thumbnail */}
      {isYouTube && item.thumbnail && (
        <div className="relative">
          <img 
            src={item.thumbnail} 
            alt={item.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-2 py-1 rounded font-['VT323']">
              {item.duration}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-['VT323']">
              🎥 VIDEO
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Source Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded font-['VT323'] text-sm font-bold ${
            isYouTube 
              ? 'bg-red-900 text-red-200 border-2 border-red-400' 
              : isDocs
              ? 'bg-yellow-900 text-yellow-200 border-2 border-yellow-400'
              : 'bg-blue-900 text-blue-200 border-2 border-blue-400'
          }`}>
            {isYouTube ? '🎥 YOUTUBE' : isDocs ? '📚 DOCS' : '📝 BLOG'}
          </span>
          <span className="text-xs text-cyan-400 font-['VT323']">{publishedDate}</span>
        </div>
        
        {/* Title */}
        <h3 className={`text-lg font-bold mb-3 line-clamp-2 font-['VT323'] ${
          isYouTube ? 'text-red-200' : 
          isDocs ? 'text-yellow-200' : 
          'text-blue-200'
        }`}>
          {item.title}
        </h3>
        
        {/* Description */}
        {item.description && (
          <p className="text-cyan-300 text-sm mb-4 line-clamp-3 font-['VT323']">
            {item.description}
          </p>
        )}
        
        {/* Author */}
        {item.author && (
          <p className="text-xs text-cyan-400 mb-4 font-['VT323']">By {item.author}</p>
        )}
        
        {/* Link */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`retro-button inline-flex items-center px-6 py-3 rounded-lg text-sm font-bold font-['Press_Start_2P'] transition-all duration-200 ${
            isYouTube
              ? 'border-red-400 text-red-400 hover:bg-red-400 hover:text-retro-bg'
              : isDocs
              ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-retro-bg'
              : 'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-retro-bg'
          }`}
        >
          {isYouTube ? 'WATCH VIDEO' : isDocs ? 'READ DOCS' : 'READ POST'}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
