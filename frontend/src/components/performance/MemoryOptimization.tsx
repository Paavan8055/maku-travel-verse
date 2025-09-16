import React, { useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

// Memory-optimized component wrapper
export const withMemoryOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memoize?: boolean;
    debounceMs?: number;
    cleanupOnUnmount?: boolean;
  } = {}
) => {
  const {
    memoize = true,
    debounceMs = 300,
    cleanupOnUnmount = true
  } = options;

  const OptimizedComponent = (props: P) => {
    const cleanupFunctions = useRef<Array<() => void>>([]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (cleanupOnUnmount) {
          cleanupFunctions.current.forEach(cleanup => cleanup());
          cleanupFunctions.current = [];
        }
      };
    }, []);

    const addCleanup = useCallback((cleanup: () => void) => {
      cleanupFunctions.current.push(cleanup);
    }, []);

    const debouncedProps = useMemo(() => {
      if (debounceMs > 0) {
        const debouncedHandlers: any = {};
        Object.keys(props as any).forEach(key => {
          const value = (props as any)[key];
          if (typeof value === 'function' && key.startsWith('on')) {
            debouncedHandlers[key] = debounce(value, debounceMs);
            addCleanup(() => debouncedHandlers[key].cancel());
          } else {
            debouncedHandlers[key] = value;
          }
        });
        return debouncedHandlers as P;
      }
      return props;
    }, [props, debounceMs, addCleanup]);

    return <Component {...debouncedProps} />;
  };

  return memoize ? memo(OptimizedComponent) : OptimizedComponent;
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = <T,>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // ~60fps
    []
  );

  const totalHeight = items.length * itemHeight;

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    handleScroll,
    scrollTop
  };
};

// Memory leak prevention for event listeners
export const useEventListener = (
  eventName: string,
  handler: (event: Event) => void,
  element: HTMLElement | Window | null = window
) => {
  const savedHandler = useRef<(event: Event) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element?.addEventListener) return;

    const eventListener = (event: Event) => savedHandler.current?.(event);
    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [entries, setEntries] = React.useState<IntersectionObserverEntry[]>([]);
  const observer = useRef<IntersectionObserver>();

  const observe = useCallback((element: Element) => {
    if (observer.current) {
      observer.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: Element) => {
    if (observer.current) {
      observer.current.unobserve(element);
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      setEntries(entries);
    }, options);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [options]);

  return { entries, observe, unobserve };
};

// Optimized search with debouncing and caching
export const useOptimizedSearch = <T,>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  debounceMs: number = 300
) => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<T[]>(items);
  const cacheRef = useRef<Map<string, T[]>>(new Map());

  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(items);
        return;
      }

      // Check cache first
      if (cacheRef.current.has(searchQuery)) {
        setResults(cacheRef.current.get(searchQuery)!);
        return;
      }

      // Perform search
      const filtered = items.filter(item => searchFn(item, searchQuery));
      
      // Cache results
      cacheRef.current.set(searchQuery, filtered);
      
      // Limit cache size
      if (cacheRef.current.size > 100) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      setResults(filtered);
    }, debounceMs),
    [items, searchFn, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    clearCache: () => cacheRef.current.clear()
  };
};

// Memory-optimized image component
export const OptimizedImage = memo<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
}>(({ src, alt, width, height, className, placeholder }) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Intersection observer for lazy loading
  const { entries, observe } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const [shouldLoad, setShouldLoad] = React.useState(false);

  useEffect(() => {
    if (imgRef.current) {
      observe(imgRef.current);
    }
  }, [observe]);

  useEffect(() => {
    const entry = entries.find(entry => entry.target === imgRef.current);
    if (entry?.isIntersecting) {
      setShouldLoad(true);
    }
  }, [entries]);

  return (
    <div ref={imgRef} className={className} style={{ width, height }}>
      {shouldLoad ? (
        <img
          src={error ? placeholder : src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      ) : (
        <div 
          className="bg-muted animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Resource cleanup utility
export const useResourceCleanup = () => {
  const resources = useRef<Array<() => void>>([]);

  const addResource = useCallback((cleanup: () => void) => {
    resources.current.push(cleanup);
  }, []);

  const cleanupAll = useCallback(() => {
    resources.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    });
    resources.current = [];
  }, []);

  useEffect(() => {
    return cleanupAll;
  }, [cleanupAll]);

  return { addResource, cleanupAll };
};

// Performance monitoring for components
export const useComponentPerformance = (componentName: string) => {
  const renderStart = useRef<number>(Date.now());
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    rerenderCount: 0
  });

  useEffect(() => {
    const renderTime = Date.now() - renderStart.current;
    setMetrics(prev => ({
      renderTime,
      rerenderCount: prev.rerenderCount + 1
    }));
  });

  useEffect(() => {
    renderStart.current = Date.now();
  });

  // Log performance in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics.rerenderCount > 0) {
      console.log(`${componentName} performance:`, metrics);
    }
  }, [componentName, metrics]);

  return metrics;
};