import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// Inyectar configuración aislada para pruebas unitarias
if (typeof process !== "undefined") {
  process.env.VITE_SUPABASE_URL = "https://placeholder-test.supabase.co";
  process.env.VITE_SUPABASE_ANON_KEY = "placeholder-test-anon-key";
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", { value: ResizeObserverMock });
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
window.confirm = () => true;

beforeEach(() => {
  window.localStorage.clear();
});
