import React from "react";
import { FavoriteButton } from "../components/FavoriteButton";
import type { Article } from "../types";

// Example usage of the FavoriteButton component
const FavoriteButtonExample: React.FC = () => {
  const sampleArticle: Article = {
    title: "Sample News Article",
    link: "https://example.com/sample-article",
    pubDate: new Date(),
    sourceTitle: "Example News",
    imageUrl: "https://picsum.photos/400/200",
    description:
      "This is a sample article for demonstrating the FavoriteButton component.",
    author: "John Doe",
    categories: ["Technology", "News"],
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-8">
        FavoriteButton Component Examples
      </h1>

      <div className="space-y-8">
        {/* Size Variants */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Size Variants
          </h2>
          <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
            <div className="text-white">Small:</div>
            <FavoriteButton
              article={sampleArticle}
              size="small"
              position="inline"
            />

            <div className="text-white">Medium:</div>
            <FavoriteButton
              article={sampleArticle}
              size="medium"
              position="inline"
            />

            <div className="text-white">Large:</div>
            <FavoriteButton
              article={sampleArticle}
              size="large"
              position="inline"
            />
          </div>
        </section>

        {/* Position Variants */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Position Variants
          </h2>

          {/* Overlay Example */}
          <div className="mb-4">
            <h3 className="text-lg text-white mb-2">
              Overlay Position (for images)
            </h3>
            <div className="relative w-64 h-32 bg-gray-700 rounded-lg overflow-hidden">
              <img
                src="https://picsum.photos/256/128"
                alt="Sample"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <FavoriteButton
                  article={sampleArticle}
                  size="medium"
                  position="overlay"
                />
              </div>
            </div>
          </div>

          {/* Inline Example */}
          <div>
            <h3 className="text-lg text-white mb-2">
              Inline Position (for lists)
            </h3>
            <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div className="text-white">
                <h4 className="font-semibold">Article Title</h4>
                <p className="text-gray-400 text-sm">Article description...</p>
              </div>
              <FavoriteButton
                article={sampleArticle}
                size="medium"
                position="inline"
              />
            </div>
          </div>
        </section>

        {/* Custom Styling */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Custom Styling
          </h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <FavoriteButton
              article={sampleArticle}
              size="large"
              position="inline"
              className="border-2 border-blue-500 hover:border-blue-400"
              aria-label="Custom favorite button"
              title="Click to add to favorites"
            />
          </div>
        </section>

        {/* Real-world Usage Examples */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Real-world Usage
          </h2>

          {/* Article Card Example */}
          <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
            <div className="relative">
              <img
                src="https://picsum.photos/400/200"
                alt="Article thumbnail"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <FavoriteButton
                  article={sampleArticle}
                  size="large"
                  position="overlay"
                />
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold mb-2">
                Featured Article Title
              </h3>
              <p className="text-gray-400 text-sm">
                Article description and content preview...
              </p>
            </div>
          </div>

          {/* List Item Example */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <img
                src="https://picsum.photos/80/80"
                alt="Article thumbnail"
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium mb-1">
                  Recent News Item
                </h4>
                <p className="text-gray-400 text-sm">Brief description...</p>
                <div className="text-gray-500 text-xs mt-1">2 hours ago</div>
              </div>
              <div className="flex-shrink-0">
                <FavoriteButton
                  article={sampleArticle}
                  size="small"
                  position="inline"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FavoriteButtonExample;
