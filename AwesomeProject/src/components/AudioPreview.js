import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import PermissionManager from '../utils/PermissionManager';
import { colors } from '../theme/colors';

/**
 * AudioPreview Component
 *
 * Handles audio file selection from device storage and provides playback controls
 * with progress indicator and waveform visualization or duration display.
 *
 * Requirements: 6.5, 6.6, 6.7
 */
const AudioPreview = ({ onAudioSelected, onCancel, selectedAudio = null }) => {
  const [audioFile, setAudioFile] = useState(selectedAudio);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00');
  const [totalDuration, setTotalDuration] = useState('00:00');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  useEffect(() => {
    // Check storage permission on component mount
    checkStoragePermission();

    return () => {
      // Cleanup on unmount
      if (isPlaying) {
        stopPlaying();
      }
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  useEffect(() => {
    // If audio file is provided as prop, set it up
    if (selectedAudio) {
      setAudioFile(selectedAudio);
      setupAudioFile(selectedAudio);
    }
  }, [selectedAudio]);

  /**
   * Check storage permission for file access
   * Requirement 6.5: Handle storage permissions for audio file selection
   */
  const checkStoragePermission = async () => {
    try {
      const result = await PermissionManager.handleMediaPermissions('audio');
      setHasPermission(result.success);

      if (!result.success && Platform.OS === 'android') {
        Alert.alert(
          'Storage Permission Required',
          'Audio file selection requires storage access. Please grant permission to continue.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Try Again', onPress: checkStoragePermission },
          ],
        );
      } else {
        // iOS doesn't need explicit storage permission for DocumentPicker
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error checking storage permission:', error);
      setHasPermission(Platform.OS === 'ios'); // iOS doesn't need storage permission
    }
  };

  /**
   * Open device file picker for audio selection
   * Requirement 6.5: Audio file selection from device
   */
  const selectAudioFile = async () => {
    if (!hasPermission && Platform.OS === 'android') {
      await checkStoragePermission();
      return;
    }

    try {
      setIsLoading(true);

      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.audio,
          'audio/mpeg',
          'audio/mp4',
          'audio/wav',
          'audio/m4a',
          'audio/aac',
          'audio/ogg',
        ],
        copyTo: 'cachesDirectory', // Copy to app cache for playback
      });

      if (result && result.length > 0) {
        const file = result[0];

        // Validate file size (limit to 25MB for audio files)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
          Alert.alert(
            'File Too Large',
            'Audio files must be smaller than 25MB. Please select a smaller file.',
            [{ text: 'OK' }],
          );
          return;
        }

        setAudioFile(file);
        await setupAudioFile(file);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        console.log('Audio file selection cancelled');
      } else {
        console.error('Error selecting audio file:', error);
        Alert.alert(
          'Selection Error',
          'Unable to select audio file. Please try again.',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Setup audio file for playback and get duration
   */
  const setupAudioFile = async file => {
    try {
      // Get audio duration without starting playback
      const uri = file.fileCopyUri || file.uri;

      // Start player briefly to get duration, then stop immediately
      await audioRecorderPlayer.startPlayer(uri);

      // Set up listener to get duration
      audioRecorderPlayer.addPlayBackListener(e => {
        if (e.duration > 0) {
          const duration = audioRecorderPlayer.mmssss(Math.floor(e.duration));
          setTotalDuration(duration);

          // Stop immediately after getting duration
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
        }
      });
    } catch (error) {
      console.error('Error setting up audio file:', error);
      setTotalDuration('--:--');
    }
  };

  /**
   * Start audio playback
   * Requirement 6.6: Playback controls with progress indicator
   */
  const startPlaying = async () => {
    if (!audioFile) return;

    try {
      const uri = audioFile.fileCopyUri || audioFile.uri;
      await audioRecorderPlayer.startPlayer(uri);
      setIsPlaying(true);

      // Set up playback progress listener
      audioRecorderPlayer.addPlayBackListener(e => {
        const currentTime = audioRecorderPlayer.mmssss(
          Math.floor(e.currentPosition),
        );
        const duration = audioRecorderPlayer.mmssss(Math.floor(e.duration));

        setPlayTime(currentTime);
        setTotalDuration(duration);

        // Calculate progress percentage
        if (e.duration > 0) {
          setProgress((e.currentPosition / e.duration) * 100);
        }

        // Auto-stop when playback completes
        if (e.currentPosition >= e.duration) {
          stopPlaying();
        }
      });
    } catch (error) {
      console.error('Error starting playback:', error);
      Alert.alert('Playback Error', 'Unable to play the selected audio file.', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Stop audio playback
   */
  const stopPlaying = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      setIsPlaying(false);
      audioRecorderPlayer.removePlayBackListener();
      setPlayTime('00:00');
      setProgress(0);
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  /**
   * Seek to specific position in audio
   */
  const seekToPosition = async position => {
    if (!isPlaying || !audioFile) return;

    try {
      await audioRecorderPlayer.seekToPlayer(position);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  /**
   * Handle send button press
   */
  const handleSend = () => {
    if (audioFile) {
      onAudioSelected(audioFile);
    } else {
      Alert.alert(
        'No Audio Selected',
        'Please select an audio file before sending.',
        [{ text: 'OK' }],
      );
    }
  };

  /**
   * Handle cancel button press
   */
  const handleCancel = () => {
    if (isPlaying) {
      stopPlaying();
    }
    onCancel();
  };

  /**
   * Format file size for display
   */
  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Get file type icon/emoji
   */
  const getFileTypeIcon = mimeType => {
    if (mimeType?.includes('audio')) {
      return '🎵';
    }
    return '📄';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Audio File</Text>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!audioFile}
        >
          <Text
            style={[styles.sendButtonText, { opacity: audioFile ? 1 : 0.5 }]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {!audioFile ? (
          // File selection screen
          <View style={styles.selectionContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎵</Text>
            </View>
            <Text style={styles.instructionText}>
              Select an audio file from your device
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={selectAudioFile}
              disabled={isLoading}
            >
              <Text style={styles.selectButtonText}>
                {isLoading ? 'Loading...' : 'Choose Audio File'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Audio preview screen
          <View style={styles.previewContainer}>
            {/* File Information */}
            <View style={styles.fileInfoContainer}>
              <View style={styles.fileIconContainer}>
                <Text style={styles.fileIcon}>
                  {getFileTypeIcon(audioFile.type)}
                </Text>
              </View>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {audioFile.name}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(audioFile.size)}
                </Text>
                <Text style={styles.fileType}>
                  {audioFile.type || 'Audio File'}
                </Text>
              </View>
            </View>

            {/* Waveform Visualization / Duration Display */}
            {/* Requirement 6.7: Waveform visualization or duration display */}
            <View style={styles.waveformContainer}>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>

              {/* Duration Display */}
              <View style={styles.durationContainer}>
                <Text style={styles.durationText}>
                  {playTime} / {totalDuration}
                </Text>
              </View>
            </View>

            {/* Playback Controls */}
            {/* Requirement 6.6: Playback controls with progress indicator */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={isPlaying ? stopPlaying : startPlaying}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeFileButton}
                onPress={() => {
                  if (isPlaying) stopPlaying();
                  setAudioFile(null);
                  setProgress(0);
                  setPlayTime('00:00');
                  setTotalDuration('00:00');
                }}
              >
                <Text style={styles.changeFileButtonText}>
                  Choose Different File
                </Text>
              </TouchableOpacity>
            </View>

            {/* File Size Warning */}
            {audioFile.size > 10 * 1024 * 1024 && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ Large file ({formatFileSize(audioFile.size)}). Upload may
                  take longer on slower connections.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
  },
  selectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 48,
  },
  instructionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  selectButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  waveformContainer: {
    marginBottom: 32,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  controlsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  playButtonText: {
    fontSize: 24,
    color: colors.background,
  },
  changeFileButton: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  changeFileButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
  },
});

export default AudioPreview;
