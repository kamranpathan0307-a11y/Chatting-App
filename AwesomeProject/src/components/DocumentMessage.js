import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

const DocumentMessage = ({
  documentUrl,
  fileName,
  fileSize,
  mimeType,
  isOutgoing = false,
  onPress,
  onDownload,
  style,
}) => {
  const formatFileSize = bytes => {
    if (!bytes || bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (mimeType, fileName) => {
    if (!mimeType && !fileName) return '📄';

    const type = mimeType || '';
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : '';

    // PDF files
    if (type.includes('pdf') || extension === 'pdf') {
      return '📕';
    }

    // Word documents
    if (
      type.includes('word') ||
      type.includes('document') ||
      ['doc', 'docx'].includes(extension)
    ) {
      return '📘';
    }

    // Excel files
    if (
      type.includes('sheet') ||
      type.includes('excel') ||
      ['xls', 'xlsx', 'csv'].includes(extension)
    ) {
      return '📗';
    }

    // PowerPoint files
    if (
      type.includes('presentation') ||
      type.includes('powerpoint') ||
      ['ppt', 'pptx'].includes(extension)
    ) {
      return '📙';
    }

    // Archive files
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('archive') ||
      ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)
    ) {
      return '🗜️';
    }

    // Text files
    if (type.includes('text') || ['txt', 'md', 'rtf'].includes(extension)) {
      return '📝';
    }

    // Image files (fallback, should use ImageMessage instead)
    if (
      type.includes('image') ||
      ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)
    ) {
      return '🖼️';
    }

    // Video files (fallback, should use VideoMessage instead)
    if (
      type.includes('video') ||
      ['mp4', 'avi', 'mov', 'wmv'].includes(extension)
    ) {
      return '🎥';
    }

    // Audio files (fallback, should use AudioMessage instead)
    if (
      type.includes('audio') ||
      ['mp3', 'wav', 'aac', 'm4a'].includes(extension)
    ) {
      return '🎵';
    }

    // Default document icon
    return '📄';
  };

  const getFileTypeName = (mimeType, fileName) => {
    if (!mimeType && !fileName) return 'Document';

    const type = mimeType || '';
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : '';

    if (type.includes('pdf') || extension === 'pdf') return 'PDF';
    if (type.includes('word') || ['doc', 'docx'].includes(extension))
      return 'Word Document';
    if (type.includes('sheet') || ['xls', 'xlsx'].includes(extension))
      return 'Excel Spreadsheet';
    if (type.includes('presentation') || ['ppt', 'pptx'].includes(extension))
      return 'PowerPoint';
    if (type.includes('zip') || ['zip', 'rar', '7z'].includes(extension))
      return 'Archive';
    if (type.includes('text') || extension === 'txt') return 'Text File';
    if (extension === 'csv') return 'CSV File';

    return extension ? extension.toUpperCase() + ' File' : 'Document';
  };

  const handleDocumentPress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    // Show options for document interaction
    Alert.alert(
      'Document Options',
      `What would you like to do with ${fileName || 'this document'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: handleDownload,
        },
        {
          text: 'Open',
          onPress: handleOpen,
        },
      ],
    );
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      // In a real implementation, you would handle file download here
      Alert.alert(
        'Download',
        'Download functionality would be implemented here',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to download document');
    }
  };

  const handleOpen = async () => {
    try {
      if (documentUrl) {
        const supported = await Linking.canOpenURL(documentUrl);
        if (supported) {
          await Linking.openURL(documentUrl);
        } else {
          Alert.alert('Error', 'Cannot open this document type');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const isLargeFile = fileSize && fileSize > 10 * 1024 * 1024; // 10MB
  const fileIcon = getFileTypeIcon(mimeType, fileName);
  const fileTypeName = getFileTypeName(mimeType, fileName);
  const displayFileName = fileName || 'Unknown Document';
  const displayFileSize = formatFileSize(fileSize);

  const containerStyle = [
    styles.container,
    isOutgoing ? styles.outgoingContainer : styles.incomingContainer,
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handleDocumentPress}
      activeOpacity={0.7}
    >
      <View style={styles.documentContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.fileIcon}>{fileIcon}</Text>
        </View>

        <View style={styles.documentInfo}>
          <Text
            style={[styles.fileName, isOutgoing && styles.fileNameOutgoing]}
            numberOfLines={2}
          >
            {displayFileName}
          </Text>

          <View style={styles.fileDetails}>
            <Text
              style={[styles.fileType, isOutgoing && styles.fileTypeOutgoing]}
            >
              {fileTypeName}
            </Text>
            {fileSize > 0 && (
              <>
                <Text
                  style={[
                    styles.fileSeparator,
                    isOutgoing && styles.fileSeparatorOutgoing,
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.fileSize,
                    isOutgoing && styles.fileSizeOutgoing,
                    isLargeFile && styles.fileSizeLarge,
                  ]}
                >
                  {displayFileSize}
                </Text>
              </>
            )}
          </View>

          {isLargeFile && (
            <Text
              style={[
                styles.warningText,
                isOutgoing && styles.warningTextOutgoing,
              ]}
            >
              Large file - may take time to download
            </Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          <View style={styles.downloadIcon}>
            <Text style={styles.downloadIconText}>⬇</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs / 2,
    minWidth: 250,
    maxWidth: 300,
  },
  incomingContainer: {
    alignSelf: 'flex-start',
  },
  outgoingContainer: {
    alignSelf: 'flex-end',
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  fileIcon: {
    fontSize: 32,
  },
  documentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fileName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  fileNameOutgoing: {
    color: colors.messageTextOutgoing,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  fileType: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  fileTypeOutgoing: {
    color: colors.messageTextOutgoing,
    opacity: 0.8,
  },
  fileSeparator: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs / 2,
  },
  fileSeparatorOutgoing: {
    color: colors.messageTextOutgoing,
    opacity: 0.8,
  },
  fileSize: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  fileSizeOutgoing: {
    color: colors.messageTextOutgoing,
    opacity: 0.8,
  },
  fileSizeLarge: {
    color: colors.warning,
    fontWeight: '500',
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    fontSize: 11,
    fontStyle: 'italic',
  },
  warningTextOutgoing: {
    color: colors.warning,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default memo(DocumentMessage);
