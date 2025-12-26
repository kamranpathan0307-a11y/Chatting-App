import RNFS from 'react-native-fs';
import { AppState } from 'react-native';

/**
 * FileCleanupManager - Handles cleanup of temporary files throughout the app lifecycle
 * Manages temporary files created during media operations and ensures proper cleanup
 * after successful uploads, failed uploads, and app termination.
 */
class FileCleanupManager {
  constructor() {
    this.tempFiles = new Set(); // Track temporary files
    this.uploadFiles = new Map(); // Track files associated with uploads
    this.cleanupQueue = new Set(); // Queue for cleanup operations
    this.isCleaningUp = false;
    this.appStateSubscription = null;

    // Initialize app state listener for cleanup on app termination
    this._initializeAppStateListener();
  }

  /**
   * Register a temporary file for cleanup tracking
   * @param {string} filePath - Path to temporary file
   * @param {string} uploadId - Optional upload ID to associate with file
   * @param {string} type - Type of temporary file (cache, processed, compressed, etc.)
   */
  registerTempFile(filePath, uploadId = null, type = 'temp') {
    if (!filePath) return;

    console.log(`Registering temp file: ${filePath} (type: ${type})`);

    this.tempFiles.add({
      path: filePath,
      uploadId,
      type,
      createdAt: Date.now(),
    });

    if (uploadId) {
      if (!this.uploadFiles.has(uploadId)) {
        this.uploadFiles.set(uploadId, new Set());
      }
      this.uploadFiles.get(uploadId).add(filePath);
    }
  }

  /**
   * Clean up temporary files after successful upload
   * @param {string} uploadId - Upload ID to clean up files for
   */
  async cleanupAfterSuccessfulUpload(uploadId) {
    if (!uploadId) return;

    console.log(`Cleaning up files after successful upload: ${uploadId}`);

    const filesToCleanup = this.uploadFiles.get(uploadId);
    if (!filesToCleanup) return;

    const cleanupPromises = Array.from(filesToCleanup).map(filePath =>
      this._cleanupSingleFile(filePath, 'successful_upload'),
    );

    try {
      await Promise.allSettled(cleanupPromises);

      // Remove from tracking
      this.uploadFiles.delete(uploadId);
      this._removeFromTempFiles(uploadId);

      console.log(
        `Successfully cleaned up ${filesToCleanup.size} files for upload ${uploadId}`,
      );
    } catch (error) {
      console.error(`Error during cleanup for upload ${uploadId}:`, error);
    }
  }

  /**
   * Clean up temporary files after failed upload
   * @param {string} uploadId - Upload ID to clean up files for
   */
  async cleanupAfterFailedUpload(uploadId) {
    if (!uploadId) return;

    console.log(`Cleaning up files after failed upload: ${uploadId}`);

    const filesToCleanup = this.uploadFiles.get(uploadId);
    if (!filesToCleanup) return;

    const cleanupPromises = Array.from(filesToCleanup).map(filePath =>
      this._cleanupSingleFile(filePath, 'failed_upload'),
    );

    try {
      await Promise.allSettled(cleanupPromises);

      // Remove from tracking
      this.uploadFiles.delete(uploadId);
      this._removeFromTempFiles(uploadId);

      console.log(
        `Successfully cleaned up ${filesToCleanup.size} files for failed upload ${uploadId}`,
      );
    } catch (error) {
      console.error(
        `Error during cleanup for failed upload ${uploadId}:`,
        error,
      );
    }
  }

  /**
   * Clean up all temporary files (used on app termination)
   */
  async cleanupAllTempFiles() {
    if (this.isCleaningUp) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }

    this.isCleaningUp = true;
    console.log(`Starting cleanup of ${this.tempFiles.size} temporary files`);

    const cleanupPromises = Array.from(this.tempFiles).map(fileInfo =>
      this._cleanupSingleFile(fileInfo.path, 'app_termination'),
    );

    try {
      const results = await Promise.allSettled(cleanupPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(
        `Cleanup completed: ${successful} successful, ${failed} failed`,
      );

      // Clear all tracking
      this.tempFiles.clear();
      this.uploadFiles.clear();
      this.cleanupQueue.clear();
    } catch (error) {
      console.error('Error during complete cleanup:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Clean up old temporary files (older than specified age)
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  async cleanupOldTempFiles(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    const oldFiles = Array.from(this.tempFiles).filter(
      fileInfo => now - fileInfo.createdAt > maxAge,
    );

    if (oldFiles.length === 0) {
      console.log('No old temporary files to clean up');
      return;
    }

    console.log(`Cleaning up ${oldFiles.length} old temporary files`);

    const cleanupPromises = oldFiles.map(fileInfo =>
      this._cleanupSingleFile(fileInfo.path, 'old_file'),
    );

    try {
      await Promise.allSettled(cleanupPromises);

      // Remove cleaned files from tracking
      oldFiles.forEach(fileInfo => {
        this.tempFiles.delete(fileInfo);
      });

      console.log(
        `Successfully cleaned up ${oldFiles.length} old temporary files`,
      );
    } catch (error) {
      console.error('Error cleaning up old temporary files:', error);
    }
  }

  /**
   * Clean up cache directory
   * @param {number} maxSize - Maximum cache size in bytes (default: 100MB)
   */
  async cleanupCacheDirectory(maxSize = 100 * 1024 * 1024) {
    try {
      const cacheDir = RNFS.CachesDirectoryPath;
      const exists = await RNFS.exists(cacheDir);

      if (!exists) {
        console.log('Cache directory does not exist');
        return;
      }

      // Get cache directory size
      const dirStats = await this._getDirectorySize(cacheDir);

      if (dirStats.size <= maxSize) {
        console.log(
          `Cache size (${this._formatFileSize(dirStats.size)}) is within limit`,
        );
        return;
      }

      console.log(
        `Cache size (${this._formatFileSize(
          dirStats.size,
        )}) exceeds limit, cleaning up...`,
      );

      // Get all files sorted by last modified (oldest first)
      const files = await this._getFilesRecursively(cacheDir);
      const sortedFiles = files.sort((a, b) => a.mtime - b.mtime);

      let currentSize = dirStats.size;
      let cleanedCount = 0;

      // Remove oldest files until we're under the size limit
      for (const file of sortedFiles) {
        if (currentSize <= maxSize) break;

        try {
          await RNFS.unlink(file.path);
          currentSize -= file.size;
          cleanedCount++;
          console.log(`Removed cache file: ${file.path}`);
        } catch (error) {
          console.warn(
            `Failed to remove cache file ${file.path}:`,
            error.message,
          );
        }
      }

      console.log(
        `Cache cleanup completed: removed ${cleanedCount} files, saved ${this._formatFileSize(
          dirStats.size - currentSize,
        )}`,
      );
    } catch (error) {
      console.error('Error cleaning up cache directory:', error);
    }
  }

  /**
   * Get cleanup statistics
   * @returns {Object} Cleanup statistics
   */
  getCleanupStats() {
    const totalTempFiles = this.tempFiles.size;
    const totalUploads = this.uploadFiles.size;
    const queuedCleanups = this.cleanupQueue.size;

    const filesByType = {};
    Array.from(this.tempFiles).forEach(fileInfo => {
      filesByType[fileInfo.type] = (filesByType[fileInfo.type] || 0) + 1;
    });

    return {
      totalTempFiles,
      totalUploads,
      queuedCleanups,
      filesByType,
      isCleaningUp: this.isCleaningUp,
    };
  }

  /**
   * Initialize app state listener for cleanup on app termination
   * @private
   */
  _initializeAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          // Clean up old temp files when app goes to background
          this.cleanupOldTempFiles();
        }
      },
    );
  }

  /**
   * Clean up a single file
   * @private
   */
  async _cleanupSingleFile(filePath, reason = 'manual') {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        console.log(`File already removed: ${filePath}`);
        return { success: true, reason: 'already_removed' };
      }

      await RNFS.unlink(filePath);
      console.log(`Cleaned up temp file (${reason}): ${filePath}`);

      return { success: true, reason };
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
      return { success: false, error: error.message, reason };
    }
  }

  /**
   * Remove files from temp tracking by upload ID
   * @private
   */
  _removeFromTempFiles(uploadId) {
    const filesToRemove = Array.from(this.tempFiles).filter(
      fileInfo => fileInfo.uploadId === uploadId,
    );

    filesToRemove.forEach(fileInfo => {
      this.tempFiles.delete(fileInfo);
    });
  }

  /**
   * Get directory size recursively
   * @private
   */
  async _getDirectorySize(dirPath) {
    try {
      const files = await this._getFilesRecursively(dirPath);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      return {
        size: totalSize,
        fileCount: files.length,
      };
    } catch (error) {
      console.error(`Error getting directory size for ${dirPath}:`, error);
      return { size: 0, fileCount: 0 };
    }
  }

  /**
   * Get all files in directory recursively
   * @private
   */
  async _getFilesRecursively(dirPath) {
    const files = [];

    try {
      const items = await RNFS.readDir(dirPath);

      for (const item of items) {
        if (item.isFile()) {
          files.push({
            path: item.path,
            size: item.size,
            mtime: new Date(item.mtime).getTime(),
          });
        } else if (item.isDirectory()) {
          const subFiles = await this._getFilesRecursively(item.path);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dirPath}:`, error.message);
    }

    return files;
  }

  /**
   * Format file size for display
   * @private
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup resources and remove listeners
   */
  destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Perform final cleanup
    this.cleanupAllTempFiles();
  }
}

// Create and export singleton instance
const fileCleanupManager = new FileCleanupManager();

export default fileCleanupManager;

// Export class for testing
export { FileCleanupManager };
