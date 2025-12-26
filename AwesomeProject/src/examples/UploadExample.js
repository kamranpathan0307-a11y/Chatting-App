import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useUploadManager } from '../hooks/useUploadManager';
import UploadProgressIndicator from '../components/UploadProgressIndicator';
import UploadManager from '../components/UploadManager';
import UploadStatusBadge from '../components/UploadStatusBadge';

/**
 * Example component showing how to use the upload system
 */
const UploadExample = () => {
  const [showUploadManager, setShowUploadManager] = useState(false);
  const {
    uploads,
    isUploading,
    startUpload,
    cancelUpload,
    retryUpload,
    getUploadStats,
  } = useUploadManager();

  const handleStartUpload = async () => {
    // Example media asset (normally this would come from image picker, camera, etc.)
    const mockMediaAsset = {
      uri: 'file://path/to/image.jpg',
      fileName: 'example-image.jpg',
      fileSize: 1024 * 1024, // 1MB
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
    };

    const result = await startUpload(mockMediaAsset, {
      onSuccess: result => {
        Alert.alert('Success', `Upload completed: ${result.mediaUrl}`);
      },
      onError: (error, errorType) => {
        Alert.alert('Upload Failed', error);
      },
      onStatusChange: (status, uploadId, error) => {
        console.log(`Upload ${uploadId} status changed to: ${status}`);
      },
    });

    if (!result.success) {
      Alert.alert('Upload Failed', result.error);
    }
  };

  const handleRetry = async uploadId => {
    const result = await retryUpload(uploadId, {
      onSuccess: result => {
        Alert.alert('Success', 'Upload completed after retry');
      },
      onError: error => {
        Alert.alert('Retry Failed', error);
      },
    });

    if (!result.success) {
      Alert.alert('Retry Failed', result.error);
    }
  };

  const stats = getUploadStats();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload System Example</Text>

      {/* Upload Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total: {stats.total} | Uploading: {stats.uploading} | Completed:{' '}
          {stats.completed} | Failed: {stats.failed}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartUpload}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Start Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setShowUploadManager(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Show Upload Manager
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upload List */}
      <View style={styles.uploadList}>
        {uploads.map(upload => (
          <View key={upload.id} style={styles.uploadItem}>
            <UploadProgressIndicator
              uploadId={upload.id}
              status={upload.status}
              progress={upload.progress}
              fileName={upload.mediaAsset?.fileName || 'Unknown file'}
              fileSize={upload.mediaAsset?.fileSize || 0}
              onCancel={cancelUpload}
              onRetry={handleRetry}
              error={upload.error}
            />

            {/* Example of compact status badge */}
            <UploadStatusBadge
              status={upload.status}
              progress={upload.progress}
              uploadId={upload.id}
              onRetry={handleRetry}
              onCancel={cancelUpload}
              compact={true}
              style={styles.statusBadge}
            />
          </View>
        ))}
      </View>

      {/* Upload Manager Modal */}
      <UploadManager
        visible={showUploadManager}
        onClose={() => setShowUploadManager(false)}
        onRetryUpload={handleRetry}
        onCancelUpload={cancelUpload}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  statsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  uploadList: {
    flex: 1,
  },
  uploadItem: {
    marginBottom: spacing.md,
  },
  statusBadge: {
    marginTop: spacing.sm,
  },
});

export default UploadExample;
