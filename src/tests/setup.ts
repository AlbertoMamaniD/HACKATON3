import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", { value: ResizeObserverMock });
Object.defineProperty(window, "matchMedia", { value: (query: string) => ({ matches: false, media: query, onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false }) });
window.confirm = () => true;

beforeEach(() => window.localStorage.clear());
