import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { UPLOAD_STATUS } from '../utils/MediaUploadService';
import { formatFileSize } from '../utils/media';

/**
 * UploadProgressIndicator - Shows upload progress with percentage and time estimates
 */
const UploadProgressIndicator = ({
  uploadId,
  status,
  progress = 0,
  fileName,
  fileSize,
  elapsedTime = 0,
  estimatedTimeRemaining = 0,
  onCancel,
  onRetry,
  error,
  style,
}) => {
  const progressAnim = React.useRef(new Animated.Value(progress)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const formatTime = milliseconds => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case UPLOAD_STATUS.PENDING:
        return 'Preparing upload...';
      case UPLOAD_STATUS.UPLOADING:
        return `Uploading... ${Math.round(progress)}%`;
      case UPLOAD_STATUS.COMPLETED:
        return 'Upload completed';
      case UPLOAD_STATUS.FAILED:
        return 'Upload failed';
      case UPLOAD_STATUS.CANCELLED:
        return 'Upload cancelled';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case UPLOAD_STATUS.UPLOADING:
        return colors.primary;
      case UPLOAD_STATUS.COMPLETED:
        return colors.success;
      case UPLOAD_STATUS.FAILED:
        return colors.error;
      case UPLOAD_STATUS.CANCELLED:
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const showProgressBar =
    status === UPLOAD_STATUS.UPLOADING || status === UPLOAD_STATUS.PENDING;
  const showRetryButton = status === UPLOAD_STATUS.FAILED && onRetry;
  const showCancelButton =
    (status === UPLOAD_STATUS.UPLOADING || status === UPLOAD_STATUS.PENDING) &&
    onCancel;

  return (
    <View style={[styles.container, style]}>
      {/* File Info */}
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {fileName}
        </Text>
        <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>
      </View>

      {/* Status and Progress */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>

        {status === UPLOAD_STATUS.UPLOADING && estimatedTimeRemaining > 0 && (
          <Text style={styles.timeText}>
            {formatTime(estimatedTimeRemaining)} remaining
          </Text>
        )}

        {error && status === UPLOAD_STATUS.FAILED && (
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      {showProgressBar && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {(showRetryButton || showCancelButton) && (
        <View style={styles.actionButtons}>
          {showRetryButton && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={() => onRetry(uploadId)}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}

          {showCancelButton && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => onCancel(uploadId)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  fileInfo: {
    marginBottom: spacing.sm,
  },
  fileName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  fileSize: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusContainer: {
    marginBottom: spacing.sm,
  },
  statusText: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs / 2,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default memo(UploadProgressIndicator);
