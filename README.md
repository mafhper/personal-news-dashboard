# Personal News Dashboard

A personal browser homepage that aggregates RSS feeds, displays the date, time, and weather. All data is stored locally in your browser.

## Current Status

The project is currently in a functional state, with recent efforts focused on improving layout responsiveness and addressing cross-origin resource sharing (CORS) issues for RSS feed fetching.

## Features

- **RSS Feed Aggregation:** Pulls articles from multiple RSS feeds.
- **Local Storage:** All feed configurations and cached articles are stored directly in your browser's local storage.
- **Customizable Theme:** Choose your preferred accent color for the dashboard.
- **Custom Background Image:** Set a local image as your dashboard background.
- **Weather Widget:** Displays current weather conditions for a user-defined city.
- **Pagination:** Navigate through news articles page by page.
- **PWA Ready:** Designed to be a Progressive Web App for potential offline capabilities.

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Open-Meteo API (for weather data)
- CORS Proxies (for RSS parsing - *note: public proxies have proven unstable, local proxy is recommended*)

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

## Future Improvements

-   **Robust Local Proxy:** Implement a stable local Node.js proxy for RSS feed fetching to overcome public CORS proxy limitations.
-   **Refined Tailwind CSS Configuration:** Revisit and finalize the Tailwind CSS PostCSS configuration based on lessons learned for a cleaner build process.
-   **Enhanced Debugging Tools:** Maintain and expand detailed logging in `rssParser.ts` and `App.tsx`, and consider displaying user-friendly error messages directly in the UI for better diagnostics.
-   **Automated Tests:** Add unit and integration tests for React components, hooks, and services to ensure stability and facilitate future modifications.
-   **Image Optimization:** Implement lazy loading for article images and optimize image sizes to improve loading performance.
-   **Internationalization (i18n):** Add support for multiple languages for the user interface.
-   **More Flexible Feed Configuration:** Allow users to add different types of feeds (e.g., Atom) and not just RSS.
-   **Improved Feed Addition Experience:** Validate feed URLs in real-time and provide visual feedback to the user.
-   **Advanced State Persistence:** Consider using a more robust state management library (like Redux or Zustand) for larger applications, although `useLocalStorage` is adequate for this project.
-   **Accessibility:** Conduct a full accessibility audit and implement improvements to ensure the application is usable by people with disabilities.
-   **Service Worker for Offline:** Reimplement the Service Worker with a more robust caching strategy to allow offline use of the application, ensuring assets and feeds are accessible even without an internet connection.
-   **Additional Customization:** Offer more customization options, such as fonts, text sizes, and article layouts.