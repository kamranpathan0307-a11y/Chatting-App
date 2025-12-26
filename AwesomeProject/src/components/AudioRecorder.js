import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import PermissionManager from '../utils/PermissionManager';
import { colors } from '../theme/colors';

/**
 * AudioRecorder Component
 *
 * Provides voice recording functionality with record/stop/play controls,
 * real-time duration display, and microphone permission handling.
 *
 * Requirements: 6.2, 6.3, 6.4
 */
const AudioRecorder = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [recordedUri, setRecordedUri] = useState(null);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  useEffect(() => {
    // Check microphone permission on component mount
    checkMicrophonePermission();

    return () => {
      // Cleanup on unmount
      if (isRecording) {
        stopRecording();
      }
      if (isPlaying) {
        stopPlaying();
      }
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  /**
   * Check and request microphone permission
   * Requirement 6.2: Request microphone permissions if not granted
   */
  const checkMicrophonePermission = async () => {
    try {
      const result = await PermissionManager.handleMediaPermissions('audio');
      setHasPermission(result.success);

      if (!result.success) {
        // Permission was denied, show error and return to previous screen
        Alert.alert(
          'Microphone Permission Required',
          'Voice recording requires microphone access. Please grant permission to continue.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Try Again', onPress: checkMicrophonePermission },
          ],
        );
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setHasPermission(false);
      Alert.alert(
        'Permission Error',
        'Unable to check microphone permission. Please try again.',
        [{ text: 'OK', onPress: onCancel }],
      );
    }
  };

  /**
   * Start voice recording
   * Requirement 6.3: Provide record functionality with visual feedback
   */
  const startRecording = async () => {
    if (!hasPermission) {
      await checkMicrophonePermission();
      return;
    }

    try {
      // Configure recording path
      const path = Platform.select({
        ios: 'audio_recording.m4a',
        android: 'sdcard/audio_recording.mp4',
      });

      // Configure audio settings
      const audioSet = {
        AudioEncoderAndroid: 'aac',
        AudioSourceAndroid: 'mic',
        AVEncoderAudioQualityKeyIOS: 'high',
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'mp4',
      };

      // Start recording
      const uri = await audioRecorderPlayer.startRecorder(path, audioSet);
      setRecordedUri(uri);
      setIsRecording(true);
      setRecordTime('00:00');

      // Set up recording progress listener
      audioRecorderPlayer.addRecordBackListener(e => {
        const time = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        setRecordTime(time);
        setDuration(e.currentPosition);
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert(
        'Recording Error',
        'Unable to start recording. Please check your microphone and try again.',
        [{ text: 'OK' }],
      );
    }
  };

  /**
   * Stop voice recording
   * Requirement 6.3: Provide stop functionality
   */
  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      audioRecorderPlayer.removeRecordBackListener();

      // Update recorded URI if different from start
      if (result) {
        setRecordedUri(result);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Unable to stop recording properly.', [
        { text: 'OK' },
      ]);
    }
  };

  /**
   * Play recorded audio
   * Requirement 6.3: Provide play functionality
   */
  const startPlaying = async () => {
    if (!recordedUri) return;

    try {
      await audioRecorderPlayer.startPlayer(recordedUri);
      setIsPlaying(true);
      setPlayTime('00:00');

      // Set up playback progress listener
      audioRecorderPlayer.addPlayBackListener(e => {
        const time = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        setPlayTime(time);

        // Auto-stop when playback completes
        if (e.currentPosition >= e.duration) {
          stopPlaying();
        }
      });
    } catch (error) {
      console.error('Error starting playback:', error);
      Alert.alert('Playback Error', 'Unable to play the recorded audio.', [
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
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  /**
   * Handle send button press
   * Requirement 6.4: Complete recording workflow
   */
  const handleSend = () => {
    if (recordedUri && duration > 0) {
      onRecordingComplete(recordedUri, Math.floor(duration / 1000));
    } else {
      Alert.alert(
        'No Recording',
        'Please record an audio message before sending.',
        [{ text: 'OK' }],
      );
    }
  };

  /**
   * Handle cancel button press
   */
  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (isPlaying) {
      stopPlaying();
    }
    onCancel();
  };

  // Don't render if no permission
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Microphone permission is required for voice recording
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkMicrophonePermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Voice Message</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Recording Status and Duration Display */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.recordingIndicator,
              {
                backgroundColor: isRecording
                  ? colors.error
                  : colors.textSecondary,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isRecording
              ? 'Recording...'
              : recordedUri
              ? 'Recording Complete'
              : 'Ready to Record'}
          </Text>
        </View>

        {/* Duration Display - Requirement 6.4: Real-time duration display */}
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {isRecording ? recordTime : isPlaying ? playTime : recordTime}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!recordedUri ? (
            // Recording controls
            <TouchableOpacity
              style={[
                styles.recordButton,
                {
                  backgroundColor: isRecording ? colors.error : colors.primary,
                },
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!hasPermission}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>
          ) : (
            // Playback and action controls
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={isPlaying ? stopPlaying : startPlaying}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying ? 'Stop' : 'Play'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reRecordButton}
                onPress={() => {
                  setRecordedUri(null);
                  setDuration(0);
                  setRecordTime('00:00');
                  setPlayTime('00:00');
                }}
              >
                <Text style={styles.reRecordButtonText}>Re-record</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Visual Feedback */}
        {isRecording && (
          <View style={styles.waveformContainer}>
            <Text style={styles.waveformText}>🎤 Recording in progress...</Text>
          </View>
        )}
      </View>
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
  placeholder: {
    width: 60,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  durationContainer: {
    marginBottom: 48,
  },
  durationText: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
  reRecordButton: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  reRecordButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  waveformContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  waveformText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AudioRecorder;
