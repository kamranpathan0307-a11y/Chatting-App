import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { colors, spacing, typography } from '../theme';

const SUPPORTED_TYPES = [
  DocumentPicker.types.pdf,
  DocumentPicker.types.doc,
  DocumentPicker.types.docx,
  DocumentPicker.types.ppt,
  DocumentPicker.types.pptx,
  DocumentPicker.types.xls,
  DocumentPicker.types.xlsx,
  DocumentPicker.types.zip,
  DocumentPicker.types.plainText,
];

const SUPPORTED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
  'txt',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const DocumentPickerComponent = ({ onSelection, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const getFileExtension = fileName => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFileType = fileName => {
    const extension = getFileExtension(fileName);
    return SUPPORTED_EXTENSIONS.includes(extension);
  };

  const validateFileSize = fileSize => {
    return fileSize <= MAX_FILE_SIZE;
  };

  const handleDocumentPick = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.pickSingle({
        type: SUPPORTED_TYPES,
        copyTo: 'cachesDirectory',
      });

      setLoading(false);

      // Validate file type
      if (!validateFileType(result.name)) {
        Alert.alert(
          'Unsupported File Type',
          `Only ${SUPPORTED_EXTENSIONS.join(
            ', ',
          ).toUpperCase()} files are supported.`,
          [{ text: 'OK' }],
        );
        return;
      }

      // Validate file size
      if (!validateFileSize(result.size)) {
        Alert.alert(
          'File Too Large',
          `File size (${formatFileSize(
            result.size,
          )}) exceeds the 10MB limit. Please select a smaller file.`,
          [{ text: 'OK' }],
        );
        return;
      }

      // Create document asset object
      const documentAsset = {
        id: `doc_${Date.now()}`,
        type: 'document',
        uri: result.fileCopyUri || result.uri,
        fileName: result.name,
        fileSize: result.size,
        mimeType: result.type,
        extension: getFileExtension(result.name),
      };

      onSelection(documentAsset);
    } catch (error) {
      setLoading(false);

      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        return;
      }

      console.error('DocumentPicker Error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const renderSupportedFormats = () => (
    <View style={styles.supportedFormatsContainer}>
      <Text style={styles.supportedFormatsTitle}>Supported Formats:</Text>
      <Text style={styles.supportedFormatsText}>
        {SUPPORTED_EXTENSIONS.join(', ').toUpperCase()}
      </Text>
      <Text style={styles.fileSizeLimit}>Maximum file size: 10MB</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Document</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Opening file browser...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Document</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.documentIcon}>📄</Text>
        </View>

        <Text style={styles.description}>
          Choose a document from your device to share
        </Text>

        {renderSupportedFormats()}

        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleDocumentPick}
          activeOpacity={0.7}
        >
          <Text style={styles.selectButtonText}>Browse Files</Text>
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
  placeholder: {
    width: 60, // Same width as buttons for centering
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  documentIcon: {
    fontSize: 80,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  supportedFormatsContainer: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    width: '100%',
  },
  supportedFormatsTitle: {
    ...typography.caption,
    color: colors.textDark,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  supportedFormatsText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fileSizeLimit: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  selectButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DocumentPickerComponent;
