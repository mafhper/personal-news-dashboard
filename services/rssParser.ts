import type { Article } from '../types';
import { articleCache } from './articleCache';
import { perfDebugger } from './performanceUtils';

const RSS2JSON_API_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Cache TTL in milliseconds (15 minutes)
const CACHE_TTL = 15 * 60 * 1000;

function cleanDescription(description: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(description, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Generate a cache key for a feed URL
 */
function getFeedCacheKey(url: string): string {
  return `feed:${url}`;
}

/**
 * Parse an RSS feed URL, with caching
 */
export async function parseRssUrl(url: string): Promise<{ title: string; articles: Article[] }> {
    // Check if we have a cached version of this feed
    const cachedArticles = getCachedArticlesForFeed(url);
    if (cachedArticles.length > 0) {
        perfDebugger.log(`Using ${cachedArticles.length} cached articles for feed: ${url}`);
        return {
            title: cachedArticles[0].sourceTitle,
            articles: cachedArticles
        };
    }

    // No cache hit, fetch from API
    perfDebugger.log(`Fetching feed from API: ${url}`);
    const apiUrl = `${RSS2JSON_API_URL}${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch from rss2json API: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== 'ok') {
        // The API itself indicates a failure to parse the feed
        throw new Error(`The rss2json API could not process the feed from ${url}. Message: ${data.message}`);
    }

    const channelTitle = data.feed.title ?? 'Untitled Feed';

    const articles: Article[] = data.items.map((item: any) => {
        const pubDateStr = item.pubDate;
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

        return {
            title: item.title ?? 'No Title',
            link: item.link ?? '#',
            pubDate,
            description: item.description ? cleanDescription(item.description).substring(0, 200) : '',
            imageUrl: item.thumbnail || undefined,
            author: item.author || undefined,
            categories: item.categories || [],
            sourceTitle: channelTitle,
        };
    }).filter((article: Article) => article.title !== 'No Title' && article.link !== '#');

    // Cache the articles
    if (articles.length > 0) {
        cacheArticlesForFeed(url, articles);
    }

    return { title: channelTitle, articles };
}

/**
 * Get cached articles for a specific feed URL
 */
function getCachedArticlesForFeed(feedUrl: string): Article[] {
    // We'll use localStorage to store the mapping of feed URLs to article links
    const cacheKey = getFeedCacheKey(feedUrl);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
        return [];
    }

    try {
        const { timestamp, articleKeys } = JSON.parse(cachedData);

        // Check if cache is still valid
        if (Date.now() - timestamp > CACHE_TTL) {
            // Cache expired
            localStorage.removeItem(cacheKey);
            return [];
        }

        // Retrieve articles from the LRU cache
        const articles: Article[] = [];

        for (const key of articleKeys) {
            const [link, sourceTitle] = key.split('|');
            const article = articleCache.get(link, sourceTitle);

            if (article) {
                articles.push(article);
            }
        }

        // If we found at least half of the articles in cache, return them
        // Otherwise, consider the cache invalid and fetch fresh data
        if (articles.length >= articleKeys.length / 2) {
            return articles;
        } else {
            localStorage.removeItem(cacheKey);
            return [];
        }
    } catch (error) {
        console.error('Error retrieving cached articles:', error);
        localStorage.removeItem(cacheKey);
        return [];
    }
}

/**
 * Cache articles for a specific feed URL
 */
function cacheArticlesForFeed(feedUrl: string, articles: Article[]): void {
    // Add articles to the LRU cache
    articleCache.setMany(articles);

    // Store the mapping of feed URL to article keys in localStorage
    const cacheKey = getFeedCacheKey(feedUrl);
    const articleKeys = articles.map(article => `${article.link}|${article.sourceTitle}`);

    const cacheData = {
        timestamp: Date.now(),
        articleKeys
    };

    try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        perfDebugger.log(`Cached ${articles.length} articles for feed: ${feedUrl}`);
    } catch (error) {
        console.error('Error caching articles:', error);
    }
}


export function parseOpml(fileContent: string): string[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, "application/xml");
    const outlines = Array.from(xmlDoc.querySelectorAll('outline[type="rss"][xmlUrl]'));
    return outlines.map(outline => outline.getAttribute('xmlUrl')).filter((url): url is string => !!url);
}
