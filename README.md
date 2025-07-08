# Personal News Dashboard

A personal browser homepage that aggregates RSS feeds, displays the date, time, and weather. All data is stored locally in your browser.

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
- AllOrigins (as a CORS proxy for RSS parsing)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
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

## Project Structure

```
personal-news-dashboard/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   ├── index.html
│   ├── index.tsx
│   ├── metadata.json
│   ├── service-worker.js
│   └── vite.config.ts
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
└── ...
