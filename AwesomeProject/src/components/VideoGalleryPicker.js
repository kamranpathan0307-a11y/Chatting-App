import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import PermissionManager from '../utils/PermissionManager';
import { colors, spacing, typography } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_SIZE = (screenWidth - spacing.lg * 2 - spacing.sm * 2) / 3;

const VideoGalleryPicker = ({
  selectionLimit = 1,
  onSelection,
  onCancel,
  allowMultipleSelection = false,
}) => {
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    initializeGallery();
  }, []);

  const initializeGallery = async () => {
    try {
      setLoading(true);

      // Handle permissions for gallery access
      const permissionResult = await PermissionManager.handleMediaPermissions(
        'gallery',
      );

      if (!permissionResult.success) {
        setPermissionGranted(false);
        setLoading(false);
        return;
      }

      setPermissionGranted(true);
      await loadVideos();
    } catch (error) {
      console.error('Error initializing video gallery:', error);
      Alert.alert('Error', 'Failed to access video library. Please try again.');
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const options = {
        mediaType: 'video',
        includeBase64: false,
        videoQuality: 'medium',
        selectionLimit: 0, // 0 means no limit for loading, we'll handle selection limit separately
      };

      launchImageLibrary(options, response => {
        setLoading(false);

        if (response.didCancel) {
          // User cancelled, but we still want to show the picker interface
          return;
        }

        if (response.errorMessage) {
          console.error('VideoPicker Error:', response.errorMessage);
          Alert.alert('Error', 'Failed to load videos from gallery.');
          return;
        }

        if (response.assets && response.assets.length > 0) {
          // For now, we'll use the selected videos from the picker
          // In a real implementation, you'd want to load all gallery videos
          const videoAssets = response.assets.map((asset, index) => ({
            id: asset.fileName || `video_${index}`,
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            duration: asset.duration || 0,
            fileSize: asset.fileSize,
            type: asset.type,
            fileName: asset.fileName,
            // For video thumbnails, we'll use the uri as placeholder
            // In a real implementation, you'd generate actual thumbnails
            thumbnail: asset.uri,
          }));

          setVideos(videoAssets);
        }
      });
    } catch (error) {
      console.error('Error loading videos:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load videos from gallery.');
    }
  };

  const handleVideoPress = video => {
    if (!allowMultipleSelection) {
      // Single selection mode
      onSelection([video]);
      return;
    }

    // Multiple selection mode
    const isSelected = selectedVideos.find(
      selected => selected.id === video.id,
    );

    if (isSelected) {
      // Remove from selection
      const newSelection = selectedVideos.filter(
        selected => selected.id !== video.id,
      );
      setSelectedVideos(newSelection);
    } else {
      // Add to selection if under limit
      if (selectedVideos.length < selectionLimit) {
        const newSelection = [...selectedVideos, video];
        setSelectedVideos(newSelection);
      } else {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${selectionLimit} videos.`,
        );
      }
    }
  };

  const handleDonePress = () => {
    if (selectedVideos.length === 0) {
      Alert.alert('No Selection', 'Please select at least one video.');
      return;
    }
    onSelection(selectedVideos);
  };

  const isVideoSelected = videoId => {
    return (
      selectedVideos.find(selected => selected.id === videoId) !== undefined
    );
  };

  const formatDuration = duration => {
    if (!duration) return '0:00';

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = bytes => {
    if (!bytes) return '';

    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)}MB`;
    }

    const kb = bytes / 1024;
    return `${kb.toFixed(0)}KB`;
  };

  const renderVideoItem = ({ item }) => {
    const isSelected = isVideoSelected(item.id);
    const selectionIndex = selectedVideos.findIndex(
      selected => selected.id === item.id,
    );

    return (
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.7}
      >
        {/* Video Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.thumbnail }}
            style={[styles.thumbnail, isSelected && styles.selectedThumbnail]}
            resizeMode="cover"
          />

          {/* Play Button Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(item.duration)}
            </Text>
          </View>

          {/* Selection Overlay */}
          {allowMultipleSelection && (
            <View style={styles.selectionOverlay}>
              <View
                style={[
                  styles.selectionCircle,
                  isSelected && styles.selectedCircle,
                ]}
              >
                {isSelected && (
                  <Text style={styles.selectionNumber}>
                    {selectionIndex + 1}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Video Info */}
        <View style={styles.videoInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.fileName || 'Video'}
          </Text>
          <Text style={styles.fileSize}>{formatFileSize(item.fileSize)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎬</Text>
      <Text style={styles.emptyTitle}>No Videos Found</Text>
      <Text style={styles.emptySubtitle}>
        No videos were found in your video library.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadVideos}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPermissionDenied = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔒</Text>
      <Text style={styles.emptyTitle}>Permission Required</Text>
      <Text style={styles.emptySubtitle}>
        Video library access is required to select videos.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={initializeGallery}>
        <Text style={styles.retryButtonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Videos</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Videos</Text>
          <View style={styles.placeholder} />
        </View>
        {renderPermissionDenied()}
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
        <Text style={styles.title}>
          {allowMultipleSelection ? 'Select Videos' : 'Select Video'}
        </Text>
        {allowMultipleSelection && selectedVideos.length > 0 ? (
          <TouchableOpacity onPress={handleDonePress} style={styles.doneButton}>
            <Text style={styles.doneText}>Done ({selectedVideos.length})</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Selection Info */}
      {allowMultipleSelection && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoText}>
            {selectedVideos.length} of {selectionLimit} selected
          </Text>
        </View>
      )}

      {/* Videos Grid */}
      {videos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  doneButton: {
    paddingVertical: spacing.sm,
  },
  doneText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  placeholder: {
    width: 60, // Same width as buttons for centering
  },
  selectionInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundLight,
  },
  selectionInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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
  gridContainer: {
    padding: spacing.lg,
  },
  videoContainer: {
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    marginRight: spacing.md,
    marginBottom: spacing.lg,
  },
  thumbnailContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedThumbnail: {
    opacity: 0.7,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: colors.textDark,
    marginLeft: 2, // Slight offset to center the triangle
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    ...typography.caption,
    color: colors.background,
    fontSize: 10,
    fontWeight: '600',
  },
  selectionOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: colors.primary,
    borderColor: colors.background,
  },
  selectionNumber: {
    ...typography.caption,
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  videoInfo: {
    marginTop: spacing.xs,
  },
  fileName: {
    ...typography.caption,
    color: colors.textDark,
    fontWeight: '500',
  },
  fileSize: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background,
    fontWeight: '600',
  },
});

export default VideoGalleryPicker;
