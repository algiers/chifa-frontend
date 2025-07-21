/**
 * Lazy-loaded Components for Performance Optimization
 * 
 * This module provides lazy-loaded versions of heavy components
 * to improve initial page load performance.
 */

import React, { lazy, Suspense, ComponentType } from 'react';
import { LoaderIcon } from '@/components/icons';

// Loading fallback component
const LoadingFallback = ({ message = 'Chargement...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-2 text-muted-foreground">
      <LoaderIcon size={16} />
      <span>{message}</span>
    </div>
  </div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-destructive mb-2">Erreur de chargement</div>
      <div className="text-sm text-muted-foreground">{error.message}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Recharger
      </button>
    </div>
  </div>
);

// HOC for creating lazy components with error boundaries
function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingMessage?: string,
  errorFallback?: ComponentType<{ error: Error }>
) {
  const LazyComponent = lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
}

// Lazy-loaded chat components
export const LazyChatMessages = createLazyComponent(
  () => import('@/components/chat/chat-messages').then(mod => ({ default: mod.ChatMessages })),
  'Chargement des messages...'
);

export const LazyChatInput = createLazyComponent(
  () => import('@/components/chat/chat-input').then(mod => ({ default: mod.ChatInput })),
  'Chargement de la saisie...'
);

export const LazySidebarHistory = createLazyComponent(
  () => import('@/components/sidebar/sidebar-history').then(mod => ({ default: mod.SidebarHistory })),
  'Chargement de l\'historique...'
);

// Lazy-loaded heavy UI components
// LazyMarkdownRenderer removed - component doesn't exist

// LazyCodeHighlighter removed - component doesn't exist

// Lazy-loaded settings and admin components removed - components don't exist

// Progressive loading component for large lists
export const ProgressiveList = <T,>({
  items,
  renderItem,
  batchSize = 20,
  loadingMessage = 'Chargement des éléments...',
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  batchSize?: number;
  loadingMessage?: string;
}) => {
  const [visibleCount, setVisibleCount] = React.useState(batchSize);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadMore = React.useCallback(async () => {
    if (isLoading || visibleCount >= items.length) return;
    
    setIsLoading(true);
    
    // Simulate async loading delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setVisibleCount(prev => Math.min(prev + batchSize, items.length));
    setIsLoading(false);
  }, [isLoading, visibleCount, items.length, batchSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div>
      {visibleItems.map(renderItem)}
      
      {hasMore && (
        <div className="flex justify-center p-4">
          {isLoading ? (
            <LoadingFallback message={loadingMessage} />
          ) : (
            <button
              onClick={loadMore}
              className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Charger plus ({items.length - visibleCount} restants)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Intersection observer based lazy loading
export const LazyOnVisible = ({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <div className="h-32" />)}
    </div>
  );
};

// Preloader for critical components
export const ComponentPreloader = ({
  components,
  onComplete,
}: {
  components: (() => Promise<any>)[];
  onComplete?: () => void;
}) => {
  const [loadedCount, setLoadedCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadComponents = async () => {
      for (let i = 0; i < components.length; i++) {
        try {
          await components[i]();
          setLoadedCount(i + 1);
        } catch (error) {
          console.error(`Failed to preload component ${i}:`, error);
        }
      }
      
      setIsLoading(false);
      onComplete?.();
    };

    loadComponents();
  }, [components, onComplete]);

  if (!isLoading) return null;

  const progress = (loadedCount / components.length) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <LoaderIcon size={32} />
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          Préchargement des composants...
        </div>
        <div className="w-48 bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {loadedCount} / {components.length}
        </div>
      </div>
    </div>
  );
};

// Bundle analyzer helper (development only)
export const BundleAnalyzer = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  const [bundleInfo, setBundleInfo] = React.useState<any>(null);

  React.useEffect(() => {
    // Simulate bundle analysis
    const analyzeBundle = () => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      setBundleInfo({
        scripts: scripts.length,
        styles: styles.length,
        totalSize: 'Estimation: ~2.5MB',
        loadTime: performance.now(),
      });
    };

    analyzeBundle();
  }, []);

  if (!bundleInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 text-xs shadow-lg">
      <div className="font-semibold mb-1">Bundle Info (Dev)</div>
      <div>Scripts: {bundleInfo.scripts}</div>
      <div>Styles: {bundleInfo.styles}</div>
      <div>Size: {bundleInfo.totalSize}</div>
      <div>Load: {Math.round(bundleInfo.loadTime)}ms</div>
    </div>
  );
};