import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { UPLOAD_STATUS } from '../utils/MediaUploadService';

/**
 * UploadStatusBadge - Compact status indicator for media messages
 */
const UploadStatusBadge = ({
  status,
  progress = 0,
  onRetry,
  onCancel,
  uploadId,
  compact = false,
  style,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case UPLOAD_STATUS.PENDING:
      case UPLOAD_STATUS.UPLOADING:
        return (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.spinner}
          />
        );
      case UPLOAD_STATUS.COMPLETED:
        return <Text style={styles.successIcon}>✓</Text>;
      case UPLOAD_STATUS.FAILED:
        return <Text style={styles.errorIcon}>✗</Text>;
      case UPLOAD_STATUS.CANCELLED:
        return <Text style={styles.cancelledIcon}>⊘</Text>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (compact) {
      switch (status) {
        case UPLOAD_STATUS.PENDING:
          return 'Preparing...';
        case UPLOAD_STATUS.UPLOADING:
          return `${Math.round(progress)}%`;
        case UPLOAD_STATUS.COMPLETED:
          return 'Sent';
        case UPLOAD_STATUS.FAILED:
          return 'Failed';
        case UPLOAD_STATUS.CANCELLED:
          return 'Cancelled';
        default:
          return '';
      }
    }

    switch (status) {
      case UPLOAD_STATUS.PENDING:
        return 'Preparing upload...';
      case UPLOAD_STATUS.UPLOADING:
        return `Uploading ${Math.round(progress)}%`;
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
      case UPLOAD_STATUS.PENDING:
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

  const showRetryButton = status === UPLOAD_STATUS.FAILED && onRetry;
  const showCancelButton =
    (status === UPLOAD_STATUS.UPLOADING || status === UPLOAD_STATUS.PENDING) &&
    onCancel;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        {getStatusIcon()}
        <Text style={[styles.compactText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        {showRetryButton && (
          <TouchableOpacity
            onPress={() => onRetry(uploadId)}
            style={styles.compactRetryButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.compactRetryText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusRow}>
        {getStatusIcon()}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {(showRetryButton || showCancelButton) && (
        <View style={styles.actionRow}>
          {showRetryButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onRetry(uploadId)}
              activeOpacity={0.7}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}

          {showCancelButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onCancel(uploadId)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '500',
  },
  compactText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '500',
  },
  spinner: {
    width: 12,
    height: 12,
  },
  successIcon: {
    fontSize: 12,
    color: colors.success,
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: 12,
    color: colors.error,
    fontWeight: 'bold',
  },
  cancelledIcon: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  retryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  cancelText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  compactRetryButton: {
    padding: spacing.xs / 2,
  },
  compactRetryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default memo(UploadStatusBadge);
