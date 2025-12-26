import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import { Slider } from '@react-native-community/slider';
import { colors, spacing } from '../theme';
import { formatFileSize } from '../utils/media';
import VideoCompression from '../utils/videoCompression';

const VideoPreview = ({ visible, videoUri, videoData, onSend, onCancel }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionId, setCompressionId] = useState(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  // Reset state when video changes
  useEffect(() => {
    if (videoUri) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
      setShowControls(true);
      // Reset compression state
      setIsCompressing(false);
      setCompressionProgress(0);
      setCompressionId(null);
    }
  }, [videoUri]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (compressionId) {
        VideoCompression.cancelCompression(compressionId);
      }
    };
  }, [compressionId]);

  const handleVideoPress = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleSeek = value => {
    const seekTime = (value / 100) * duration;
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.seek(seekTime);
    }
  };

  const handleLoad = data => {
    setDuration(data.duration);
    setIsLoading(false);
  };

  const handleProgress = data => {
    setCurrentTime(data.currentTime);
  };

  const handleError = error => {
    console.error('Video error:', error);
    setIsLoading(false);
    Alert.alert(
      'Video Error',
      'Unable to load video. Please try selecting another video.',
      [{ text: 'OK', onPress: onCancel }],
    );
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelCompression = () => {
    if (compressionId) {
      VideoCompression.cancelCompression(compressionId);
    }
    setIsCompressing(false);
    setCompressionProgress(0);
    setCompressionId(null);
  };

  const getVideoMetadata = () => {
    if (!videoData) return null;

    const metadata = {
      duration: duration > 0 ? formatTime(duration) : 'Unknown',
      size: videoData.fileSize ? formatFileSize(videoData.fileSize) : 'Unknown',
      resolution:
        videoData.width && videoData.height
          ? `${videoData.width}x${videoData.height}`
          : 'Unknown',
    };

    return metadata;
  };

  const handleSend = async () => {
    try {
      // Check if video needs compression (> 25MB)
      const needsCompression = VideoCompression.needsCompression(
        videoData?.fileSize,
      );

      if (needsCompression) {
        // Show compression options to user
        const compressionPreset = await VideoCompression.showCompressionDialog(
          videoData.fileSize,
        );

        setIsCompressing(true);
        setCompressionProgress(0);

        try {
          // Generate compression ID for cancellation
          const currentCompressionId = `compression_${Date.now()}`;
          setCompressionId(currentCompressionId);

          // Perform actual video compression
          const compressionResult = await VideoCompression.compressVideo(
            videoUri,
            { preset: compressionPreset },
            progress => {
              setCompressionProgress(progress);
            },
          );

          if (compressionResult.success) {
            // Send compressed video
            const compressedVideoData = {
              ...videoData,
              uri: compressionResult.outputPath,
              fileSize: compressionResult.compressedSize,
              compressed: true,
              originalSize: videoData.fileSize,
              compressionRatio: compressionResult.compressionRatio,
            };

            setIsCompressing(false);
            onSend(compressionResult.outputPath, compressedVideoData);
          } else {
            throw new Error('Compression failed');
          }
        } catch (compressionError) {
          console.error('Compression error:', compressionError);
          setIsCompressing(false);

          // Ask user if they want to send original video
          Alert.alert(
            'Compression Failed',
            'Video compression failed. Would you like to send the original video?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send Original',
                onPress: () => onSend(videoUri, videoData),
              },
            ],
          );
        }
      } else {
        // Send original video without compression
        onSend(videoUri, videoData);
      }
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Error', 'Failed to send video. Please try again.');
      setIsCompressing(false);
    }
  };

  if (!visible) {
    return null;
  }

  const metadata = getVideoMetadata();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onCancel}
          disabled={isCompressing}
        >
          <Text
            style={[
              styles.headerButtonText,
              isCompressing && styles.disabledText,
            ]}
          >
            Cancel
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Video Preview</Text>
          {metadata && (
            <Text style={styles.headerSubtitle}>
              {metadata.duration} • {metadata.size}
              {metadata.resolution !== 'Unknown' && ` • ${metadata.resolution}`}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSend}
          disabled={isCompressing || isLoading}
        >
          <Text
            style={[
              styles.headerButtonText,
              (isCompressing || isLoading) && styles.disabledText,
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        {videoUri && (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="contain"
            paused={!isPlaying}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onError={handleError}
            onEnd={() => setIsPlaying(false)}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Play/Pause Button Overlay */}
        {showControls && !isLoading && (
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom Controls */}
      {showControls && !isLoading && (
        <View style={styles.bottomControls}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Slider
              style={styles.progressSlider}
              minimumValue={0}
              maximumValue={100}
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              onValueChange={handleSeek}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbStyle={styles.sliderThumb}
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePlayPause}
            >
              <Text style={styles.controlButtonText}>
                {isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Compression Progress Overlay */}
      {isCompressing && (
        <View style={styles.compressionOverlay}>
          <View style={styles.compressionModal}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.compressionTitle}>Compressing Video</Text>
            <Text style={styles.compressionProgress}>
              {compressionProgress.toFixed(0)}% complete
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${compressionProgress}%` },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.cancelCompressionButton}
              onPress={handleCancelCompression}
            >
              <Text style={styles.cancelCompressionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: '#666',
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
  headerSubtitle: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: spacing.md,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  playButtonText: {
    fontSize: 32,
    color: 'white',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  progressSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: spacing.sm,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginHorizontal: spacing.sm,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  compressionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressionModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  compressionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  compressionProgress: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  progressBar: {
    width: 150,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  cancelCompressionButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelCompressionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VideoPreview;
