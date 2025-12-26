import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoMessage = ({
  videoUrl,
  thumbnail,
  duration,
  width,
  height,
  isOutgoing = false,
  onPress,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Calculate aspect ratio and dimensions for thumbnail
  const calculateThumbnailSize = () => {
    if (!width || !height) {
      return { width: 220, height: 160 };
    }

    const maxWidth = 220;
    const maxHeight = 280;
    const aspectRatio = width / height;

    let thumbnailWidth = maxWidth;
    let thumbnailHeight = maxWidth / aspectRatio;

    if (thumbnailHeight > maxHeight) {
      thumbnailHeight = maxHeight;
      thumbnailWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(thumbnailWidth),
      height: Math.round(thumbnailHeight),
    };
  };

  const thumbnailSize = calculateThumbnailSize();

  const formatDuration = seconds => {
    if (!seconds) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoPress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowFullScreen(true);
    }
  };

  const handleThumbnailLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleThumbnailError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const renderPlayButton = () => (
    <View style={styles.playButtonContainer}>
      <View style={styles.playButton}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </View>
  );

  const renderDurationBadge = () => {
    if (!duration) return null;

    return (
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>
    );
  };

  const renderThumbnail = () => {
    if (hasError) {
      return (
        <View style={[styles.errorContainer, thumbnailSize]}>
          <Text style={styles.errorIcon}>🎥</Text>
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      );
    }

    return (
      <View style={[styles.videoContainer, thumbnailSize]}>
        <Image
          source={{ uri: thumbnail }}
          style={[styles.thumbnail, thumbnailSize]}
          onLoad={handleThumbnailLoad}
          onError={handleThumbnailError}
          resizeMode="cover"
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        {!isLoading && !hasError && (
          <>
            {renderPlayButton()}
            {renderDurationBadge()}
          </>
        )}
      </View>
    );
  };

  const renderInlinePlayer = () => {
    // For now, we'll show a placeholder for the inline video player
    // In a real implementation, you would use react-native-video or similar
    return (
      <View style={[styles.videoContainer, thumbnailSize]}>
        <View style={[styles.playerPlaceholder, thumbnailSize]}>
          <Text style={styles.playerText}>Video Player</Text>
          <Text style={styles.playerSubtext}>
            Playing: {formatDuration(duration)}
          </Text>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={() => setIsPlaying(false)}
          >
            <Text style={styles.pauseIcon}>⏸</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFullScreenViewer = () => (
    <Modal
      visible={showFullScreen}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFullScreen(false)}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <SafeAreaView style={styles.fullScreenContainer}>
        <TouchableOpacity
          style={styles.fullScreenOverlay}
          activeOpacity={1}
          onPress={() => setShowFullScreen(false)}
        >
          <View style={styles.fullScreenVideoContainer}>
            {/* Placeholder for full-screen video player */}
            <View style={styles.fullScreenPlayerPlaceholder}>
              <Text style={styles.fullScreenPlayerText}>
                Full Screen Video Player
              </Text>
              <Text style={styles.fullScreenPlayerSubtext}>
                Duration: {formatDuration(duration)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowFullScreen(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleVideoPress}
        style={styles.touchableContainer}
      >
        {isPlaying ? renderInlinePlayer() : renderThumbnail()}
      </TouchableOpacity>
      {renderFullScreenViewer()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs / 2,
  },
  touchableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.backgroundLight,
  },
  thumbnail: {
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: 'white',
    fontSize: 20,
    marginLeft: 3, // Slight offset to center the triangle
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pauseIcon: {
    color: 'white',
    fontSize: 16,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
    opacity: 0.5,
  },
  errorText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  playerPlaceholder: {
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  playerText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  playerSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideoContainer: {
    width: screenWidth,
    height: screenHeight - 100, // Account for safe area
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPlayerPlaceholder: {
    width: '90%',
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  fullScreenPlayerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  fullScreenPlayerSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default memo(VideoMessage);
