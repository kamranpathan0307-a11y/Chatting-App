import API from './api';
import { generateMediaId, formatFileSize, getMediaTypeFromMime } from './media';
import fileCleanupManager from './FileCleanupManager';

/**
 * Upload status constants
 */
export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Upload error types
 */
export const UPLOAD_ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  FILE_TOO_LARGE: 'file_too_large',
  UNSUPPORTED_TYPE: 'unsupported_type',
  SERVER_ERROR: 'server_error',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
};

/**
 * MediaUploadService - Handles media upload with progress tracking, cancellation, and retry functionality
 */
class MediaUploadService {
  constructor() {
    this.activeUploads = new Map(); // Track active uploads
    this.uploadQueue = []; // Queue for pending uploads
    this.maxConcurrentUploads = 3; // Maximum concurrent uploads
    this.retryAttempts = 3; // Maximum retry attempts
  }

  /**
   * Upload media file with progress tracking
   * @param {Object} mediaAsset - Media asset to upload
   * @param {Function} onProgress - Progress callback function
   * @param {Function} onStatusChange - Status change callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadMedia(
    mediaAsset,
    onProgress = () => {},
    onStatusChange = () => {},
  ) {
    const uploadId = generateMediaId();

    try {
      // Validate media asset
      this._validateMediaAsset(mediaAsset);

      // Register temporary files for cleanup tracking
      if (mediaAsset.uri) {
        fileCleanupManager.registerTempFile(
          mediaAsset.uri,
          uploadId,
          'original',
        );
      }
      if (mediaAsset.thumbnail) {
        fileCleanupManager.registerTempFile(
          mediaAsset.thumbnail,
          uploadId,
          'thumbnail',
        );
      }

      // Create upload context
      const uploadContext = {
        id: uploadId,
        mediaAsset,
        status: UPLOAD_STATUS.PENDING,
        progress: 0,
        startTime: Date.now(),
        retryCount: 0,
        onProgress,
        onStatusChange,
        abortController: new AbortController(),
      };

      // Add to active uploads
      this.activeUploads.set(uploadId, uploadContext);

      // Update status to uploading
      this._updateUploadStatus(uploadContext, UPLOAD_STATUS.UPLOADING);

      // Perform the upload
      const result = await this._performUpload(uploadContext);

      // Update status to completed
      this._updateUploadStatus(uploadContext, UPLOAD_STATUS.COMPLETED);

      // Clean up temporary files after successful upload
      await fileCleanupManager.cleanupAfterSuccessfulUpload(uploadId);

      // Remove from active uploads
      this.activeUploads.delete(uploadId);

      return {
        success: true,
        uploadId,
        mediaUrl: result.mediaUrl,
        mediaId: result.mediaId,
        thumbnailUrl: result.thumbnailUrl,
      };
    } catch (error) {
      console.error('Upload failed:', error);

      const uploadContext = this.activeUploads.get(uploadId);
      if (uploadContext) {
        this._updateUploadStatus(uploadContext, UPLOAD_STATUS.FAILED, error);
        this.activeUploads.delete(uploadId);
      }

      // Clean up temporary files after failed upload
      await fileCleanupManager.cleanupAfterFailedUpload(uploadId);

      return {
        success: false,
        uploadId,
        error: this._formatError(error),
        errorType: this._getErrorType(error),
      };
    }
  }

  /**
   * Cancel an ongoing upload
   * @param {string} uploadId - Upload ID to cancel
   * @returns {boolean} Whether cancellation was successful
   */
  cancelUpload(uploadId) {
    const uploadContext = this.activeUploads.get(uploadId);

    if (!uploadContext) {
      console.warn(`Upload ${uploadId} not found or already completed`);
      return false;
    }

    try {
      // Abort the request
      uploadContext.abortController.abort();

      // Update status
      this._updateUploadStatus(uploadContext, UPLOAD_STATUS.CANCELLED);

      // Clean up temporary files for cancelled upload
      fileCleanupManager.cleanupAfterFailedUpload(uploadId);

      // Remove from active uploads
      this.activeUploads.delete(uploadId);

      console.log(`Upload ${uploadId} cancelled successfully`);
      return true;
    } catch (error) {
      console.error(`Error cancelling upload ${uploadId}:`, error);
      return false;
    }
  }

  /**
   * Retry a failed upload
   * @param {string} uploadId - Upload ID to retry
   * @param {Object} mediaAsset - Media asset to retry
   * @param {Function} onProgress - Progress callback
   * @param {Function} onStatusChange - Status change callback
   * @returns {Promise<Object>} Upload result
   */
  async retryUpload(
    uploadId,
    mediaAsset,
    onProgress = () => {},
    onStatusChange = () => {},
  ) {
    console.log(`Retrying upload ${uploadId}`);

    // Create new upload with same ID but fresh context
    return this.uploadMedia(mediaAsset, onProgress, onStatusChange);
  }

  /**
   * Get upload progress for a specific upload
   * @param {string} uploadId - Upload ID
   * @returns {Object|null} Upload progress info
   */
  getUploadProgress(uploadId) {
    const uploadContext = this.activeUploads.get(uploadId);

    if (!uploadContext) {
      return null;
    }

    const elapsed = Date.now() - uploadContext.startTime;
    const estimatedTotal =
      uploadContext.progress > 0 ? (elapsed / uploadContext.progress) * 100 : 0;
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);

    return {
      uploadId,
      status: uploadContext.status,
      progress: uploadContext.progress,
      elapsedTime: elapsed,
      estimatedTimeRemaining: estimatedRemaining,
      retryCount: uploadContext.retryCount,
    };
  }

  /**
   * Get all active uploads
   * @returns {Array} Array of active upload info
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.values()).map(context => ({
      uploadId: context.id,
      status: context.status,
      progress: context.progress,
      mediaType: getMediaTypeFromMime(context.mediaAsset.mimeType),
      fileName: context.mediaAsset.fileName,
      fileSize: context.mediaAsset.fileSize,
    }));
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads() {
    const uploadIds = Array.from(this.activeUploads.keys());
    uploadIds.forEach(uploadId => this.cancelUpload(uploadId));

    // Clean up any remaining temporary files
    fileCleanupManager.cleanupAllTempFiles();
  }

  /**
   * Perform the actual upload
   * @private
   */
  async _performUpload(uploadContext) {
    const { mediaAsset, abortController } = uploadContext;

    // Create FormData
    const formData = new FormData();
    formData.append('media', {
      uri: mediaAsset.uri,
      type: mediaAsset.mimeType,
      name: mediaAsset.fileName,
    });

    // Add metadata
    formData.append('mediaType', getMediaTypeFromMime(mediaAsset.mimeType));
    formData.append('originalName', mediaAsset.fileName);

    if (mediaAsset.width) formData.append('width', mediaAsset.width.toString());
    if (mediaAsset.height)
      formData.append('height', mediaAsset.height.toString());
    if (mediaAsset.duration)
      formData.append('duration', mediaAsset.duration.toString());

    // Determine upload endpoint based on media type
    const mediaType = getMediaTypeFromMime(mediaAsset.mimeType);
    const endpoint = `/media/upload/${mediaType}`;

    // Perform upload with progress tracking
    const response = await API.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: abortController.signal,
      onUploadProgress: progressEvent => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        this._updateProgress(uploadContext, progress);
      },
      timeout: 300000, // 5 minutes timeout for large files
    });

    return response.data;
  }

  /**
   * Validate media asset before upload
   * @private
   */
  _validateMediaAsset(mediaAsset) {
    if (!mediaAsset) {
      throw new Error('Media asset is required');
    }

    if (!mediaAsset.uri) {
      throw new Error('Media asset URI is required');
    }

    if (!mediaAsset.fileName) {
      throw new Error('Media asset filename is required');
    }

    if (!mediaAsset.mimeType) {
      throw new Error('Media asset MIME type is required');
    }

    if (!mediaAsset.fileSize || mediaAsset.fileSize <= 0) {
      throw new Error('Valid file size is required');
    }
  }

  /**
   * Update upload progress
   * @private
   */
  _updateProgress(uploadContext, progress) {
    uploadContext.progress = progress;
    uploadContext.onProgress(progress, uploadContext.id);
  }

  /**
   * Update upload status
   * @private
   */
  _updateUploadStatus(uploadContext, status, error = null) {
    uploadContext.status = status;
    uploadContext.onStatusChange(status, uploadContext.id, error);
  }

  /**
   * Format error for user display
   * @private
   */
  _formatError(error) {
    if (error.name === 'AbortError') {
      return 'Upload was cancelled';
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Upload timed out. Please check your connection and try again.';
    }

    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 413:
          return 'File is too large for upload';
        case 415:
          return 'File type is not supported';
        case 400:
          return message || 'Invalid file or request';
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return 'You do not have permission to upload files';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return message || `Upload failed with status ${status}`;
      }
    }

    if (error.request) {
      return 'Network error. Please check your connection and try again.';
    }

    return error.message || 'An unexpected error occurred during upload';
  }

  /**
   * Get error type for programmatic handling
   * @private
   */
  _getErrorType(error) {
    if (error.name === 'AbortError') {
      return UPLOAD_ERROR_TYPES.CANCELLED;
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return UPLOAD_ERROR_TYPES.NETWORK_ERROR;
    }

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 413:
          return UPLOAD_ERROR_TYPES.FILE_TOO_LARGE;
        case 415:
          return UPLOAD_ERROR_TYPES.UNSUPPORTED_TYPE;
        case 500:
        case 502:
        case 503:
        case 504:
          return UPLOAD_ERROR_TYPES.SERVER_ERROR;
        default:
          return UPLOAD_ERROR_TYPES.SERVER_ERROR;
      }
    }

    if (error.request) {
      return UPLOAD_ERROR_TYPES.NETWORK_ERROR;
    }

    return UPLOAD_ERROR_TYPES.UNKNOWN;
  }
}

// Create and export singleton instance
const mediaUploadService = new MediaUploadService();
export default mediaUploadService;

// Export class for testing
export { MediaUploadService };
