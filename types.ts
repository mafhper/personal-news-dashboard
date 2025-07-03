
export interface FeedSource {
  url: string;
}

export interface QuickLink {
  name: string;
  url: string;
}

export interface Article {
  title: string;
  link: string;
  pubDate: Date;
  sourceTitle: string;
  imageUrl?: string;
  description?: string;
  author?: string;
  categories?: string[];
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}
