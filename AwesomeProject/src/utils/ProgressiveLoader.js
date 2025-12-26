import { useState, useEffect, useCallback, useRef } from 'react';
import MediaCacheManager from './MediaCacheManager';

/**
 * Progressive loading utility for media galleries
 * Implements pagination, lazy loading, and thumbnail caching
 */

/**
 * Hook for progressive loading of media items
 * @param {Function} loadFunction - Function to load media items (page, pageSize) => Promise<{items, hasMore}>
 * @param {Object} options - Configuration options
 * @returns {Object} - Loading state and functions
 */
export const useProgressiveLoader = (loadFunction, options = {}) => {
  const {
    pageSize = 20,
    preloadPages = 1,
    cacheEnabled = true,
    initialLoad = true,
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadItems = useCallback(
    async (pageNum = 0, append = false) => {
      if (loadingRef.current || !mountedRef.current) return;

      try {
        loadingRef.current = true;

        if (pageNum === 0) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const result = await loadFunction(pageNum, pageSize);

        if (!mountedRef.current) return;

        const newItems = result.items || [];

        // Cache thumbnails if enabled
        if (cacheEnabled && newItems.length > 0) {
          MediaCacheManager.preloadThumbnails(
            newItems.map(item => ({
              id: item.id,
              thumbnailUrl: item.thumbnail || item.uri,
              type: item.type,
              url: item.uri,
            })),
            3, // Batch size
          ).catch(error => {
            console.warn('Failed to preload thumbnails:', error);
          });
        }

        setItems(prevItems =>
          append ? [...prevItems, ...newItems] : newItems,
        );
        setHasMore(result.hasMore !== false && newItems.length === pageSize);
        setPage(pageNum);
        setError(null);
      } catch (err) {
        console.error('Failed to load items:', err);
        if (mountedRef.current) {
          setError(err.message || 'Failed to load items');
        }
      } finally {
        loadingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [loadFunction, pageSize, cacheEnabled],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      loadItems(page + 1, true);
    }
  }, [hasMore, loading, loadingMore, page, loadItems]);

  const refresh = useCallback(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    loadItems(0, false);
  }, [loadItems]);

  const retry = useCallback(() => {
    setError(null);
    if (items.length === 0) {
      loadItems(0, false);
    } else {
      loadMore();
    }
  }, [items.length, loadItems, loadMore]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      loadItems(0, false);
    }
  }, [loadItems, initialLoad]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    retry,
  };
};

/**
 * Lazy loading component for individual media items
 */
export class LazyMediaItem {
  constructor(item, onVisible) {
    this.item = item;
    this.onVisible = onVisible;
    this.visible = false;
    this.loaded = false;
    this.cachedThumbnail = null;
  }

  async checkVisibility(viewportTop, viewportBottom, itemTop, itemBottom) {
    const isVisible = itemTop < viewportBottom && itemBottom > viewportTop;

    if (isVisible && !this.visible) {
      this.visible = true;
      await this.loadThumbnail();
      this.onVisible && this.onVisible(this);
    } else if (!isVisible && this.visible) {
      this.visible = false;
    }
  }

  async loadThumbnail() {
    if (this.loaded) return;

    try {
      // Check cache first
      this.cachedThumbnail = await MediaCacheManager.getCachedThumbnail(
        this.item.id,
      );

      if (!this.cachedThumbnail && this.item.thumbnail) {
        // Cache the thumbnail
        this.cachedThumbnail = await MediaCacheManager.cacheThumbnail(
          this.item.id,
          this.item.thumbnail,
          {
            type: this.item.type,
            originalUrl: this.item.uri,
          },
        );
      }

      this.loaded = true;
    } catch (error) {
      console.warn(`Failed to load thumbnail for ${this.item.id}:`, error);
    }
  }

  getThumbnailUri() {
    return this.cachedThumbnail || this.item.thumbnail || this.item.uri;
  }
}

/**
 * Viewport tracker for lazy loading
 */
export class ViewportTracker {
  constructor(scrollViewRef, onItemsVisibilityChange) {
    this.scrollViewRef = scrollViewRef;
    this.onItemsVisibilityChange = onItemsVisibilityChange;
    this.items = new Map();
    this.viewportInfo = { top: 0, bottom: 0, height: 0 };
    this.throttleTimeout = null;
  }

  registerItem(itemId, lazyItem, layout) {
    this.items.set(itemId, { lazyItem, layout });
    this.checkVisibility();
  }

  unregisterItem(itemId) {
    this.items.delete(itemId);
  }

  updateLayout(itemId, layout) {
    const item = this.items.get(itemId);
    if (item) {
      item.layout = layout;
      this.checkVisibility();
    }
  }

  onScroll = event => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;

    this.viewportInfo = {
      top: contentOffset.y,
      bottom: contentOffset.y + layoutMeasurement.height,
      height: layoutMeasurement.height,
    };

    // Throttle visibility checks
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }

    this.throttleTimeout = setTimeout(() => {
      this.checkVisibility();
    }, 16); // ~60fps
  };

  checkVisibility() {
    const visibleItems = [];
    const { top, bottom } = this.viewportInfo;

    for (const [itemId, { lazyItem, layout }] of this.items) {
      if (layout) {
        const itemTop = layout.y;
        const itemBottom = layout.y + layout.height;

        lazyItem.checkVisibility(top, bottom, itemTop, itemBottom);

        if (lazyItem.visible) {
          visibleItems.push(itemId);
        }
      }
    }

    if (this.onItemsVisibilityChange) {
      this.onItemsVisibilityChange(visibleItems);
    }
  }

  destroy() {
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }
    this.items.clear();
  }
}

/**
 * Batch loader for efficient media loading
 */
export class BatchLoader {
  constructor(batchSize = 5, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.processing = false;
  }

  addToQueue(loadFunction) {
    return new Promise((resolve, reject) => {
      this.queue.push({ loadFunction, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      try {
        const promises = batch.map(({ loadFunction }) => loadFunction());
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          const { resolve, reject } = batch[index];
          if (result.status === 'fulfilled') {
            resolve(result.value);
          } else {
            reject(result.reason);
          }
        });
      } catch (error) {
        batch.forEach(({ reject }) => reject(error));
      }

      // Add delay between batches to prevent overwhelming the system
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    this.processing = false;
  }
}

// Export singleton batch loader
export const mediaBatchLoader = new BatchLoader(3, 50);

/**
 * Utility functions for progressive loading
 */
export const ProgressiveLoadingUtils = {
  /**
   * Create a paginated loader function for gallery items
   * @param {Array} allItems - All items to paginate
   * @returns {Function} - Loader function
   */
  createPaginatedLoader: allItems => {
    return async (page, pageSize) => {
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const items = allItems.slice(startIndex, endIndex);

      return {
        items,
        hasMore: endIndex < allItems.length,
      };
    };
  },

  /**
   * Create a loader function that simulates network delay
   * @param {Function} baseLoader - Base loader function
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Delayed loader function
   */
  createDelayedLoader: (baseLoader, delay = 100) => {
    return async (...args) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return baseLoader(...args);
    };
  },

  /**
   * Calculate optimal page size based on screen dimensions
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {number} itemHeight - Estimated item height
   * @returns {number} - Optimal page size
   */
  calculateOptimalPageSize: (screenWidth, screenHeight, itemHeight = 120) => {
    const itemsPerRow = Math.floor(screenWidth / 120); // Assuming 120px item width
    const rowsPerScreen = Math.ceil(screenHeight / itemHeight);
    const itemsPerScreen = itemsPerRow * rowsPerScreen;

    // Load 2-3 screens worth of items
    return Math.max(20, itemsPerScreen * 2);
  },
};
