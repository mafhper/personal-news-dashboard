
export interface FeedSource {
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

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export interface AppSettings {
  themeColor: ThemeColor;
  backgroundImage: string | null;
}

export interface UserSettings {
  themeColor: ThemeColor;
  backgroundImage: string | null;
  weatherCity: string;
  timeFormat: '12h' | '24h';
}
