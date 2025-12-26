import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import UploadProgressIndicator from './UploadProgressIndicator';
import mediaUploadService, { UPLOAD_STATUS } from '../utils/MediaUploadService';

/**
 * UploadManager - Manages and displays multiple upload operations
 */
const UploadManager = ({
  visible = false,
  onClose,
  onRetryUpload,
  onCancelUpload,
  style,
}) => {
  const [activeUploads, setActiveUploads] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (!visible) return;

    // Update active uploads periodically
    const updateUploads = () => {
      const uploads = mediaUploadService.getActiveUploads();
      setActiveUploads(uploads);

      // Get detailed progress for each upload
      const progressData = {};
      uploads.forEach(upload => {
        const progress = mediaUploadService.getUploadProgress(upload.uploadId);
        if (progress) {
          progressData[upload.uploadId] = progress;
        }
      });
      setUploadProgress(progressData);
    };

    // Initial update
    updateUploads();

    // Set up periodic updates
    const interval = setInterval(updateUploads, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleRetry = uploadId => {
    if (onRetryUpload) {
      onRetryUpload(uploadId);
    }
  };

  const handleCancel = uploadId => {
    mediaUploadService.cancelUpload(uploadId);
    if (onCancelUpload) {
      onCancelUpload(uploadId);
    }
  };

  const handleCancelAll = () => {
    mediaUploadService.cancelAllUploads();
    if (onCancelUpload) {
      activeUploads.forEach(upload => onCancelUpload(upload.uploadId));
    }
  };

  const getUploadCounts = () => {
    const counts = {
      uploading: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    activeUploads.forEach(upload => {
      switch (upload.status) {
        case UPLOAD_STATUS.UPLOADING:
        case UPLOAD_STATUS.PENDING:
          counts.uploading++;
          break;
        case UPLOAD_STATUS.COMPLETED:
          counts.completed++;
          break;
        case UPLOAD_STATUS.FAILED:
          counts.failed++;
          break;
        case UPLOAD_STATUS.CANCELLED:
          counts.cancelled++;
          break;
      }
    });

    return counts;
  };

  const counts = getUploadCounts();
  const hasActiveUploads = activeUploads.length > 0;
  const hasUploadingFiles = counts.uploading > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Manager</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {hasActiveUploads && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {counts.uploading > 0 && `${counts.uploading} uploading`}
              {counts.completed > 0 &&
                (counts.uploading > 0
                  ? `, ${counts.completed} completed`
                  : `${counts.completed} completed`)}
              {counts.failed > 0 && `, ${counts.failed} failed`}
            </Text>

            {hasUploadingFiles && (
              <TouchableOpacity
                onPress={handleCancelAll}
                style={styles.cancelAllButton}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelAllText}>Cancel All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Upload List */}
        <ScrollView
          style={styles.uploadList}
          contentContainerStyle={styles.uploadListContent}
          showsVerticalScrollIndicator={false}
        >
          {hasActiveUploads ? (
            activeUploads.map(upload => {
              const progress = uploadProgress[upload.uploadId];
              return (
                <UploadProgressIndicator
                  key={upload.uploadId}
                  uploadId={upload.uploadId}
                  status={upload.status}
                  progress={upload.progress}
                  fileName={upload.fileName}
                  fileSize={upload.fileSize}
                  elapsedTime={progress?.elapsedTime}
                  estimatedTimeRemaining={progress?.estimatedTimeRemaining}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  style={styles.uploadItem}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Active Uploads</Text>
              <Text style={styles.emptyStateText}>
                Upload progress will appear here when you share media files.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  cancelAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelAllText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
  },
  uploadList: {
    flex: 1,
  },
  uploadListContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  uploadItem: {
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default memo(UploadManager);
