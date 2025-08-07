import { useCallback, useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  isSlowRender: boolean;
}

export function usePerformanceMonitor(
  componentName: string,
): PerformanceMetrics {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    isSlowRender: false,
  });

  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);

    // Keep only last 10 render times for moving average
    if (renderTimesRef.current.length > 10) {
      renderTimesRef.current.shift();
    }

    const averageRenderTime =
      renderTimesRef.current.reduce((a, b) => a + b, 0) /
      renderTimesRef.current.length;
    const isSlowRender = renderTime > 16; // 16ms threshold for 60fps

    setMetrics({
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
      averageRenderTime,
      isSlowRender,
    });

    // Log slow renders in development
    if (process.env.NODE_ENV === "development" && isSlowRender) {
      console.warn(
        `🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`,
      );
    }

    startTime.current = performance.now();
  }, [componentName]);

  return metrics;
}

export function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;
}

export function useThrottleCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number,
): T {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => (inThrottle.current = false), limit);
      }
    },
    [callback, limit],
  ) as T;
}
