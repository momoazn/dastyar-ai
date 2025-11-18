import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile Hook", () => {
  // Store original window.innerWidth
  let originalInnerWidth: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
  });

  test("returns false when screen width is desktop size", () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock matchMedia
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {
        // Mock implementation
      },
      removeListener: () => {
        // Mock implementation
      },
      addEventListener: () => {
        // Mock implementation
      },
      removeEventListener: () => {
        // Mock implementation
      },
      dispatchEvent: () => true,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  test("returns true when screen width is mobile size", () => {
    // Mock window.innerWidth for mobile (< 768px)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Mock matchMedia
    window.matchMedia = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {
        // Mock implementation
      },
      removeListener: () => {
        // Mock implementation
      },
      addEventListener: () => {
        // Mock implementation
      },
      removeEventListener: () => {
        // Mock implementation
      },
      dispatchEvent: () => true,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  test("returns true at mobile breakpoint (767px)", () => {
    // Mock window.innerWidth at breakpoint
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 767,
    });

    // Mock matchMedia
    window.matchMedia = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {
        // Mock implementation
      },
      removeListener: () => {
        // Mock implementation
      },
      addEventListener: () => {
        // Mock implementation
      },
      removeEventListener: () => {
        // Mock implementation
      },
      dispatchEvent: () => true,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  test("returns false at desktop breakpoint (768px)", () => {
    // Mock window.innerWidth at desktop breakpoint
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Mock matchMedia
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {
        // Mock implementation
      },
      removeListener: () => {
        // Mock implementation
      },
      addEventListener: () => {
        // Mock implementation
      },
      removeEventListener: () => {
        // Mock implementation
      },
      dispatchEvent: () => true,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  test("handles matchMedia addEventListener", () => {
    let changeHandler: (() => void) | null = null;

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {
        // Mock implementation
      },
      removeListener: () => {
        // Mock implementation
      },
      addEventListener: (_event: string, handler: () => void) => {
        changeHandler = handler;
      },
      removeEventListener: () => {
        // Mock implementation
      },
      dispatchEvent: () => true,
    });

    renderHook(() => useIsMobile());
    expect(changeHandler).toBeTruthy();
  });
});
