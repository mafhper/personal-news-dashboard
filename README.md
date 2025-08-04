# Personal News Dashboard

A modern, customizable RSS feed aggregator designed as a browser homepage replacement. Built with React, TypeScript, and Tailwind CSS.

![Personal News Dashboard](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)

## ✨ Features

### 🗞️ RSS Feed Management

- **Multi-source aggregation**: Fetch and display articles from multiple RSS feeds
- **Smart validation**: Automatic feed validation with error recovery
- **Feed discovery**: Auto-discover RSS feeds from websites
- **Category organization**: Organize feeds into custom categories with drag-and-drop
- **OPML import/export**: Import and export feed collections

### 🎨 Customization

- **Theme system**: Multiple built-in themes (dark/light) with custom theme creation
- **Background images**: Customizable background images
- **Layout options**: Flexible article layout and pagination
- **Color customization**: Full color palette customization

### 📱 User Experience

- **Responsive design**: Works on desktop, tablet, and mobile
- **Offline support**: PWA-ready with service worker
- **Keyboard navigation**: Full keyboard accessibility
- **Search functionality**: Search across all articles
- **Favorites system**: Save and organize favorite articles

### 🔧 Technical Features

- **Local storage**: All data stored locally in browser
- **Performance optimized**: Lazy loading, virtualization, and caching
- **Error handling**: Comprehensive error recovery and user feedback
- **Accessibility**: WCAG compliant with screen reader support

## � Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mafhper/personal-news-dashboard.git
   cd personal-news-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📖 Usage

### Adding RSS Feeds

1. Click the "+" button in the feed manager
2. Enter the RSS feed URL
3. The system will validate and discover the feed automatically
4. Organize feeds into categories using drag-and-drop

### Customizing Themes

1. Open Settings → Theme Customizer
2. Choose from preset themes or create custom ones
3. Adjust colors, backgrounds, and layout options
4. Export/import themes to share with others

### Managing Articles

- **Read articles**: Click on any article to open in a new tab
- **Mark as favorite**: Click the heart icon to save articles
- **Search**: Use the search bar to find specific articles
- **Filter**: Filter by category, source, or read status

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19.1.0 with TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.1.11
- **Build Tool**: Vite 7.0.0
- **Testing**: Vitest with React Testing Library
- **Icons**: Lucide React

### Project Structure

```
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── icons/          # Icon components
├── hooks/              # Custom React hooks
├── services/           # Business logic and API services
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── docs/               # Documentation
│   ├── design/         # Design specifications
│   ├── development/    # Development guides
│   └── specs/          # Feature specifications
└── __tests__/          # Test files
```

### Key Services

- **RSS Parser**: Handles RSS feed parsing and CORS issues
- **Feed Validator**: Validates and discovers RSS feeds
- **Theme System**: Manages themes and customization
- **Cache System**: Optimizes performance with smart caching
- **Error Handler**: Provides comprehensive error recovery

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 📚 Documentation

- [Design Specifications](docs/design/)
- [Development Guide](docs/development/)
- [Feature Specifications](docs/specs/)
- [API Documentation](docs/api/)

## � Conteributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Maintain accessibility standards
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- RSS2JSON API for CORS-free RSS parsing
- Open-Meteo API for weather data
- Lucide React for beautiful icons
- Tailwind CSS for utility-first styling

## 📞 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/mafhper/personal-news-dashboard/issues)
3. Create a new issue with detailed information

---

**Made with ❤️ for the open web**
