/**
 * LoadingStatesDemo.tsx
 *
 * Demo component showcasing all available loading states and components.
 * This component demonstrates the enhanced loading experience for the
 * pagination and performance improvements.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import {
  PaginationLoading,
  NavigationLoading,
  ContentLoading,
  LoadingButton,
  OverlayLoading,
  InlineLoading,
  PlaceholderLoading,
  ProgressiveArticleLoading,
  SmartLoading,
} from "./LoadingStates";
import {
  ArticleSkeleton,
  ProgressiveArticlesSkeleton,
  EnhancedPaginationSkeleton,
} from "./SkeletonLoader";
import { FeedLoadingProgress } from "./ProgressIndicator";

export const LoadingStatesDemo: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [loadedArticles, setLoadedArticles] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Simulate progressive loading
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
      setLoadedArticles((prev) => (prev >= 12 ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const handleShowOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="p-6 space-y-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">
        Enhanced Loading States Demo
      </h1>

      {/* Basic Loading Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Loading Components</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pagination Loading</h3>
            <PaginationLoading />
            <PaginationLoading compact={true} />
            <PaginationLoading showProgress={true} progress={progress} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Navigation Loading</h3>
            <NavigationLoading />
            <NavigationLoading direction="prev" />
            <NavigationLoading direction="next" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content Loading</h3>
            <ContentLoading type="articles" />
            <ContentLoading type="search" showSpinner={false} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inline Loading</h3>
            <InlineLoading text="Loading data..." />
            <InlineLoading size="lg" />
            <PlaceholderLoading width="200px" height="30px" />
          </div>
        </div>
      </section>

      {/* Enhanced Loading Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Enhanced Loading Components</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Progressive Article Loading</h3>
            <ProgressiveArticleLoading
              loadedCount={loadedArticles}
              totalCount={12}
            />
            <ProgressiveArticleLoading
              loadedCount={8}
              totalCount={10}
              isBackgroundRefresh={true}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Smart Loading</h3>
            <SmartLoading type="initial" progress={progress} />
            <SmartLoading type="pagination" />
            <SmartLoading type="search" />
          </div>
        </div>
      </section>

      {/* Skeleton Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeleton Components</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Article Skeletons</h3>
            <div className="max-w-sm">
              <ArticleSkeleton />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Progressive Skeletons</h3>
            <ProgressiveArticlesSkeleton
              loadedCount={loadedArticles}
              totalCount={12}
              articlesPerPage={6}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Enhanced Pagination Skeletons</h3>
          <EnhancedPaginationSkeleton />
          <EnhancedPaginationSkeleton
            compact={true}
            showProgress={true}
            progress={progress}
          />
        </div>
      </section>

      {/* Feed Loading Progress */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Feed Loading Progress</h2>

        <FeedLoadingProgress
          loadedFeeds={Math.floor(progress / 20)}
          totalFeeds={5}
          progress={progress}
          errors={
            progress > 80
              ? [
                  {
                    url: "https://example.com/feed",
                    error: "Timeout",
                    feedTitle: "Example Feed",
                  },
                ]
              : []
          }
          onRetryErrors={() => console.log("Retry errors")}
          onCancel={() => console.log("Cancel loading")}
        />
      </section>

      {/* Interactive Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Interactive Examples</h2>

        <div className="flex space-x-4">
          <LoadingButton
            isLoading={isLoading}
            onClick={handleStartLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Start Loading
          </LoadingButton>

          <LoadingButton
            onClick={handleShowOverlay}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Show Overlay
          </LoadingButton>
        </div>

        <OverlayLoading
          isVisible={showOverlay}
          message="Processing your request..."
          progress={progress}
          onCancel={() => setShowOverlay(false)}
        />
      </section>

      {/* Usage Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Examples</h2>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Code Examples</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            {`// Progressive article loading
<ProgressiveArticleLoading
  loadedCount={loadedArticles}
  totalCount={totalArticles}
  isBackgroundRefresh={isBackgroundRefresh}
/>

// Smart loading with different types
<SmartLoading
  type="initial"
  progress={progress}
  showCancel={true}
  onCancel={handleCancel}
/>

// Enhanced pagination with progress
<EnhancedPaginationSkeleton
  showProgress={true}
  progress={loadingProgress}
/>`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default LoadingStatesDemo;
