import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import MediaPickerModal from './MediaPickerModal';

const InputBar = ({
  onSend,
  onCameraPress,
  onImageGalleryPress,
  onVideoGalleryPress,
  onAudioPress,
  onDocumentPress,
}) => {
  const [message, setMessage] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleAttachmentPress = () => {
    setShowMediaPicker(true);
  };

  const handleMediaPickerClose = () => {
    setShowMediaPicker(false);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleAttachmentPress}
        >
          <Text style={styles.iconText}>📎</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />

        {message.trim() ? (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>✈</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={onCameraPress}>
              <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onAudioPress}>
              <Text style={styles.iconText}>🎤</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <MediaPickerModal
        visible={showMediaPicker}
        onClose={handleMediaPickerClose}
        onCameraPress={onCameraPress}
        onImageGalleryPress={onImageGalleryPress}
        onVideoGalleryPress={onVideoGalleryPress}
        onAudioPress={onAudioPress}
        onDocumentPress={onDocumentPress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 60,
  },
  input: {
    flex: 1,
    ...typography.body,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    maxHeight: 100,
    minHeight: 40,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sendIcon: {
    fontSize: 18,
    color: colors.background,
  },
});

export default InputBar;
