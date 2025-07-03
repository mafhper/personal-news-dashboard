import type { Article } from '../types';

const RSS2JSON_API_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

function cleanDescription(description: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(description, 'text/html');
  return doc.body.textContent || '';
}

export async function parseRssUrl(url: string): Promise<{ title: string; articles: Article[] }> {
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

    return { title: channelTitle, articles };
}


export function parseOpml(fileContent: string): string[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, "application/xml");
    const outlines = Array.from(xmlDoc.querySelectorAll('outline[type="rss"][xmlUrl]'));
    return outlines.map(outline => outline.getAttribute('xmlUrl')).filter((url): url is string => !!url);
}