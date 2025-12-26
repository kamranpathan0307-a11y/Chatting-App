import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import PermissionManager from '../utils/PermissionManager';
import { spacing } from '../theme';

const CameraInterface = ({
  visible,
  mediaType = 'mixed', // 'photo', 'video', 'mixed'
  onCapture,
  onCancel,
}) => {
  // Set initial mode based on mediaType
  const getInitialMode = () => {
    if (mediaType === 'photo') return 'photo';
    if (mediaType === 'video') return 'video';
    return 'photo'; // default for mixed mode
  };

  const [currentMode, setCurrentMode] = useState(getInitialMode());
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraType, setCameraType] = useState('back'); // 'back' or 'front'

  useEffect(() => {
    const handlePermissions = async () => {
      try {
        const permissionResult = await PermissionManager.handleMediaPermissions(
          'camera',
        );

        if (!permissionResult.success) {
          // Permission denied, close camera interface
          onCancel();
        }
      } catch (error) {
        console.error('Error handling camera permissions:', error);
        Alert.alert(
          'Permission Error',
          'Unable to access camera permissions. Please try again.',
          [{ text: 'OK', onPress: onCancel }],
        );
      }
    };

    if (visible) {
      // Request camera permissions when component becomes visible
      handlePermissions();
    }
  }, [visible, onCancel]);

  const handleCapture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      const options = {
        mediaType: currentMode === 'photo' ? 'photo' : 'video',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        videoQuality: 'medium',
        durationLimit: 60, // 60 seconds max for video
        cameraType: cameraType,
        saveToPhotos: false,
      };

      launchCamera(options, response => {
        setIsCapturing(false);

        if (response.didCancel) {
          // User cancelled camera
          return;
        }

        if (response.errorMessage) {
          console.error('Camera error:', response.errorMessage);
          Alert.alert(
            'Camera Error',
            'Failed to capture media. Please try again.',
            [{ text: 'OK' }],
          );
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];

          // Create media asset object
          const mediaAsset = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentMode === 'photo' ? 'image' : 'video',
            uri: asset.uri,
            fileName:
              asset.fileName ||
              `${currentMode}_${Date.now()}.${
                currentMode === 'photo' ? 'jpg' : 'mp4'
              }`,
            fileSize: asset.fileSize || 0,
            mimeType:
              asset.type ||
              (currentMode === 'photo' ? 'image/jpeg' : 'video/mp4'),
            width: asset.width,
            height: asset.height,
            duration: asset.duration,
          };

          // Call the onCapture callback with the media asset
          onCapture(mediaAsset);
        }
      });
    } catch (error) {
      setIsCapturing(false);
      console.error('Error capturing media:', error);
      Alert.alert(
        'Capture Error',
        'Failed to capture media. Please try again.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleCameraSwitch = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  const handleCancel = () => {
    if (isCapturing) {
      // Don't allow cancel while capturing
      return;
    }
    onCancel();
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
          disabled={isCapturing}
        >
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {mediaType === 'photo'
              ? 'Photo'
              : mediaType === 'video'
              ? 'Video'
              : currentMode === 'photo'
              ? 'Photo'
              : 'Video'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCameraSwitch}
          disabled={isCapturing}
        >
          <Text style={styles.headerButtonText}>
            {cameraType === 'back' ? '🔄' : '🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Preview Placeholder */}
      <View style={styles.cameraPreview}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraPlaceholderText}>📷 Camera Preview</Text>
          <Text style={styles.cameraInfoText}>
            Mode:{' '}
            {mediaType === 'photo'
              ? 'Photo'
              : mediaType === 'video'
              ? 'Video'
              : currentMode === 'photo'
              ? 'Photo'
              : 'Video'}
          </Text>
          <Text style={styles.cameraInfoText}>
            Camera: {cameraType === 'back' ? 'Rear' : 'Front'}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Mode Switcher */}
        {mediaType === 'mixed' && (
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                currentMode === 'photo' && styles.modeButtonActive,
              ]}
              onPress={() => setCurrentMode('photo')}
              disabled={isCapturing}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  currentMode === 'photo' && styles.modeButtonTextActive,
                ]}
              >
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                currentMode === 'video' && styles.modeButtonActive,
              ]}
              onPress={() => setCurrentMode('video')}
              disabled={isCapturing}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  currentMode === 'video' && styles.modeButtonTextActive,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Capture Button */}
        <View style={styles.captureContainer}>
          <TouchableOpacity
            testID="capture-button"
            style={[
              styles.captureButton,
              currentMode === 'video' && styles.captureButtonVideo,
              isCapturing && styles.captureButtonCapturing,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.captureButtonInner,
                currentMode === 'video' && styles.captureButtonInnerVideo,
                isCapturing && styles.captureButtonInnerCapturing,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Capture Status */}
        {isCapturing && (
          <View style={styles.captureStatus}>
            <Text style={styles.captureStatusText}>
              {currentMode === 'photo'
                ? 'Taking Photo...'
                : 'Recording Video...'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  cameraPlaceholderText: {
    color: 'white',
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  cameraInfoText: {
    color: '#888',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'white',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: 'black',
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonVideo: {
    borderColor: '#FF4444',
  },
  captureButtonCapturing: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  captureButtonInnerVideo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  captureButtonInnerCapturing: {
    opacity: 0.5,
  },
  captureStatus: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  captureStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CameraInterface;
