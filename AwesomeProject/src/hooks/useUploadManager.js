import { useState, useEffect, useCallback, useRef } from 'react';
import mediaUploadService, { UPLOAD_STATUS } from '../utils/MediaUploadService';

/**
 * Custom hook for managing media uploads
 */
export const useUploadManager = () => {
  const [uploads, setUploads] = useState(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const uploadCallbacksRef = useRef(new Map());

  // Update upload state
  const updateUpload = useCallback((uploadId, updates) => {
    setUploads(prev => {
      const newUploads = new Map(prev);
      const existing = newUploads.get(uploadId) || {};
      newUploads.set(uploadId, { ...existing, ...updates });
      return newUploads;
    });
  }, []);

  // Remove upload from state
  const removeUpload = useCallback(uploadId => {
    setUploads(prev => {
      const newUploads = new Map(prev);
      newUploads.delete(uploadId);
      return newUploads;
    });
    uploadCallbacksRef.current.delete(uploadId);
  }, []);

  // Progress callback
  const handleProgress = useCallback(
    (progress, uploadId) => {
      updateUpload(uploadId, { progress });
    },
    [updateUpload],
  );

  // Status change callback
  const handleStatusChange = useCallback(
    (status, uploadId, error) => {
      updateUpload(uploadId, { status, error });

      // Update global uploading state
      const hasActiveUploads = Array.from(uploads.values()).some(
        upload =>
          upload.status === UPLOAD_STATUS.UPLOADING ||
          upload.status === UPLOAD_STATUS.PENDING,
      );
      setIsUploading(hasActiveUploads);

      // Call custom callback if provided
      const callbacks = uploadCallbacksRef.current.get(uploadId);
      if (callbacks?.onStatusChange) {
        callbacks.onStatusChange(status, uploadId, error);
      }

      // Auto-remove completed uploads after delay
      if (status === UPLOAD_STATUS.COMPLETED) {
        setTimeout(() => {
          removeUpload(uploadId);
        }, 3000);
      }
    },
    [updateUpload, uploads, removeUpload],
  );

  // Start upload
  const startUpload = useCallback(
    async (mediaAsset, callbacks = {}) => {
      try {
        // Store callbacks for this upload
        const uploadId = `upload_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        uploadCallbacksRef.current.set(uploadId, callbacks);

        // Initialize upload state
        updateUpload(uploadId, {
          mediaAsset,
          status: UPLOAD_STATUS.PENDING,
          progress: 0,
          startTime: Date.now(),
        });

        setIsUploading(true);

        // Start the upload
        const result = await mediaUploadService.uploadMedia(
          mediaAsset,
          (progress, id) => handleProgress(progress, id || uploadId),
          (status, id, error) =>
            handleStatusChange(status, id || uploadId, error),
        );

        // Call success callback
        if (result.success && callbacks.onSuccess) {
          callbacks.onSuccess(result);
        }

        // Call error callback
        if (!result.success && callbacks.onError) {
          callbacks.onError(result.error, result.errorType);
        }

        return result;
      } catch (error) {
        console.error('Upload failed:', error);

        if (callbacks.onError) {
          callbacks.onError(error.message, 'unknown');
        }

        return {
          success: false,
          error: error.message,
          errorType: 'unknown',
        };
      }
    },
    [updateUpload, handleProgress, handleStatusChange],
  );

  // Cancel upload
  const cancelUpload = useCallback(
    uploadId => {
      const success = mediaUploadService.cancelUpload(uploadId);
      if (success) {
        removeUpload(uploadId);
      }
      return success;
    },
    [removeUpload],
  );

  // Retry upload
  const retryUpload = useCallback(
    async (uploadId, callbacks = {}) => {
      const upload = uploads.get(uploadId);
      if (!upload || !upload.mediaAsset) {
        console.warn(
          `Cannot retry upload ${uploadId}: upload not found or missing media asset`,
        );
        return false;
      }

      // Remove old upload and start new one
      removeUpload(uploadId);
      return startUpload(upload.mediaAsset, callbacks);
    },
    [uploads, removeUpload, startUpload],
  );

  // Cancel all uploads
  const cancelAllUploads = useCallback(() => {
    mediaUploadService.cancelAllUploads();
    setUploads(new Map());
    uploadCallbacksRef.current.clear();
    setIsUploading(false);
  }, []);

  // Get upload by ID
  const getUpload = useCallback(
    uploadId => {
      return uploads.get(uploadId);
    },
    [uploads],
  );

  // Get all uploads as array
  const getAllUploads = useCallback(() => {
    return Array.from(uploads.entries()).map(([id, upload]) => ({
      id,
      ...upload,
    }));
  }, [uploads]);

  // Get uploads by status
  const getUploadsByStatus = useCallback(
    status => {
      return getAllUploads().filter(upload => upload.status === status);
    },
    [getAllUploads],
  );

  // Check if any uploads are active
  const hasActiveUploads = useCallback(() => {
    return Array.from(uploads.values()).some(
      upload =>
        upload.status === UPLOAD_STATUS.UPLOADING ||
        upload.status === UPLOAD_STATUS.PENDING,
    );
  }, [uploads]);

  // Get upload statistics
  const getUploadStats = useCallback(() => {
    const allUploads = getAllUploads();
    return {
      total: allUploads.length,
      uploading: allUploads.filter(u => u.status === UPLOAD_STATUS.UPLOADING)
        .length,
      pending: allUploads.filter(u => u.status === UPLOAD_STATUS.PENDING)
        .length,
      completed: allUploads.filter(u => u.status === UPLOAD_STATUS.COMPLETED)
        .length,
      failed: allUploads.filter(u => u.status === UPLOAD_STATUS.FAILED).length,
      cancelled: allUploads.filter(u => u.status === UPLOAD_STATUS.CANCELLED)
        .length,
    };
  }, [getAllUploads]);

  // Update isUploading when uploads change
  useEffect(() => {
    const activeUploads = hasActiveUploads();
    setIsUploading(activeUploads);
  }, [uploads, hasActiveUploads]);

  return {
    // State
    uploads: getAllUploads(),
    isUploading,

    // Actions
    startUpload,
    cancelUpload,
    retryUpload,
    cancelAllUploads,

    // Getters
    getUpload,
    getAllUploads,
    getUploadsByStatus,
    hasActiveUploads,
    getUploadStats,
  };
};

export default useUploadManager;
