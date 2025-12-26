import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const WARNING_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const DocumentPreview = ({ documentAsset, onSend, onCancel }) => {
  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = extension => {
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      ppt: '📊',
      pptx: '📊',
      xls: '📈',
      xlsx: '📈',
      zip: '🗜️',
      txt: '📄',
    };
    return iconMap[extension?.toLowerCase()] || '📄';
  };

  const getFileTypeColor = extension => {
    const colorMap = {
      pdf: '#FF6B6B',
      doc: '#4ECDC4',
      docx: '#4ECDC4',
      ppt: '#FFE66D',
      pptx: '#FFE66D',
      xls: '#95E1D3',
      xlsx: '#95E1D3',
      zip: '#A8E6CF',
      txt: '#DDA0DD',
    };
    return colorMap[extension?.toLowerCase()] || colors.primary;
  };

  const isLargeFile = () => {
    return documentAsset.fileSize > WARNING_FILE_SIZE;
  };

  const isTooLarge = () => {
    return documentAsset.fileSize > MAX_FILE_SIZE;
  };

  const handleSend = () => {
    if (isTooLarge()) {
      Alert.alert(
        'File Too Large',
        `File size (${formatFileSize(
          documentAsset.fileSize,
        )}) exceeds the 10MB limit. Please select a smaller file.`,
        [{ text: 'OK' }],
      );
      return;
    }

    if (isLargeFile()) {
      Alert.alert(
        'Large File Warning',
        `This file is ${formatFileSize(
          documentAsset.fileSize,
        )}. Large files may take longer to upload and download. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Anyway', onPress: () => onSend(documentAsset) },
        ],
      );
      return;
    }

    onSend(documentAsset);
  };

  const renderFileSizeWarning = () => {
    if (isTooLarge()) {
      return (
        <View style={[styles.warningContainer, styles.errorContainer]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.errorTitle}>File Too Large</Text>
            <Text style={styles.errorText}>
              Maximum file size is 10MB. This file is{' '}
              {formatFileSize(documentAsset.fileSize)}.
            </Text>
          </View>
        </View>
      );
    }

    if (isLargeFile()) {
      return (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Large File</Text>
            <Text style={styles.warningText}>
              This file is {formatFileSize(documentAsset.fileSize)}. It may take
              longer to upload.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  if (!documentAsset) {
    return null;
  }

  const fileTypeColor = getFileTypeColor(documentAsset.extension);
  const fileIcon = getFileTypeIcon(documentAsset.extension);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Document Preview</Text>
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, isTooLarge() && styles.disabledButton]}
          disabled={isTooLarge()}
        >
          <Text style={[styles.sendText, isTooLarge() && styles.disabledText]}>
            Send
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* File Icon and Info */}
        <View style={styles.fileContainer}>
          <View
            style={[
              styles.fileIconContainer,
              { backgroundColor: fileTypeColor },
            ]}
          >
            <Text style={styles.fileIcon}>{fileIcon}</Text>
            <Text style={styles.fileExtension}>
              {documentAsset.extension?.toUpperCase() || 'FILE'}
            </Text>
          </View>

          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileName} numberOfLines={2}>
              {documentAsset.fileName}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(documentAsset.fileSize)}
            </Text>
            <Text style={styles.fileType}>
              {documentAsset.mimeType || 'Unknown type'}
            </Text>
          </View>
        </View>

        {/* File Size Warning */}
        {renderFileSizeWarning()}

        {/* File Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>File Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {documentAsset.fileName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size:</Text>
            <Text style={styles.detailValue}>
              {formatFileSize(documentAsset.fileSize)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {documentAsset.extension?.toUpperCase() || 'Unknown'}
            </Text>
          </View>

          {documentAsset.mimeType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MIME Type:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {documentAsset.mimeType}
              </Text>
            </View>
          )}
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButtonLarge,
            isTooLarge() && styles.disabledButtonLarge,
          ]}
          onPress={handleSend}
          disabled={isTooLarge()}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.sendButtonLargeText,
              isTooLarge() && styles.disabledText,
            ]}
          >
            {isTooLarge() ? 'File Too Large' : 'Send Document'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.button,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.textDark,
    fontWeight: '600',
  },
  sendButton: {
    paddingVertical: spacing.sm,
  },
  sendText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  fileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  fileIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  fileExtension: {
    ...typography.caption,
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 10,
  },
  fileInfoContainer: {
    flex: 1,
  },
  fileName: {
    ...typography.h4,
    color: colors.textDark,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  fileSize: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fileType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  errorContainer: {
    backgroundColor: '#F8D7DA',
    borderLeftColor: '#DC3545',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    ...typography.caption,
    color: '#856404',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: '#856404',
  },
  errorTitle: {
    ...typography.caption,
    color: '#721C24',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: '#721C24',
  },
  detailsContainer: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  detailsTitle: {
    ...typography.h4,
    color: colors.textDark,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    width: 80,
    fontWeight: '500',
  },
  detailValue: {
    ...typography.body,
    color: colors.textDark,
    flex: 1,
  },
  sendButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  disabledButtonLarge: {
    backgroundColor: colors.textSecondary,
  },
  sendButtonLargeText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DocumentPreview;
