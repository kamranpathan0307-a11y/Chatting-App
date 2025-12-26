import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MEDIA_CONFIG } from '../config/media';

/**
 * MediaCacheManager - Handles caching of media thumbnails and metadata
 * Implements LRU (Least Recently Used) cache with size limits and expiry
 */
class MediaCacheManager {
  constructor() {
    this.cacheDir = `${RNFS.CachesDirectoryPath}/media_cache`;
    this.thumbnailDir = `${this.cacheDir}/thumbnails`;
    this.metadataKey = '@media_cache_metadata';
    this.maxCacheSize = MEDIA_CONFIG.CACHE_SIZE_LIMIT;
    this.cacheExpiry = MEDIA_CONFIG.CACHE_EXPIRY;
    this.initialized = false;
  }

  /**
   * Initialize cache directories and metadata
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create cache directories if they don't exist
      await this._ensureDirectoryExists(this.cacheDir);
      await this._ensureDirectoryExists(this.thumbnailDir);

      // Load existing cache metadata
      await this._loadCacheMetadata();

      // Clean up expired entries
      await this._cleanupExpiredEntries();

      this.initialized = true;
      console.log('MediaCacheManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaCacheManager:', error);
      throw error;
    }
  }

  /**
   * Cache a thumbnail image
   * @param {string} mediaId - Unique media identifier
   * @param {string} sourceUri - Source URI of the image
   * @param {Object} metadata - Additional metadata to cache
   * @returns {Promise<string>} - Cached thumbnail path
   */
  async cacheThumbnail(mediaId, sourceUri, metadata = {}) {
    await this.initialize();

    try {
      const thumbnailPath = `${this.thumbnailDir}/${mediaId}.jpg`;
      const cacheEntry = {
        mediaId,
        thumbnailPath,
        sourceUri,
        metadata,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
        size: 0,
      };

      // Copy/download the thumbnail to cache
      if (sourceUri.startsWith('http')) {
        // Download from URL
        const downloadResult = await RNFS.downloadFile({
          fromUrl: sourceUri,
          toFile: thumbnailPath,
        }).promise;

        if (downloadResult.statusCode !== 200) {
          throw new Error(
            `Failed to download thumbnail: ${downloadResult.statusCode}`,
          );
        }
      } else {
        // Copy from local file
        await RNFS.copyFile(sourceUri, thumbnailPath);
      }

      // Get file size
      const stats = await RNFS.stat(thumbnailPath);
      cacheEntry.size = stats.size;

      // Update cache metadata
      await this._updateCacheEntry(cacheEntry);

      // Check cache size and cleanup if needed
      await this._enforceCacheSizeLimit();

      console.log(`Cached thumbnail for ${mediaId}: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      console.error(`Failed to cache thumbnail for ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached thumbnail path
   * @param {string} mediaId - Media identifier
   * @returns {Promise<string|null>} - Cached thumbnail path or null if not found
   */
  async getCachedThumbnail(mediaId) {
    await this.initialize();

    try {
      const cacheMetadata = await this._getCacheMetadata();
      const entry = cacheMetadata[mediaId];

      if (!entry) {
        return null;
      }

      // Check if entry is expired
      if (this._isEntryExpired(entry)) {
        await this._removeCacheEntry(mediaId);
        return null;
      }

      // Check if file still exists
      const exists = await RNFS.exists(entry.thumbnailPath);
      if (!exists) {
        await this._removeCacheEntry(mediaId);
        return null;
      }

      // Update last accessed time
      entry.lastAccessed = Date.now();
      await this._updateCacheEntry(entry);

      return entry.thumbnailPath;
    } catch (error) {
      console.error(`Failed to get cached thumbnail for ${mediaId}:`, error);
      return null;
    }
  }

  /**
   * Cache media metadata
   * @param {string} mediaId - Media identifier
   * @param {Object} metadata - Metadata to cache
   */
  async cacheMetadata(mediaId, metadata) {
    await this.initialize();

    try {
      const cacheMetadata = await this._getCacheMetadata();
      const existingEntry = cacheMetadata[mediaId] || {};

      const entry = {
        ...existingEntry,
        mediaId,
        metadata: { ...existingEntry.metadata, ...metadata },
        lastAccessed: Date.now(),
      };

      if (!existingEntry.cachedAt) {
        entry.cachedAt = Date.now();
      }

      await this._updateCacheEntry(entry);
    } catch (error) {
      console.error(`Failed to cache metadata for ${mediaId}:`, error);
    }
  }

  /**
   * Get cached metadata
   * @param {string} mediaId - Media identifier
   * @returns {Promise<Object|null>} - Cached metadata or null if not found
   */
  async getCachedMetadata(mediaId) {
    await this.initialize();

    try {
      const cacheMetadata = await this._getCacheMetadata();
      const entry = cacheMetadata[mediaId];

      if (!entry || this._isEntryExpired(entry)) {
        return null;
      }

      // Update last accessed time
      entry.lastAccessed = Date.now();
      await this._updateCacheEntry(entry);

      return entry.metadata || null;
    } catch (error) {
      console.error(`Failed to get cached metadata for ${mediaId}:`, error);
      return null;
    }
  }

  /**
   * Preload thumbnails for a list of media items
   * @param {Array} mediaItems - Array of media items with id and thumbnailUrl
   * @param {number} batchSize - Number of items to process in parallel
   */
  async preloadThumbnails(mediaItems, batchSize = 3) {
    await this.initialize();

    const batches = [];
    for (let i = 0; i < mediaItems.length; i += batchSize) {
      batches.push(mediaItems.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async item => {
        try {
          const cached = await this.getCachedThumbnail(item.id);
          if (!cached && item.thumbnailUrl) {
            await this.cacheThumbnail(item.id, item.thumbnailUrl, {
              type: item.type,
              originalUrl: item.url,
            });
          }
        } catch (error) {
          console.warn(`Failed to preload thumbnail for ${item.id}:`, error);
        }
      });

      await Promise.all(promises);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      // Remove cache directory
      const exists = await RNFS.exists(this.cacheDir);
      if (exists) {
        await RNFS.unlink(this.cacheDir);
      }

      // Clear metadata
      await AsyncStorage.removeItem(this.metadataKey);

      // Reinitialize
      this.initialized = false;
      await this.initialize();

      console.log('Media cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear media cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getCacheStats() {
    await this.initialize();

    try {
      const cacheMetadata = await this._getCacheMetadata();
      const entries = Object.values(cacheMetadata);

      let totalSize = 0;
      let thumbnailCount = 0;
      let expiredCount = 0;

      for (const entry of entries) {
        if (entry.size) {
          totalSize += entry.size;
        }
        if (entry.thumbnailPath) {
          thumbnailCount++;
        }
        if (this._isEntryExpired(entry)) {
          expiredCount++;
        }
      }

      return {
        totalEntries: entries.length,
        thumbnailCount,
        expiredCount,
        totalSize,
        maxSize: this.maxCacheSize,
        utilizationPercent: Math.round((totalSize / this.maxCacheSize) * 100),
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        thumbnailCount: 0,
        expiredCount: 0,
        totalSize: 0,
        maxSize: this.maxCacheSize,
        utilizationPercent: 0,
      };
    }
  }

  // Private methods

  async _ensureDirectoryExists(dirPath) {
    const exists = await RNFS.exists(dirPath);
    if (!exists) {
      await RNFS.mkdir(dirPath);
    }
  }

  async _loadCacheMetadata() {
    try {
      const metadataJson = await AsyncStorage.getItem(this.metadataKey);
      this.cacheMetadata = metadataJson ? JSON.parse(metadataJson) : {};
    } catch (error) {
      console.warn('Failed to load cache metadata, starting fresh:', error);
      this.cacheMetadata = {};
    }
  }

  async _getCacheMetadata() {
    if (!this.cacheMetadata) {
      await this._loadCacheMetadata();
    }
    return this.cacheMetadata;
  }

  async _saveCacheMetadata() {
    try {
      await AsyncStorage.setItem(
        this.metadataKey,
        JSON.stringify(this.cacheMetadata),
      );
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  async _updateCacheEntry(entry) {
    this.cacheMetadata[entry.mediaId] = entry;
    await this._saveCacheMetadata();
  }

  async _removeCacheEntry(mediaId) {
    const entry = this.cacheMetadata[mediaId];
    if (entry && entry.thumbnailPath) {
      try {
        const exists = await RNFS.exists(entry.thumbnailPath);
        if (exists) {
          await RNFS.unlink(entry.thumbnailPath);
        }
      } catch (error) {
        console.warn(
          `Failed to remove cached file ${entry.thumbnailPath}:`,
          error,
        );
      }
    }

    delete this.cacheMetadata[mediaId];
    await this._saveCacheMetadata();
  }

  _isEntryExpired(entry) {
    return Date.now() - entry.cachedAt > this.cacheExpiry;
  }

  async _cleanupExpiredEntries() {
    const cacheMetadata = await this._getCacheMetadata();
    const expiredIds = [];

    for (const [mediaId, entry] of Object.entries(cacheMetadata)) {
      if (this._isEntryExpired(entry)) {
        expiredIds.push(mediaId);
      }
    }

    for (const mediaId of expiredIds) {
      await this._removeCacheEntry(mediaId);
    }

    if (expiredIds.length > 0) {
      console.log(`Cleaned up ${expiredIds.length} expired cache entries`);
    }
  }

  async _enforceCacheSizeLimit() {
    const cacheMetadata = await this._getCacheMetadata();
    const entries = Object.values(cacheMetadata);

    // Calculate total size
    let totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);

    if (totalSize <= this.maxCacheSize) {
      return;
    }

    // Sort by last accessed time (LRU)
    const sortedEntries = entries.sort(
      (a, b) => a.lastAccessed - b.lastAccessed,
    );

    // Remove oldest entries until under size limit
    let removedCount = 0;
    for (const entry of sortedEntries) {
      if (totalSize <= this.maxCacheSize) {
        break;
      }

      await this._removeCacheEntry(entry.mediaId);
      totalSize -= entry.size || 0;
      removedCount++;
    }

    if (removedCount > 0) {
      console.log(
        `Removed ${removedCount} cache entries to enforce size limit`,
      );
    }
  }
}

// Export singleton instance
export default new MediaCacheManager();
