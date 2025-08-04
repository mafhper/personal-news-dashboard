import "@testing-library/jest-dom";
import { configureAxe } from "jest-axe";
import { vi, beforeAll, afterAll } from "vitest";

// Configure axe for accessibility testing
configureAxe({
  rules: {
    // Customize rules as needed
    "color-contrast": { enabled: true },
    "frame-title": { enabled: false }, // Disable if not using frames
    "scrollable-region-focusable": { enabled: true },
    "landmark-one-main": { enabled: true },
    "page-has-heading-one": { enabled: false }, // Components might not have h1
    region: { enabled: false }, // Components might not have regions
  },
});

// Mock matchMedia
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return true;
      },
    };
  };

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // Simulate element coming into view after a short delay
    setTimeout(() => {
      this.callback(
        [
          {
            isIntersecting: true,
            target: document.createElement("div"),
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: 1,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: performance.now(),
          },
        ],
        this as any
      );
    }, 10);
  }
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver =
  window.IntersectionObserver || IntersectionObserverMock;

// Mock requestAnimationFrame
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  function (callback) {
    return setTimeout(callback, 0);
  };

// Mock cancelAnimationFrame
window.cancelAnimationFrame =
  window.cancelAnimationFrame ||
  function (id) {
    clearTimeout(id);
  };

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", { value: localStorageMock });

// Mock URL constructor for Node.js environment
if (typeof global !== "undefined" && !global.URL) {
  const { URL, URLSearchParams } = require("url");
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
}

// Mock console methods for tests
const originalConsole = { ...console };
beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
});
