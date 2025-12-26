import React, { useState, memo } from 'react';
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

const ImageMessage = ({
  imageUrl,
  thumbnail,
  width,
  height,
  isOutgoing = false,
  onPress,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

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

  const handleImagePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowFullScreen(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const renderThumbnail = () => {
    const imageSource = thumbnail || imageUrl;

    if (hasError) {
      return (
        <View style={[styles.errorContainer, thumbnailSize]}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={styles.errorText}>Image unavailable</Text>
        </View>
      );
    }

    return (
      <View style={[styles.imageContainer, thumbnailSize]}>
        <Image
          source={{ uri: imageSource }}
          style={[styles.thumbnail, thumbnailSize]}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode="cover"
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
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
          <View style={styles.fullScreenImageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
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
        onPress={handleImagePress}
        style={styles.touchableContainer}
      >
        {renderThumbnail()}
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
  imageContainer: {
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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageContainer: {
    width: screenWidth,
    height: screenHeight - 100, // Account for safe area
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
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

export default memo(ImageMessage);
