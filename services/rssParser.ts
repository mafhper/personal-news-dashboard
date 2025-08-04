/**
 * Enhanced RSS Parser with direct XML parsing
 * Replaces RSS2JSON API to avoid rate limits
 */

import type { Article } from '../types';
import { getLogger } from './logger';
import { perfDebugger } from './performanceUtils';
import { getCachedArticles, setCachedArticles } from './smartCache';

// Using direct RSS parsing instead of RSS2JSON API to avoid rate limits
// Multiple CORS proxies for fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
];

// Enhanced timeout and retry configuration
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE_MS = 1000;

const logger = getLogger();

/**
 * Clean HTML description text
 */
function cleanDescription(description: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(description, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Enhanced fetch with timeout and AbortController support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: fetchOptions.signal ?
        AbortSignal.any([fetchOptions.signal, controller.signal]) :
        controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Parse RSS XML content directly
 */
function parseRssXml(xmlContent: string, feedUrl: string): { title: string; articles: Article[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    throw new Error(`XML parsing error: ${parseErrors[0].textContent}`);
  }

  let channelTitle = 'Untitled Feed';
  let items: HTMLCollectionOf<Element> | NodeListOf<Element>;

  // Try RSS 2.0 format first
  const channels = xmlDoc.getElementsByTagName('channel');
  if (channels.length > 0) {
    const titleElements = channels[0].getElementsByTagName('title');
    channelTitle = titleElements[0]?.textContent?.trim() || 'Untitled Feed';
    items = xmlDoc.getElementsByTagName('item');
  } else {
    // Try Atom format
    const feeds = xmlDoc.getElementsByTagName('feed');
    if (feeds.length > 0) {
      const titleElements = feeds[0].getElementsByTagName('title');
      channelTitle = titleElements[0]?.textContent?.trim() || 'Untitled Feed';
      items = xmlDoc.getElementsByTagName('entry');
    } else {
      // Try RDF format
      const rdfItems = xmlDoc.getElementsByTagName('item');
      if (rdfItems.length > 0) {
        // For RDF, try to get title from channel or default
        const rdfChannels = xmlDoc.getElementsByTagName('channel');
        if (rdfChannels.length > 0) {
          const titleElements = rdfChannels[0].getElementsByTagName('title');
          channelTitle = titleElements[0]?.textContent?.trim() || 'Untitled Feed';
        }
        items = rdfItems;
      } else {
        throw new Error('Unsupported RSS format');
      }
    }
  }

  const articles: Article[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      // Extract title
      const titleElements = item.getElementsByTagName('title');
      const title = titleElements[0]?.textContent?.trim() || 'No Title';

      // Extract link
      let link = '';
      const linkElements = item.getElementsByTagName('link');
      if (linkElements.length > 0) {
        link = linkElements[0].textContent?.trim() || linkElements[0].getAttribute('href') || '';
      }

      // Extract publication date
      let pubDate = new Date();
      const pubDateElements = item.getElementsByTagName('pubDate');
      const publishedElements = item.getElementsByTagName('published');
      const dcDateElements = item.getElementsByTagName('date');

      let dateElement = pubDateElements[0] || publishedElements[0] || dcDateElements[0];
      if (dateElement?.textContent) {
        const parsedDate = new Date(dateElement.textContent.trim());
        if (!isNaN(parsedDate.getTime())) {
          pubDate = parsedDate;
        }
      }

      // Extract description
      let description = '';
      const descElements = item.getElementsByTagName('description');
      const summaryElements = item.getElementsByTagName('summary');
      const contentElements = item.getElementsByTagName('content');

      let descElement = descElements[0] || summaryElements[0] || contentElements[0];
      if (descElement?.textContent) {
        description = cleanDescription(descElement.textContent).substring(0, 200);
      }

      // Extract author
      let author = '';
      const authorElements = item.getElementsByTagName('author');
      const creatorElements = item.getElementsByTagName('creator');

      let authorElement = authorElements[0] || creatorElements[0];
      if (authorElement?.textContent) {
        author = authorElement.textContent.trim();
      }

      // Extract categories
      const categories: string[] = [];
      const categoryElements = item.getElementsByTagName('category');
      for (let j = 0; j < categoryElements.length; j++) {
        const catText = categoryElements[j].textContent?.trim();
        if (catText) categories.push(catText);
      }

      // Extract image URL with multiple methods
      let imageUrl = '';

      // Method 1: Check enclosure elements for images
      const enclosureElements = item.getElementsByTagName('enclosure');
      for (let j = 0; j < enclosureElements.length; j++) {
        const enclosure = enclosureElements[j];
        const type = enclosure.getAttribute('type');
        if (type && type.startsWith('image/')) {
          imageUrl = enclosure.getAttribute('url') || '';
          break;
        }
      }

      // Method 2: Check media:content elements (Media RSS)
      if (!imageUrl) {
        const mediaContentElements = item.getElementsByTagName('media:content');
        for (let j = 0; j < mediaContentElements.length; j++) {
          const mediaContent = mediaContentElements[j];
          const type = mediaContent.getAttribute('type');
          if (type && type.startsWith('image/')) {
            imageUrl = mediaContent.getAttribute('url') || '';
            break;
          }
        }
      }

      // Method 3: Check media:thumbnail elements
      if (!imageUrl) {
        const mediaThumbnailElements = item.getElementsByTagName('media:thumbnail');
        if (mediaThumbnailElements.length > 0) {
          imageUrl = mediaThumbnailElements[0].getAttribute('url') || '';
        }
      }

      // Method 4: Extract from description/content HTML
      if (!imageUrl && descElement) {
        // Try to get the full HTML content first
        const htmlContent = descElement.innerHTML || descElement.textContent || '';

        // Multiple regex patterns to catch different image formats
        const imgPatterns = [
          /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
          /<img[^>]+src=([^\s>]+)[^>]*>/i,
          /src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp|svg))[^"']*/i,
          /https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|svg)/i
        ];

        for (const pattern of imgPatterns) {
          const match = htmlContent.match(pattern);
          if (match && match[1]) {
            imageUrl = match[1];
            break;
          }
        }
      }

      // Method 5: Check for iTunes image (for podcast feeds)
      if (!imageUrl) {
        const itunesImageElements = item.getElementsByTagName('itunes:image');
        if (itunesImageElements.length > 0) {
          imageUrl = itunesImageElements[0].getAttribute('href') || '';
        }
      }

      // Only add valid articles
      if (title !== 'No Title' && link) {
        articles.push({
          title,
          link,
          pubDate,
          description,
          imageUrl: imageUrl || undefined,
          author: author || undefined,
          categories,
          sourceTitle: channelTitle,
        });
      }
    } catch (error) {
      logger.warn(`Failed to parse article ${i + 1} from ${feedUrl}`, {
        component: 'rssParser',
        additionalData: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  return { title: channelTitle, articles };
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Try to fetch RSS feed using multiple CORS proxies as fallback
 */
async function fetchRssWithCorsProxies(
  url: string,
  options: {
    timeout?: number;
    signal?: AbortSignal;
  } = {}
): Promise<string> {
  const { timeout = DEFAULT_TIMEOUT_MS, signal } = options;

  // In Node.js environment, fetch directly
  if (typeof window === 'undefined') {
    const response = await fetchWithTimeout(url, { timeout, signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText} (${response.status})`);
    }
    return await response.text();
  }

  // In browser environment, try CORS proxies
  let lastError: Error = new Error('Unknown error');

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i];
    let fetchUrl: string;

    try {
      // Different proxy formats
      if (proxyUrl.includes('allorigins.win')) {
        fetchUrl = `${proxyUrl}${encodeURIComponent(url)}`;
      } else {
        fetchUrl = `${proxyUrl}${encodeURIComponent(url)}`;
      }

      logger.debug(`Trying CORS proxy ${i + 1}/${CORS_PROXIES.length}: ${proxyUrl}`, {
        component: 'rssParser',
        additionalData: { feedUrl: url, proxyUrl }
      });

      const response = await fetchWithTimeout(fetchUrl, { timeout, signal });

      if (!response.ok) {
        throw new Error(`Proxy ${i + 1} failed: ${response.statusText} (${response.status})`);
      }

      let xmlContent = await response.text();

      // Handle allorigins.win response format
      if (proxyUrl.includes('allorigins.win')) {
        try {
          const jsonResponse = JSON.parse(xmlContent);
          if (jsonResponse.contents) {
            xmlContent = jsonResponse.contents;
          } else {
            throw new Error('No contents in allorigins response');
          }
        } catch (e) {
          throw new Error(`Failed to parse allorigins response: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      if (!xmlContent.trim()) {
        throw new Error('Empty RSS feed received from proxy');
      }

      logger.info(`Successfully fetched RSS via proxy ${i + 1}`, {
        component: 'rssParser',
        additionalData: {
          feedUrl: url,
          proxyUrl,
          contentLength: xmlContent.length
        }
      });

      return xmlContent;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn(`CORS proxy ${i + 1} failed`, {
        component: 'rssParser',
        additionalData: {
          feedUrl: url,
          proxyUrl,
          error: lastError.message
        }
      });

      // If this is the last proxy, don't continue
      if (i === CORS_PROXIES.length - 1) {
        break;
      }

      // Small delay between proxy attempts
      await sleep(500);
    }
  }

  throw new Error(`All CORS proxies failed. Last error: ${lastError.message}`);
}

/**
 * Enhanced RSS parsing with timeout and retry logic using direct XML parsing
 */
async function parseRssUrlWithRetry(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    maxRetries = MAX_RETRY_ATTEMPTS,
    signal
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Fetching feed (attempt ${attempt}/${maxRetries})`, {
        component: 'rssParser',
        additionalData: { feedUrl: url, timeout }
      });

      perfDebugger.log(`Fetching RSS feed directly (attempt ${attempt}): ${url}`);

      // Fetch RSS content using CORS proxies with fallback
      const xmlContent = await fetchRssWithCorsProxies(url, { timeout, signal });

      // Parse the RSS XML directly
      const result = parseRssXml(xmlContent, url);

      // Cache the articles using smart cache
      if (result.articles.length > 0) {
        setCachedArticles(url, result.articles, result.title);
      }

      logger.info(`Successfully fetched feed on attempt ${attempt}`, {
        component: 'rssParser',
        additionalData: {
          feedUrl: url,
          articlesCount: result.articles.length,
          attempt,
          channelTitle: result.title
        }
      });

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should abort due to signal
      if (signal?.aborted) {
        throw new Error('Request was cancelled');
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      const delay = getRetryDelay(attempt);

      logger.warn(`Feed fetch attempt ${attempt} failed, retrying in ${delay}ms`, {
        component: 'rssParser',
        additionalData: {
          feedUrl: url,
          attempt,
          maxRetries,
          delay,
          error: lastError.message
        }
      });

      // Wait before retrying (with exponential backoff)
      await sleep(delay);
    }
  }

  // All attempts failed
  logger.error(`All ${maxRetries} attempts failed for feed`, lastError, {
    component: 'rssParser',
    additionalData: {
      feedUrl: url,
      maxRetries
    }
  });

  throw lastError;
}

/**
 * Parse an RSS feed URL, with caching, timeout, and retry support
 */
export async function parseRssUrl(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
    skipCache?: boolean;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { skipCache = false } = options;

  // Check if we have a cached version of this feed (unless skipping cache)
  if (!skipCache) {
    const cachedArticles = getCachedArticles(url);
    if (cachedArticles && cachedArticles.length > 0) {
      logger.debug(`Using smart cached articles for feed`, {
        component: 'rssParser',
        additionalData: {
          feedUrl: url,
          cachedCount: cachedArticles.length
        }
      });
      perfDebugger.log(`Using ${cachedArticles.length} smart cached articles for feed: ${url}`);
      return {
        title: cachedArticles[0].sourceTitle,
        articles: cachedArticles
      };
    }
  }

  // No cache hit or cache skipped, fetch from RSS feed directly
  logger.info(`Fetching feed directly with enhanced retry`, {
    component: 'rssParser',
    additionalData: {
      feedUrl: url,
      timeout: options.timeout || DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries || MAX_RETRY_ATTEMPTS,
      skipCache
    }
  });

  return await parseRssUrlWithRetry(url, options);
}

export function parseOpml(fileContent: string): string[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileContent, 'text/xml');

  const outlines = xmlDoc.getElementsByTagName('outline');
  const urls: string[] = [];

  for (let i = 0; i < outlines.length; i++) {
    const outline = outlines[i];
    const xmlUrl = outline.getAttribute('xmlUrl');
    if (xmlUrl) {
      urls.push(xmlUrl);
    }
  }

  return urls;
}
