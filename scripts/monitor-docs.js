#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const DOCS_BASE_URL = process.env.SENTRY_DOCS_BASE_URL || 'https://docs.sentry.io';
const SITEMAP_URL = `${DOCS_BASE_URL}/sitemap.xml`;
const STORAGE_FILE = path.join(__dirname, '../data/docs-pages.json');
const MAX_PAGES_TO_CHECK = 100; // Reasonable limit for regular monitoring

// Ensure data directory exists
const dataDir = path.dirname(STORAGE_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize storage file if it doesn't exist
if (!fs.existsSync(STORAGE_FILE)) {
  const initialData = {
    lastChecked: new Date().toISOString(),
    knownPages: [],
    newPages: []
  };
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2));
  console.log('Created new docs storage file');
}

async function fetchSitemap() {
  try {
    console.log('Fetching sitemap from:', SITEMAP_URL);
    const response = await axios.get(SITEMAP_URL, { timeout: 30000 });
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    const urls = [];
    $('url').each((i, element) => {
      const loc = $(element).find('loc').text();
      const lastmod = $(element).find('lastmod').text();
      
      if (loc && loc.includes('docs.sentry.io')) {
        urls.push({
          url: loc,
          lastModified: lastmod || new Date().toISOString()
        });
      }
    });
    
    console.log(`Found ${urls.length} URLs in sitemap`);
    return urls;
  } catch (error) {
    console.error('Error fetching sitemap:', error.message);
    return [];
  }
}

async function fetchPageDetails(page) {
  try {
    const response = await axios.get(page.url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || 'Untitled';
    const description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      'No description available';
    
    return {
      url: page.url,
      title: title,
      description: description,
      lastModified: page.lastModified,
      source: 'docs'
    };
  } catch (error) {
    console.warn(`Failed to fetch details for ${page.url}:`, error.message);
    return null;
  }
}

async function checkForNewPages() {
  try {
    console.log('Starting docs monitoring...');
    
    // Load existing data
    const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    const knownUrls = new Set(storage.knownPages.map(page => page.url));
    
    // If this is the first run or we're starting fresh, don't populate with existing content
    if (storage.knownPages.length === 0) {
      console.log('First run detected - starting with empty docs storage');
      console.log('Going forward, only genuinely new pages will be added');
      
      // Update last checked time without adding any pages
      storage.lastChecked = new Date().toISOString();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
      
      console.log('Initialized empty docs storage. Run this script again later to check for new pages.');
      return;
    }
    
    // Fetch current sitemap
    const sitemapUrls = await fetchSitemap();
    
    if (sitemapUrls.length === 0) {
      console.log('No URLs found in sitemap, skipping check');
      return;
    }
    
    // Check for new pages (limit to avoid overwhelming the system)
    const newUrls = sitemapUrls
      .filter(page => !knownUrls.has(page.url))
      .slice(0, MAX_PAGES_TO_CHECK);
    
    if (newUrls.length === 0) {
      console.log('No new pages found');
      // Update last checked time
      storage.lastChecked = new Date().toISOString();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
      return;
    }
    
    console.log(`Found ${newUrls.length} new pages to process`);
    
    // Fetch details for new pages
    const newPages = [];
    for (const url of newUrls) {
      const pageDetails = await fetchPageDetails(url);
      if (pageDetails) {
        newPages.push(pageDetails);
        console.log(`✅ Added: ${pageDetails.title}`);
      }
      
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update storage
    storage.knownPages = [...storage.knownPages, ...newPages];
    storage.newPages = newPages;
    storage.lastChecked = new Date().toISOString();
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
    
    console.log(`\n🎉 Successfully added ${newPages.length} new pages`);
    console.log(`Total known pages: ${storage.knownPages.length}`);
    
  } catch (error) {
    console.error('Error during docs monitoring:', error);
  }
}

// Main execution
if (require.main === module) {
  checkForNewPages()
    .then(() => {
      console.log('Docs monitoring completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Docs monitoring failed:', error);
      process.exit(1);
    });
}

module.exports = { checkForNewPages };
