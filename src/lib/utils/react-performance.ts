/**
 * React Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing React components:
 * - Memoization helpers
 * - Lazy loading utilities
 * - Re-render optimization
 * - Performance monitoring
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Enhanced useMemo with dependency tracking
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const prevDeps = useRef<React.DependencyList>();
  const result = useRef<T>();
  
  // Check if dependencies have changed
  const depsChanged = !prevDeps.current || 
    deps.length !== prevDeps.current.length ||
    deps.some((dep, index) => dep !== prevDeps.current![index]);
  
  if (depsChanged) {
    if (debugName && process.env.NODE_ENV === 'development') {
      console.log(`🔄 Recomputing ${debugName}`, { deps });
    }
    result.current = factory();
    prevDeps.current = deps;
  }
  
  return result.current!;
}

/**
 * Enhanced useCallback with performance tracking
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const callCount = useRef(0);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      callCount.current++;
      if (debugName && process.env.NODE_ENV === 'development' && callCount.current % 10 === 0) {
        console.log(`📞 ${debugName} called ${callCount.current} times`);
      }
      return callback(...args);
    }) as T,
    deps
  );
}

/**
 * Hook for debouncing values to prevent excessive re-renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Hook for virtual scrolling optimization
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useOptimizedCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    },
    [],
    'VirtualScroll'
  );

  return {
    visibleItems,
    totalHeight,
    handleScroll,
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 ${componentName} render #${renderCount.current}`, {
        timeSinceMount: now - mountTime.current,
        timeSinceLastRender,
      });

      // Warn about frequent re-renders
      if (renderCount.current > 10 && timeSinceLastRender < 100) {
        console.warn(`⚠️ ${componentName} is re-rendering frequently!`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current,
  };
}

/**
 * Hook for managing component state with optimized updates
 */
export function useOptimizedState<T>(
  initialState: T | (() => T),
  equalityFn?: (prev: T, next: T) => boolean
): [T, (newState: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);

  const optimizedSetState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(stateRef.current)
        : newState;

      // Use custom equality function or default shallow comparison
      const isEqual = equalityFn 
        ? equalityFn(stateRef.current, nextState)
        : stateRef.current === nextState;

      if (!isEqual) {
        stateRef.current = nextState;
        setState(nextState);
      }
    },
    [equalityFn]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [state, optimizedSetState];
}

/**
 * Shallow equality comparison for objects
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null || 
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Deep equality comparison for complex objects
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null || 
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * HOC for memoizing components with custom comparison
 */
export function withOptimizedMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = `OptimizedMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Utility for creating stable references
 */
export function useStableRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Hook for batching state updates
 */
export function useBatchedUpdates() {
  const [, forceUpdate] = useState({});
  const pendingUpdates = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updateFn: () => void) => {
    pendingUpdates.current.push(updateFn);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdates.current;
      pendingUpdates.current = [];
      
      updates.forEach(update => update());
      forceUpdate({});
    }, 0);
  }, []);

  return batchUpdate;
}