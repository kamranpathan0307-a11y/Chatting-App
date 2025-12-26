const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * FileCleanupService - Handles cleanup of temporary files on the server
 * Manages temporary files created during media processing and ensures proper cleanup
 * after successful uploads, failed uploads, and during regular maintenance.
 */
class FileCleanupService {
  constructor() {
    this.tempFiles = new Map(); // Track temporary files with metadata
    this.processingFiles = new Map(); // Track files currently being processed
    this.cleanupQueue = new Set(); // Queue for cleanup operations
    this.isCleaningUp = false;
    this.cleanupInterval = null;
    
    // Start periodic cleanup
    this._startPeriodicCleanup();
    
    // Handle process termination
    this._setupProcessHandlers();
  }

  /**
   * Register a temporary file for cleanup tracking
   * @param {string} filePath - Path to temporary file
   * @param {string} uploadId - Upload ID associated with file
   * @param {string} type - Type of temporary file (original, compressed, thumbnail, etc.)
   * @param {number} maxAge - Maximum age in milliseconds before auto-cleanup
   */
  registerTempFile(filePath, uploadId = null, type = 'temp', maxAge = 60 * 60 * 1000) {
    if (!filePath) return;

    console.log(`Registering temp file: ${filePath} (type: ${type}, uploadId: ${uploadId})`);
    
    const fileInfo = {
      path: filePath,
      uploadId,
      type,
      createdAt: Date.now(),
      maxAge,
      size: this._getFileSize(filePath),
    };

    this.tempFiles.set(filePath, fileInfo);
  }

  /**
   * Register a file as currently being processed
   * @param {string} filePath - Path to file being processed
   * @param {string} operation - Type of operation (compress, thumbnail, etc.)
   */
  registerProcessingFile(filePath, operation = 'processing') {
    console.log(`Registering processing file: ${filePath} (operation: ${operation})`);
    
    this.processingFiles.set(filePath, {
      path: filePath,
      operation,
      startedAt: Date.now(),
    });
  }

  /**
   * Unregister a file from processing (when operation completes)
   * @param {string} filePath - Path to file that finished processing
   */
  unregisterProcessingFile(filePath) {
    if (this.processingFiles.has(filePath)) {
      console.log(`Unregistering processing file: ${filePath}`);
      this.processingFiles.delete(filePath);
    }
  }

  /**
   * Clean up temporary files after successful upload
   * @param {string} uploadId - Upload ID to clean up files for
   * @param {boolean} keepOriginal - Whether to keep the original uploaded file
   */
  async cleanupAfterSuccessfulUpload(uploadId, keepOriginal = true) {
    if (!uploadId) return;

    console.log(`Cleaning up files after successful upload: ${uploadId}`);

    const filesToCleanup = Array.from(this.tempFiles.values()).filter(
      fileInfo => fileInfo.uploadId === uploadId
    );

    if (filesToCleanup.length === 0) {
      console.log(`No temp files found for upload ${uploadId}`);
      return;
    }

    const cleanupPromises = filesToCleanup
      .filter(fileInfo => {
        // Keep original file if requested and it's the original upload
        if (keepOriginal && fileInfo.type === 'original') {
          return false;
        }
        return true;
      })
      .map(fileInfo => this._cleanupSingleFile(fileInfo.path, 'successful_upload'));

    try {
      const results = await Promise.allSettled(cleanupPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Upload ${uploadId} cleanup: ${successful} successful, ${failed} failed`);
      
      // Remove cleaned files from tracking
      filesToCleanup.forEach(fileInfo => {
        if (!keepOriginal || fileInfo.type !== 'original') {
          this.tempFiles.delete(fileInfo.path);
        }
      });
      
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

    const filesToCleanup = Array.from(this.tempFiles.values()).filter(
      fileInfo => fileInfo.uploadId === uploadId
    );

    if (filesToCleanup.length === 0) {
      console.log(`No temp files found for failed upload ${uploadId}`);
      return;
    }

    const cleanupPromises = filesToCleanup.map(fileInfo =>
      this._cleanupSingleFile(fileInfo.path, 'failed_upload')
    );

    try {
      const results = await Promise.allSettled(cleanupPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Failed upload ${uploadId} cleanup: ${successful} successful, ${failed} failed`);
      
      // Remove all files from tracking
      filesToCleanup.forEach(fileInfo => {
        this.tempFiles.delete(fileInfo.path);
      });
      
    } catch (error) {
      console.error(`Error during cleanup for failed upload ${uploadId}:`, error);
    }
  }

  /**
   * Clean up processing files that have been stuck for too long
   * @param {number} maxProcessingTime - Maximum processing time in milliseconds
   */
  async cleanupStuckProcessingFiles(maxProcessingTime = 10 * 60 * 1000) {
    const now = Date.now();
    const stuckFiles = Array.from(this.processingFiles.values()).filter(
      fileInfo => now - fileInfo.startedAt > maxProcessingTime
    );

    if (stuckFiles.length === 0) {
      console.log('No stuck processing files found');
      return;
    }

    console.log(`Cleaning up ${stuckFiles.length} stuck processing files`);

    const cleanupPromises = stuckFiles.map(fileInfo =>
      this._cleanupSingleFile(fileInfo.path, 'stuck_processing')
    );

    try {
      await Promise.allSettled(cleanupPromises);
      
      // Remove from processing tracking
      stuckFiles.forEach(fileInfo => {
        this.processingFiles.delete(fileInfo.path);
      });
      
      console.log(`Successfully cleaned up ${stuckFiles.length} stuck processing files`);
    } catch (error) {
      console.error('Error cleaning up stuck processing files:', error);
    }
  }

  /**
   * Clean up old temporary files based on age
   * @param {number} maxAge - Maximum age in milliseconds
   */
  async cleanupOldTempFiles(maxAge = null) {
    const now = Date.now();
    const oldFiles = Array.from(this.tempFiles.values()).filter(fileInfo => {
      const fileMaxAge = maxAge || fileInfo.maxAge;
      return now - fileInfo.createdAt > fileMaxAge;
    });

    if (oldFiles.length === 0) {
      console.log('No old temporary files to clean up');
      return;
    }

    console.log(`Cleaning up ${oldFiles.length} old temporary files`);

    const cleanupPromises = oldFiles.map(fileInfo =>
      this._cleanupSingleFile(fileInfo.path, 'old_file')
    );

    try {
      const results = await Promise.allSettled(cleanupPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Old files cleanup: ${successful} successful, ${failed} failed`);
      
      // Remove cleaned files from tracking
      oldFiles.forEach(fileInfo => {
        this.tempFiles.delete(fileInfo.path);
      });
      
    } catch (error) {
      console.error('Error cleaning up old temporary files:', error);
    }
  }

  /**
   * Clean up orphaned files in upload directories
   * @param {Array} uploadDirs - Array of upload directory paths to check
   * @param {number} maxAge - Maximum age for orphaned files in milliseconds
   */
  async cleanupOrphanedFiles(uploadDirs = [], maxAge = 24 * 60 * 60 * 1000) {
    const defaultDirs = [
      'uploads/temp',
      'uploads/processing',
      path.join(require('os').tmpdir(), 'media-uploads'),
    ];
    
    const dirsToCheck = [...defaultDirs, ...uploadDirs];
    
    console.log(`Checking for orphaned files in ${dirsToCheck.length} directories`);

    for (const dir of dirsToCheck) {
      try {
        await this._cleanupOrphanedFilesInDirectory(dir, maxAge);
      } catch (error) {
        console.warn(`Error cleaning orphaned files in ${dir}:`, error.message);
      }
    }
  }

  /**
   * Clean up all temporary files (used on server shutdown)
   */
  async cleanupAllTempFiles() {
    if (this.isCleaningUp) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }

    this.isCleaningUp = true;
    console.log(`Starting cleanup of ${this.tempFiles.size} temporary files`);

    const cleanupPromises = Array.from(this.tempFiles.values()).map(fileInfo =>
      this._cleanupSingleFile(fileInfo.path, 'server_shutdown')
    );

    try {
      const results = await Promise.allSettled(cleanupPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Complete cleanup: ${successful} successful, ${failed} failed`);
      
      // Clear all tracking
      this.tempFiles.clear();
      this.processingFiles.clear();
      this.cleanupQueue.clear();
      
    } catch (error) {
      console.error('Error during complete cleanup:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Get cleanup statistics
   * @returns {Object} Cleanup statistics
   */
  getCleanupStats() {
    const totalTempFiles = this.tempFiles.size;
    const totalProcessingFiles = this.processingFiles.size;
    const queuedCleanups = this.cleanupQueue.size;

    const filesByType = {};
    const totalSize = Array.from(this.tempFiles.values()).reduce((sum, fileInfo) => {
      filesByType[fileInfo.type] = (filesByType[fileInfo.type] || 0) + 1;
      return sum + (fileInfo.size || 0);
    }, 0);

    return {
      totalTempFiles,
      totalProcessingFiles,
      queuedCleanups,
      filesByType,
      totalSize: this._formatFileSize(totalSize),
      isCleaningUp: this.isCleaningUp,
    };
  }

  /**
   * Start periodic cleanup process
   * @private
   */
  _startPeriodicCleanup() {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('Running periodic cleanup...');
        await this.cleanupOldTempFiles();
        await this.cleanupStuckProcessingFiles();
        await this.cleanupOrphanedFiles();
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Setup process handlers for graceful shutdown
   * @private
   */
  _setupProcessHandlers() {
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}, performing cleanup before shutdown...`);
      
      // Stop periodic cleanup
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      
      // Perform final cleanup
      await this.cleanupAllTempFiles();
      
      console.log('Cleanup completed, shutting down...');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
  }

  /**
   * Clean up a single file
   * @private
   */
  async _cleanupSingleFile(filePath, reason = 'manual') {
    try {
      const exists = await this._fileExists(filePath);
      if (!exists) {
        console.log(`File already removed: ${filePath}`);
        return { success: true, reason: 'already_removed' };
      }

      await fs.unlink(filePath);
      console.log(`Cleaned up temp file (${reason}): ${filePath}`);
      
      return { success: true, reason };
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
      return { success: false, error: error.message, reason };
    }
  }

  /**
   * Clean up orphaned files in a specific directory
   * @private
   */
  async _cleanupOrphanedFilesInDirectory(dirPath, maxAge) {
    try {
      const exists = await this._fileExists(dirPath);
      if (!exists) {
        return;
      }

      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(dirPath, file.name);
          
          try {
            const stats = await fs.stat(filePath);
            const age = now - stats.mtime.getTime();
            
            if (age > maxAge) {
              await fs.unlink(filePath);
              cleanedCount++;
              console.log(`Removed orphaned file: ${filePath}`);
            }
          } catch (error) {
            console.warn(`Error processing orphaned file ${filePath}:`, error.message);
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} orphaned files in ${dirPath}`);
      }
      
    } catch (error) {
      console.error(`Error cleaning orphaned files in ${dirPath}:`, error);
    }
  }

  /**
   * Check if file exists
   * @private
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size synchronously
   * @private
   */
  _getFileSize(filePath) {
    try {
      const stats = fsSync.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
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
   * Cleanup resources and stop periodic cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Perform final cleanup
    this.cleanupAllTempFiles();
  }
}

// Create and export singleton instance
const fileCleanupService = new FileCleanupService();

module.exports = fileCleanupService;