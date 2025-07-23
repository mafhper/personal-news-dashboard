# Personal News Dashboard

A personal browser homepage that aggregates RSS feeds, displays the date, time, and weather. All data is stored locally in your browser.

## Current Status

The project is in a fully functional state with significant recent improvements in UI performance, responsiveness, and accessibility. The latest updates include virtualized scrolling for article lists, lazy image loading, enhanced mobile responsiveness, and comprehensive keyboard navigation support.

## Features

- **RSS Feed Aggregation:** Pulls articles from multiple RSS feeds.
- **Local Storage:** All feed configurations and cached articles are stored directly in your browser's local storage.
- **Customizable Theme:** Choose your preferred accent color for the dashboard with expanded theme options.
- **Custom Background Image:** Set a local image as your dashboard background.
- **Weather Widget:** Displays current weather conditions for a user-defined city.
- **Virtualized Article Lists:** Efficiently renders large numbers of articles with optimized performance.
- **Lazy Image Loading:** Improves page load times by only loading images as they enter the viewport.
- **Responsive Design:** Fully optimized for all screen sizes from mobile to large desktop displays.
- **Accessibility Features:** Comprehensive keyboard navigation, ARIA attributes, and focus management.
- **Article Management:** Mark articles as read/unread and save favorites for later reading.
- **Custom Feed Categories:** Organize feeds into personalized categories with color coding.
- **Real-time Search:** Quickly find articles with debounced search functionality.
- **PWA Ready:** Designed to be a Progressive Web App for potential offline capabilities.

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Open-Meteo API (for weather data)
- CORS Proxies (for RSS parsing - _note: public proxies have proven unstable, local proxy is recommended_)

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/mafhper/personal-news-dashboard.git
    cd personal-news-dashboard
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the application for production:**
    ```bash
    npm run build
    ```
    This will create a `dist/` directory containing the optimized production build.

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm start
```

### Production Preview

To serve the production build locally (useful for testing PWA features):

```bash
npm run preview
```

This will typically serve the application at `http://localhost:4173`.

## Using as Your Browser Homepage

For daily use, it's recommended to serve the `dist/` folder using a local web server (like Nginx or `serve`).

1.  **Build the application:** `npm run build`
2.  **Install a local web server (if you don't have one):**
    ```bash
    npm install -g serve
    # or use Nginx as discussed previously
    ```
3.  **Serve the `dist` folder:**
    ```bash
    serve -s dist
    ```
    This will provide a local URL (e.g., `http://localhost:3000`) that you can set as your browser's homepage.

## Recent Challenges and Solutions

During recent development, several challenges were encountered and addressed:

### Tailwind CSS and PostCSS Configuration

Initially, there were issues migrating Tailwind CSS from CDN to a PostCSS setup, leading to build errors related to incorrect PostCSS plugin syntax and outdated Tailwind CSS plugin imports. These were resolved by ensuring the correct array syntax for PostCSS plugins in `vite.config.ts` and updating the Tailwind CSS plugin import to `@tailwindcss/postcss`.

### RSS Feed Fetching and CORS Proxies

Fetching RSS feeds directly from the browser is often blocked by CORS policies. Several public CORS proxies were attempted (`api.allorigins.win`, `corsproxy.io`, `proxy.cors.sh`), but all proved unstable, leading to `400 Bad Request`, `401 Unauthorized`, and `Cross-Origin Read Blocking (CORB)` errors. A `SyntaxError` related to `dc:creator` in `rssParser.ts` was also fixed by using `getElementsByTagName` for XML parsing. The ultimate lesson learned is the unreliability of public CORS proxies, suggesting a local proxy as the most robust solution.

### Layout and Scroll Issues

The dashboard experienced issues with vertical scrolling on smaller screens and an unwanted horizontal scrollbar. Additionally, the header was being overlapped by content during vertical scrolling. These were resolved by:

- Removing `overflow-y-hidden` from the main content area in `App.tsx` to enable vertical scrolling.
- Reducing `space-x` utility classes in `Header.tsx` to prevent horizontal overflow.
- Applying `overflow-hidden` and `text-overflow-ellipsis` to text elements in `FeaturedArticle.tsx` and `ArticleItem.tsx` to handle long text gracefully.
- Increasing the `z-index` of the header in `Header.tsx` to ensure it remains above scrolling content.

## Recent Performance Improvements

The latest version includes significant performance and UI enhancements:

- **Virtualized Article Lists:** Implemented efficient rendering for large article collections
- **Lazy Image Loading:** Added intersection observer-based image loading
- **Responsive Design:** Fully optimized UI for all device sizes with adaptive layouts
- **Accessibility Enhancements:** Added comprehensive keyboard navigation and ARIA support
- **Advanced Theming:** Expanded theme customization with presets and density options
- **Article Management:** Added read/unread tracking and favorites system
- **Performance Monitoring:** Implemented metrics collection and optimization tools
- **Memory Management:** Added LRU cache and automatic cleanup for better resource usage

## Future Improvements

- **Robust Local Proxy:** Implement a stable local Node.js proxy for RSS feed fetching to overcome public CORS proxy limitations.
- **Enhanced Debugging Tools:** Expand detailed logging and add user-friendly error messages directly in the UI.
- **Automated Tests:** Expand test coverage for React components, hooks, and services.
- **Internationalization (i18n):** Add support for multiple languages for the user interface.
- **More Flexible Feed Configuration:** Allow users to add different types of feeds (e.g., Atom) and not just RSS.
- **Improved Feed Addition Experience:** Validate feed URLs in real-time and provide visual feedback to the user.
- **Advanced State Persistence:** Consider using a more robust state management library for larger applications.
- **Service Worker for Offline:** Enhance the Service Worker with a more robust caching strategy.
- **Additional Customization:** Offer more customization options, such as fonts, text sizes, and article layouts.
