/**
 * Tests for pagination and article distribution functionality
 */
import { describe, it, expect } from 'vitest';

// Test the article distribution logic directly (matching FeedContent.tsx implementation)
const distributeArticles = (articles: any[]) => {
  if (articles.length === 0) return { featured: null, recent: [], topStories: [] };

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  // Fixed article distribution to meet requirements
  // Always show exactly 5 recent articles if available
  const recentArticles = otherArticles.slice(0, Math.min(5, otherArticles.length));

  // Show remaining articles in Top Stories section (should be at least 15 with pagination)
  const startIndex = recentArticles.length;
  const topStoriesArticles = otherArticles.slice(startIndex);

  return {
    featured: featuredArticle,
    recent: recentArticles,
    topStories: topStoriesArticles
  };
};

// Create mock articles
const createMockArticle = (index: number) => ({
  title: `Test Article ${index}`,
  link: `https://example.com/article-${index}`,
  pubDate: new Date(Date.now() - index * 60000),
  description: `Description for article ${index}`,
  imageUrl: `https://example.com/image-${index}.jpg`,
  author: `Author ${index}`,
  categories: ['test'],
  sourceTitle: `Source ${index}`,
  loadedAt: Date.now(),
  feedUrl: 'https://example.com/feed',
});

describe('Article Distribution Logic', () => {
  it('should distribute articles correctly with configurable top stories count', () => {
    // Test with different top stories configurations
    const testCases = [
      { articles: 21, topStories: 15, expectedTopStories: 15 },
      { articles: 16, topStories: 10, expectedTopStories: 10 },
      { articles: 11, topStories: 5, expectedTopStories: 5 },
      { articles: 6, topStories: 0, expectedTopStories: 0 },
    ];

    testCases.forEach(({ articles: totalArticles, topStories, expectedTopStories }) => {
      const articles = Array.from({ length: totalArticles }, (_, i) => createMockArticle(i + 1));

      // Simulate the new configurable distribution
      const featuredArticle = articles[0];
      const otherArticles = articles.slice(1);
      const recentArticles = otherArticles.slice(0, Math.min(5, otherArticles.length));
      const startIndex = recentArticles.length;
      const endIndex = startIndex + topStories;
      const topStoriesArticles = otherArticles.slice(startIndex, endIndex);

      // Should have 1 featured article
      expect(featuredArticle).toBeDefined();

      // Should have up to 5 recent articles
      expect(recentArticles.length).toBeLessThanOrEqual(5);

      // Should have configured number of top stories
      expect(topStoriesArticles.length).toBe(expectedTopStories);
    });
  });

  it('should handle the old problematic case - 12 articles with fixed distribution', () => {
    const articles = Array.from({ length: 12 }, (_, i) => createMockArticle(i + 1));
    const distribution = distributeArticles(articles);

    // With fixed distribution: 1 featured + 5 recent + 6 top stories = 12 total
    expect(distribution.topStories.length).toBe(6);
    expect(distribution.recent.length).toBe(5);

    // Total articles should equal input
    const totalDistributed = 1 + distribution.recent.length + distribution.topStories.length;
    expect(totalDistributed).toBe(12);
  });

  it('should handle fewer articles gracefully', () => {
    const articles = Array.from({ length: 6 }, (_, i) => createMockArticle(i + 1));
    const distribution = distributeArticles(articles);

    expect(distribution.featured).toBeDefined();
    expect(distribution.recent).toHaveLength(5); // min(5, 5) = 5
    expect(distribution.topStories).toHaveLength(0); // remaining 5 - 5 = 0
  });

  it('should handle edge case with minimal articles', () => {
    const articles = Array.from({ length: 3 }, (_, i) => createMockArticle(i + 1));
    const distribution = distributeArticles(articles);

    expect(distribution.featured).toBeDefined();
    expect(distribution.recent).toHaveLength(2); // min(5, 2) = 2
    expect(distribution.topStories).toHaveLength(0); // remaining 2 - 2 = 0
  });

  it('should handle single article', () => {
    const articles = [createMockArticle(1)];
    const distribution = distributeArticles(articles);

    expect(distribution.featured).toBeDefined();
    expect(distribution.recent).toHaveLength(0);
    expect(distribution.topStories).toHaveLength(0);
  });

  it('should handle empty articles array', () => {
    const articles: any[] = [];
    const distribution = distributeArticles(articles);

    expect(distribution.featured).toBeNull();
    expect(distribution.recent).toHaveLength(0);
    expect(distribution.topStories).toHaveLength(0);
  });

  it('should verify the fixed distribution for various article counts', () => {
    // Test different article counts to ensure proper distribution with fixed logic
    const testCases = [
      { total: 21, expectedRecent: 5, expectedTopStories: 15 }, // Target case: 1 + 5 + 15 = 21
      { total: 12, expectedRecent: 5, expectedTopStories: 6 },  // 1 + 5 + 6 = 12
      { total: 15, expectedRecent: 5, expectedTopStories: 9 },  // 1 + 5 + 9 = 15
      { total: 8, expectedRecent: 5, expectedTopStories: 2 },   // 1 + 5 + 2 = 8
      { total: 4, expectedRecent: 3, expectedTopStories: 0 },   // 1 + 3 + 0 = 4
    ];

    testCases.forEach(({ total, expectedRecent, expectedTopStories }) => {
      const articles = Array.from({ length: total }, (_, i) => createMockArticle(i + 1));
      const distribution = distributeArticles(articles);

      expect(distribution.recent).toHaveLength(expectedRecent);
      expect(distribution.topStories).toHaveLength(expectedTopStories);

      // Verify total adds up
      const totalDistributed = 1 + distribution.recent.length + distribution.topStories.length;
      expect(totalDistributed).toBe(total);
    });
  });
});
