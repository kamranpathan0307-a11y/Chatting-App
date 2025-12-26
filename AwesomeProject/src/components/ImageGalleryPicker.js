import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import MediaCacheManager from '../utils/MediaCacheManager';
import {
  useProgressiveLoader,
  ViewportTracker,
  LazyMediaItem,
} from '../utils/ProgressiveLoader';
import { colors, spacing, typography } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_SIZE = (screenWidth - spacing.lg * 2 - spacing.sm * 2) / 3;

const ImageGalleryPicker = ({
  selectionLimit = 1,
  onSelection,
  onCancel,
  allowMultipleSelection = false,
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cachedThumbnails, setCachedThumbnails] = useState({});

  const flatListRef = useRef(null);
  const viewportTracker = useRef(null);
  const lazyItems = useRef(new Map());

  // Progressive loader for images
  const imageLoader = useCallback(async (page, pageSize) => {
    // In a real implementation, this would load images from device gallery
    // For now, we'll simulate with the existing image picker approach
    return new Promise(resolve => {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        selectionLimit: 0,
      };

      launchImageLibrary(options, response => {
        if (response.didCancel || response.errorMessage) {
          resolve({ items: [], hasMore: false });
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const imageAssets = response.assets.map((asset, index) => ({
            id: asset.fileName || `image_${Date.now()}_${index}`,
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize,
            type: asset.type,
            fileName: asset.fileName,
            thumbnail: asset.uri, // For images, thumbnail is the same as uri
          }));

          // Simulate pagination
          const startIndex = page * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedItems = imageAssets.slice(startIndex, endIndex);

          resolve({
            items: paginatedItems,
            hasMore: endIndex < imageAssets.length,
          });
        } else {
          resolve({ items: [], hasMore: false });
        }
      });
    });
  }, []);

  const {
    items: images,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useProgressiveLoader(imageLoader, {
    pageSize: 20,
    cacheEnabled: true,
    initialLoad: false, // We'll load manually after permission check
  });

  useEffect(() => {
    initializeGallery();

    // Initialize viewport tracker
    viewportTracker.current = new ViewportTracker(
      flatListRef,
      visibleItemIds => {
        // Handle visibility changes if needed
        console.log('Visible items:', visibleItemIds.length);
      },
    );

    return () => {
      if (viewportTracker.current) {
        viewportTracker.current.destroy();
      }
    };
  }, []);

  // Load cached thumbnails when images change
  useEffect(() => {
    loadCachedThumbnails();
  }, [images]);

  const initializeGallery = async () => {
    try {
      // Handle permissions for gallery access
      const permissionResult = await PermissionManager.handleMediaPermissions(
        'gallery',
      );

      if (!permissionResult.success) {
        setPermissionGranted(false);
        return;
      }

      setPermissionGranted(true);
      // Start loading images after permission is granted
      refresh();
    } catch (error) {
      console.error('Error initializing gallery:', error);
      Alert.alert('Error', 'Failed to access photo library. Please try again.');
    }
  };

  const loadCachedThumbnails = async () => {
    const thumbnailPromises = images.map(async image => {
      try {
        const cachedPath = await MediaCacheManager.getCachedThumbnail(image.id);
        return { id: image.id, cachedPath };
      } catch (error) {
        console.warn(`Failed to load cached thumbnail for ${image.id}:`, error);
        return { id: image.id, cachedPath: null };
      }
    });

    const results = await Promise.all(thumbnailPromises);
    const thumbnailMap = {};

    results.forEach(({ id, cachedPath }) => {
      if (cachedPath) {
        thumbnailMap[id] = cachedPath;
      }
    });

    setCachedThumbnails(thumbnailMap);
  };

  const handleImagePress = image => {
    if (!allowMultipleSelection) {
      // Single selection mode
      onSelection([image]);
      return;
    }

    // Multiple selection mode
    const isSelected = selectedImages.find(
      selected => selected.id === image.id,
    );

    if (isSelected) {
      // Remove from selection
      const newSelection = selectedImages.filter(
        selected => selected.id !== image.id,
      );
      setSelectedImages(newSelection);
    } else {
      // Add to selection if under limit
      if (selectedImages.length < selectionLimit) {
        const newSelection = [...selectedImages, image];
        setSelectedImages(newSelection);
      } else {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${selectionLimit} images.`,
        );
      }
    }
  };

  const handleDonePress = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Selection', 'Please select at least one image.');
      return;
    }
    onSelection(selectedImages);
  };

  const isImageSelected = imageId => {
    return (
      selectedImages.find(selected => selected.id === imageId) !== undefined
    );
  };

  const renderImageItem = ({ item, index }) => {
    const isSelected = isImageSelected(item.id);
    const selectionIndex = selectedImages.findIndex(
      selected => selected.id === item.id,
    );

    // Get cached thumbnail or fallback to original
    const thumbnailUri = cachedThumbnails[item.id] || item.uri;

    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => handleImagePress(item)}
        activeOpacity={0.7}
        onLayout={event => {
          const { x, y, width, height } = event.nativeEvent.layout;

          // Create lazy item if not exists
          if (!lazyItems.current.has(item.id)) {
            const lazyItem = new LazyMediaItem(item, lazyItem => {
              // Cache thumbnail when item becomes visible
              if (!cachedThumbnails[item.id]) {
                MediaCacheManager.cacheThumbnail(item.id, item.uri, {
                  type: 'image',
                  originalUrl: item.uri,
                })
                  .then(cachedPath => {
                    setCachedThumbnails(prev => ({
                      ...prev,
                      [item.id]: cachedPath,
                    }));
                  })
                  .catch(error => {
                    console.warn(
                      `Failed to cache thumbnail for ${item.id}:`,
                      error,
                    );
                  });
              }
            });
            lazyItems.current.set(item.id, lazyItem);
          }

          // Update viewport tracker
          if (viewportTracker.current) {
            viewportTracker.current.updateLayout(item.id, {
              x,
              y,
              width,
              height,
            });
          }
        }}
      >
        <Image
          source={{ uri: thumbnailUri }}
          style={[styles.image, isSelected && styles.selectedImage]}
          resizeMode="cover"
          onLoadStart={() => {
            // Could add loading indicator here
          }}
          onLoadEnd={() => {
            // Image loaded successfully
          }}
          onError={error => {
            console.warn(`Failed to load image ${item.id}:`, error);
          }}
        />

        {allowMultipleSelection && (
          <View style={styles.selectionOverlay}>
            <View
              style={[
                styles.selectionCircle,
                isSelected && styles.selectedCircle,
              ]}
            >
              {isSelected && (
                <Text style={styles.selectionNumber}>{selectionIndex + 1}</Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>No Images Found</Text>
      <Text style={styles.emptySubtitle}>
        No images were found in your photo library.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={refresh}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPermissionDenied = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔒</Text>
      <Text style={styles.emptyTitle}>Permission Required</Text>
      <Text style={styles.emptySubtitle}>
        Photo library access is required to select images.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={initializeGallery}>
        <Text style={styles.retryButtonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more images...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loading && !loadingMore) {
      loadMore();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Images</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading images...</Text>
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
          <Text style={styles.title}>Select Images</Text>
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
          {allowMultipleSelection ? 'Select Images' : 'Select Image'}
        </Text>
        {allowMultipleSelection && selectedImages.length > 0 ? (
          <TouchableOpacity onPress={handleDonePress} style={styles.doneButton}>
            <Text style={styles.doneText}>Done ({selectedImages.length})</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Selection Info */}
      {allowMultipleSelection && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoText}>
            {selectedImages.length} of {selectionLimit} selected
          </Text>
        </View>
      )}

      {/* Images Grid */}
      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Error Loading Images</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : images.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImageItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          onScroll={viewportTracker.current?.onScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={15}
          getItemLayout={(data, index) => ({
            length: ITEM_SIZE + spacing.sm,
            offset: Math.floor(index / 3) * (ITEM_SIZE + spacing.sm),
            index,
          })}
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
  imageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  selectedImage: {
    opacity: 0.7,
    borderWidth: 3,
    borderColor: colors.primary,
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerLoaderText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

export default ImageGalleryPicker;
