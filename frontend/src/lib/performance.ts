/**
 * Performance optimization utilities for DezAI
 * Includes lazy loading, caching, and performance monitoring
 */

// Cache configuration
const CACHE_CONFIG = {
  audioAnalysis: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 50, // 50 items
  },
  userData: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSize: 100, // 100 items
  },
};

// Simple LRU Cache implementation
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize: number, maxAge: number) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  get(key: K): V | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: K, value: V): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache instances
export const audioAnalysisCache = new LRUCache<string, any>(
  CACHE_CONFIG.audioAnalysis.maxSize,
  CACHE_CONFIG.audioAnalysis.maxAge
);

export const userDataCache = new LRUCache<string, any>(
  CACHE_CONFIG.userData.maxSize,
  CACHE_CONFIG.userData.maxAge
);

// Lazy loading utilities
export const lazyLoadComponent = (importFn: () => Promise<any>) => {
  return React.lazy(() => importFn());
};

// Image optimization
export const optimizeImage = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
} = {}): string => {
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('fm', options.format);
  
  // Add cache busting for CDN
  params.append('auto', 'format,compress');
  
  return `${url}?${params.toString()}`;
};

// Performance monitoring
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        const duration = measure.duration;
        
        // Store for analytics
        if (!this.measures.has(name)) {
          this.measures.set(name, []);
        }
        this.measures.get(name)?.push(duration);
        
        // Clean up marks
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(name);
        
        return duration;
      } catch (error) {
        console.warn(`Performance measurement failed for ${name}:`, error);
        return null;
      }
    }
    return null;
  }

  getAverage(name: string): number | null {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return null;
    
    const sum = measures.reduce((a, b) => a + b, 0);
    return sum / measures.length;
  }

  report(): Record<string, number> {
    const report: Record<string, number> = {};
    
    for (const [name, measures] of this.measures.entries()) {
      if (measures.length > 0) {
        const avg = measures.reduce((a, b) => a + b, 0) / measures.length;
        report[name] = avg;
      }
    }
    
    return report;
  }
}

// Debounce utility for expensive operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for scroll/resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory usage monitoring
export const getMemoryUsage = (): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Prefetch resources
export const prefetchResources = (urls: string[]): void => {
  if ('IntersectionObserver' in window && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = url.endsWith('.js') ? 'script' : 
                  url.endsWith('.css') ? 'style' : 
                  url.endsWith('.woff2') ? 'font' : 'fetch';
        document.head.appendChild(link);
      });
    });
  }
};

// Critical CSS inlining (simplified)
export const inlineCriticalCSS = (): void => {
  // This would typically be done at build time
  // For runtime, we can prioritize above-the-fold styles
  const styleSheets = Array.from(document.styleSheets);
  
  styleSheets.forEach(sheet => {
    if (sheet.href && !sheet.href.includes('critical')) {
      sheet.disabled = true;
      
      // Re-enable after page load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          sheet.disabled = false;
        });
      } else {
        sheet.disabled = false;
      }
    }
  });
};

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Import React for lazy loading
import React from 'react';