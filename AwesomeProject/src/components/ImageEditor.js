import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  Dimensions,
  ScrollView,
  PanResponder,
  Animated,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';
import { MEDIA_CONFIG } from '../config/media';
import fileCleanupManager from '../utils/FileCleanupManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Performance optimization: Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const CROP_ASPECT_RATIOS = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
];

const DRAWING_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFFFF', // White
  '#000000', // Black
];

const BRUSH_SIZES = [2, 4, 6, 8, 12, 16];

const TEXT_FONT_SIZES = [16, 20, 24, 28, 32, 40];
const TEXT_COLORS = DRAWING_COLORS; // Reuse the same colors

const ImageEditor = ({ visible, imageUri, onSave, onCancel }) => {
  const [editingMode, setEditingMode] = useState(null); // 'crop', 'draw', 'text', null
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    CROP_ASPECT_RATIOS[0],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Drawing state
  const [drawingPaths, setDrawingPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedColor, setSelectedColor] = useState(DRAWING_COLORS[0]);
  const [selectedBrushSize, setSelectedBrushSize] = useState(BRUSH_SIZES[2]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Text state
  const [textOverlays, setTextOverlays] = useState([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0]);
  const [selectedFontSize, setSelectedFontSize] = useState(TEXT_FONT_SIZES[2]);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [editingTextIndex, setEditingTextIndex] = useState(null);

  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const scrollViewRef = useRef(null);
  const cropPanRef = useRef(new Animated.ValueXY()).current;
  const loadStartTime = useRef(0);

  // Performance optimization: Memoize expensive calculations
  const imageDimensions = useMemo(() => {
    return calculateImageDimensions();
  }, [imageLayout.width, imageLayout.height, rotation]);

  // Performance optimization: Debounced save to history
  const saveToHistoryDebounced = useCallback(
    debounce(() => {
      saveToHistory();
    }, 300),
    [drawingPaths, textOverlays, rotation, cropArea]
  );

  // Performance optimization: Memoized pan responders
  const cropPanResponder = useMemo(() => createCropPanResponder(), [editingMode, cropArea]);
  const drawingPanResponder = useMemo(() => createDrawingPanResponder(), [editingMode, selectedColor, selectedBrushSize]);
  const textPanResponder = useMemo(() => createTextPanResponder(), [editingMode]);

  // Track loading performance
  useEffect(() => {
    if (visible && imageUri) {
      loadStartTime.current = Date.now();
      setImageLoading(true);
      setImageError(false);
    }
  }, [visible, imageUri]);

  const handleSave = () => {
    // Register the original image for cleanup after editing
    if (imageUri) {
      fileCleanupManager.registerTempFile(imageUri, null, 'edited_original');
    }
    
    // For now, just return the original image URI
    // Will be enhanced with actual editing functionality
    onSave(imageUri);
  };

  const handleCancel = () => {
    // Clean up any temporary editing files when cancelling
    if (imageUri) {
      fileCleanupManager.registerTempFile(imageUri, null, 'cancelled_edit');
    }
    
    onCancel();
  };

  const handleImageLoad = useCallback((event) => {
    const loadTime = Date.now() - loadStartTime.current;
    
    // Performance monitoring
    if (__DEV__ && loadTime > 500) {
      console.warn(`Image Editor loading took ${loadTime}ms, exceeding 500ms target`);
    }

    const { width, height } = event.nativeEvent.source;
    setImageLayout({ width, height });
    setImageLoading(false);
    
    // Initialize crop area to full image
    const imageDims = calculateImageDimensions(width, height);
    setCropArea({
      x: 0,
      y: 0,
      width: imageDims.width,
      height: imageDims.height,
    });
  }, []);

  const handleImageError = useCallback((error) => {
    console.error('Image loading error:', error);
    setImageError(true);
    setImageLoading(false);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
    // Use debounced save to history
    saveToHistoryDebounced();
  }, [saveToHistoryDebounced]);

  const calculateImageDimensions = (
    imgWidth = imageLayout.width,
    imgHeight = imageLayout.height,
  ) => {
    if (!imgWidth || !imgHeight) {
      return { width: screenWidth, height: screenWidth };
    }

    // Adjust dimensions based on rotation
    let width = imgWidth;
    let height = imgHeight;
    if (rotation === 90 || rotation === 270) {
      width = imgHeight;
      height = imgWidth;
    }

    const aspectRatio = width / height;
    const maxWidth = screenWidth - 40;
    const maxHeight = screenHeight - 300; // Account for header and toolbar

    let displayWidth = maxWidth;
    let displayHeight = displayWidth / aspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }

    return { width: displayWidth, height: displayHeight };
  };

  const initializeCropArea = imageDims => {
    const cropWidth = imageDims.width * 0.8;
    const cropHeight = selectedAspectRatio.ratio
      ? cropWidth / selectedAspectRatio.ratio
      : imageDims.height * 0.8;

    setCropArea({
      x: (imageDims.width - cropWidth) / 2,
      y: (imageDims.height - cropHeight) / 2,
      width: cropWidth,
      height: Math.min(cropHeight, imageDims.height * 0.8),
    });
  };

  const createCropPanResponder = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => editingMode === 'crop',
      onMoveShouldSetPanResponder: () => editingMode === 'crop',
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (editingMode !== 'crop') return;

        const imageDims = calculateImageDimensions();
        const newX = Math.max(
          0,
          Math.min(
            gestureState.moveX - imageDims.width / 2,
            imageDims.width - cropArea.width,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(
            gestureState.moveY - imageDims.height / 2,
            imageDims.height - cropArea.height,
          ),
        );

        setCropArea(prev => ({
          ...prev,
          x: newX,
          y: newY,
        }));
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    });
  };

  const cropPanResponder = createCropPanResponder();

  const createDrawingPanResponder = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => editingMode === 'draw',
      onMoveShouldSetPanResponder: () => editingMode === 'draw',
      onPanResponderGrant: evt => {
        if (editingMode !== 'draw') return;

        setIsDrawing(true);
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: evt => {
        if (editingMode !== 'draw' || !isDrawing) return;

        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (editingMode !== 'draw' || !isDrawing) return;

        setIsDrawing(false);
        if (currentPath) {
          setDrawingPaths(prev => [
            ...prev,
            {
              path: currentPath,
              color: selectedColor,
              strokeWidth: selectedBrushSize,
            },
          ]);
          setCurrentPath('');
          // Save to history after drawing is complete
          setTimeout(() => saveToHistory(), 100);
        }
        }
      },
    });
  };

  const drawingPanResponder = createDrawingPanResponder();

  const createTextPanResponder = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => editingMode === 'text',
      onMoveShouldSetPanResponder: () => editingMode === 'text',
      onPanResponderGrant: evt => {
        if (editingMode !== 'text') return;

        const { locationX, locationY } = evt.nativeEvent;
        setTextPosition({ x: locationX, y: locationY });
        setShowTextModal(true);
      },
    });
  };

  const textPanResponder = createTextPanResponder();

  const handleAddText = () => {
    if (textInput.trim()) {
      if (editingTextIndex !== null) {
        // Edit existing text
        const updatedTexts = [...textOverlays];
        updatedTexts[editingTextIndex] = {
          ...updatedTexts[editingTextIndex],
          text: textInput,
          color: selectedTextColor,
          fontSize: selectedFontSize,
        };
        setTextOverlays(updatedTexts);
        setEditingTextIndex(null);
      } else {
        // Add new text
        const newText = {
          id: Date.now(),
          text: textInput,
          x: textPosition.x,
          y: textPosition.y,
          color: selectedTextColor,
          fontSize: selectedFontSize,
        };
        setTextOverlays(prev => [...prev, newText]);
      }

      setTextInput('');
      setShowTextModal(false);
      // Save to history after text is added/edited
      setTimeout(() => saveToHistory(), 100);
    }
  };

  const handleEditText = index => {
    const textToEdit = textOverlays[index];
    setTextInput(textToEdit.text);
    setSelectedTextColor(textToEdit.color);
    setSelectedFontSize(textToEdit.fontSize);
    setEditingTextIndex(index);
    setShowTextModal(true);
  };

  const handleDeleteText = index => {
    setTextOverlays(prev => prev.filter((_, i) => i !== index));
    // Save to history after text is deleted
    setTimeout(() => saveToHistory(), 100);
  };

  // Undo/Redo functionality
  const saveToHistory = () => {
    const currentState = {
      drawingPaths: [...drawingPaths],
      textOverlays: [...textOverlays],
      rotation,
      cropArea: { ...cropArea },
    };

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);

    // Limit history to 20 items
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }

    setHistory(newHistory);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setDrawingPaths(previousState.drawingPaths);
      setTextOverlays(previousState.textOverlays);
      setRotation(previousState.rotation);
      setCropArea(previousState.cropArea);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDrawingPaths(nextState.drawingPaths);
      setTextOverlays(nextState.textOverlays);
      setRotation(nextState.rotation);
      setCropArea(nextState.cropArea);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Initialize history when component mounts or image changes
  useEffect(() => {
    if (imageUri && history.length === 0) {
      const initialState = {
        drawingPaths: [],
        textOverlays: [],
        rotation: 0,
        cropArea: { x: 0, y: 0, width: 0, height: 0 },
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [imageUri, history.length]);

  const renderToolbar = () => {
    return (
      <View style={styles.toolbar}>
        {editingMode === 'crop' && (
          <View style={styles.aspectRatioSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aspectRatioContent}
            >
              {CROP_ASPECT_RATIOS.map((ratio, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.aspectRatioButton,
                    selectedAspectRatio.label === ratio.label &&
                      styles.aspectRatioButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedAspectRatio(ratio);
                    const imageDims = calculateImageDimensions();
                    initializeCropArea(imageDims);
                  }}
                >
                  <Text
                    style={[
                      styles.aspectRatioText,
                      selectedAspectRatio.label === ratio.label &&
                        styles.aspectRatioTextActive,
                    ]}
                  >
                    {ratio.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {editingMode === 'draw' && (
          <View style={styles.drawingToolsSelector}>
            {/* Color Picker */}
            <View style={styles.colorPickerSection}>
              <Text style={styles.toolSectionTitle}>Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorPickerContent}
              >
                {DRAWING_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Brush Size Picker */}
            <View style={styles.brushSizeSection}>
              <Text style={styles.toolSectionTitle}>Brush Size</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brushSizeContent}
              >
                {BRUSH_SIZES.map((size, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.brushSizeButton,
                      selectedBrushSize === size &&
                        styles.brushSizeButtonActive,
                    ]}
                    onPress={() => setSelectedBrushSize(size)}
                  >
                    <View
                      style={[
                        styles.brushSizeIndicator,
                        {
                          width: size + 4,
                          height: size + 4,
                          borderRadius: (size + 4) / 2,
                          backgroundColor: selectedColor,
                        },
                      ]}
                    />
                    <Text style={styles.brushSizeText}>{size}px</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {editingMode === 'text' && (
          <View style={styles.textToolsSelector}>
            {/* Text Color Picker */}
            <View style={styles.colorPickerSection}>
              <Text style={styles.toolSectionTitle}>Text Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorPickerContent}
              >
                {TEXT_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedTextColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedTextColor(color)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Font Size Picker */}
            <View style={styles.fontSizeSection}>
              <Text style={styles.toolSectionTitle}>Font Size</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fontSizeContent}
              >
                {TEXT_FONT_SIZES.map((size, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.fontSizeButton,
                      selectedFontSize === size && styles.fontSizeButtonActive,
                    ]}
                    onPress={() => setSelectedFontSize(size)}
                  >
                    <Text
                      style={[
                        styles.fontSizePreview,
                        { fontSize: Math.min(size, 16) },
                      ]}
                    >
                      A
                    </Text>
                    <Text style={styles.fontSizeText}>{size}px</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          <TouchableOpacity
            style={[
              styles.toolButton,
              editingMode === 'crop' && styles.toolButtonActive,
            ]}
            onPress={() => {
              const newMode = editingMode === 'crop' ? null : 'crop';
              setEditingMode(newMode);
              if (newMode === 'crop') {
                const imageDims = calculateImageDimensions();
                initializeCropArea(imageDims);
              }
            }}
          >
            <Text style={styles.toolButtonText}>✂️</Text>
            <Text style={styles.toolButtonLabel}>Crop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolButton,
              editingMode === 'draw' && styles.toolButtonActive,
            ]}
            onPress={() =>
              setEditingMode(editingMode === 'draw' ? null : 'draw')
            }
          >
            <Text style={styles.toolButtonText}>✏️</Text>
            <Text style={styles.toolButtonLabel}>Draw</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolButton,
              editingMode === 'text' && styles.toolButtonActive,
            ]}
            onPress={() =>
              setEditingMode(editingMode === 'text' ? null : 'text')
            }
          >
            <Text style={styles.toolButtonText}>T</Text>
            <Text style={styles.toolButtonLabel}>Text</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={handleRotate}>
            <Text style={styles.toolButtonText}>🔄</Text>
            <Text style={styles.toolButtonLabel}>Rotate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, !canUndo && styles.toolButtonDisabled]}
            onPress={undo}
            disabled={!canUndo}
          >
            <Text style={[styles.toolButtonText, !canUndo && styles.toolButtonTextDisabled]}>↶</Text>
            <Text style={[styles.toolButtonLabel, !canUndo && styles.toolButtonTextDisabled]}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, !canRedo && styles.toolButtonDisabled]}
            onPress={redo}
            disabled={!canRedo}
          >
            <Text style={[styles.toolButtonText, !canRedo && styles.toolButtonTextDisabled]}>↷</Text>
            <Text style={[styles.toolButtonLabel, !canRedo && styles.toolButtonTextDisabled]}>Redo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  const imageDimensions = calculateImageDimensions();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Image</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
          <Text style={styles.headerButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Image Display Area */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading image...</Text>
          </View>
        )}
        
        {imageError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load image</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setImageError(false);
              setImageLoading(true);
              loadStartTime.current = Date.now();
            }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          minimumZoomScale={0.5}
          maximumZoomScale={3}
          bouncesZoom={true}
          scrollEnabled={editingMode !== 'crop'}
        >
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  imageDimensions,
                  { transform: [{ rotate: `${rotation}deg` }] },
                  imageLoading && styles.imageHidden,
                ]}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onLoadStart={() => setImageLoading(true)}
                resizeMode="contain"
                // Performance optimizations
                fadeDuration={200}
                progressiveRenderingEnabled={true}
                cache="force-cache"
              />
            ) : (
              <View style={[styles.imagePlaceholder, imageDimensions]}>
                <Text style={styles.imagePlaceholderText}>🖼️</Text>
                <Text style={styles.imageInfoText}>No Image Selected</Text>
              </View>
            )}

            {/* Crop Overlay */}
            {editingMode === 'crop' && imageUri && (
              <View
                style={styles.cropOverlayContainer}
                {...cropPanResponder.panHandlers}
              >
                {/* Crop Area */}
                <View
                  style={[
                    styles.cropArea,
                    {
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    },
                  ]}
                >
                  {/* Corner handles */}
                  <View style={[styles.cropHandle, styles.cropHandleTopLeft]} />
                  <View
                    style={[styles.cropHandle, styles.cropHandleTopRight]}
                  />
                  <View
                    style={[styles.cropHandle, styles.cropHandleBottomLeft]}
                  />
                  <View
                    style={[styles.cropHandle, styles.cropHandleBottomRight]}
                  />
                </View>

                {/* Dimmed overlay */}
                <View style={styles.cropDimOverlay} pointerEvents="none">
                  <View style={[styles.cropDimArea, { height: cropArea.y }]} />
                  <View style={styles.cropDimMiddle}>
                    <View style={[styles.cropDimArea, { width: cropArea.x }]} />
                    <View
                      style={[
                        styles.cropDimArea,
                        {
                          width:
                            imageDimensions.width - cropArea.x - cropArea.width,
                        },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.cropDimArea,
                      {
                        height:
                          imageDimensions.height - cropArea.y - cropArea.height,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Drawing Overlay */}
            {editingMode === 'draw' && imageUri && (
              <View
                style={styles.drawingOverlayContainer}
                {...drawingPanResponder.panHandlers}
              >
                <Svg
                  style={styles.drawingSvg}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                >
                  {/* Render completed paths */}
                  {drawingPaths.map((pathData, index) => (
                    <Path
                      key={index}
                      d={pathData.path}
                      stroke={pathData.color}
                      strokeWidth={pathData.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}

                  {/* Render current path being drawn */}
                  {currentPath && (
                    <Path
                      d={currentPath}
                      stroke={selectedColor}
                      strokeWidth={selectedBrushSize}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                </Svg>
              </View>
            )}

            {/* Text Overlays */}
            {imageUri && (
              <View
                style={styles.textOverlayContainer}
                {...textPanResponder.panHandlers}
              >
                {textOverlays.map((textItem, index) => (
                  <TouchableOpacity
                    key={textItem.id}
                    style={[
                      styles.textOverlay,
                      {
                        left: textItem.x,
                        top: textItem.y,
                      },
                    ]}
                    onPress={() =>
                      editingMode === 'text' && handleEditText(index)
                    }
                    onLongPress={() =>
                      editingMode === 'text' && handleDeleteText(index)
                    }
                  >
                    <Text
                      style={[
                        styles.overlayText,
                        {
                          color: textItem.color,
                          fontSize: textItem.fontSize,
                        },
                      ]}
                    >
                      {textItem.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Editing Mode Overlay */}
        {editingMode && (
          <View style={styles.editingOverlay}>
            <Text style={styles.editingModeText}>
              {editingMode === 'crop' && 'Crop Mode - Drag to select area'}
              {editingMode === 'draw' && 'Draw Mode - Tap to draw'}
              {editingMode === 'text' && 'Text Mode - Tap to add text'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Toolbar */}
      {renderToolbar()}

      {/* Text Input Modal */}
      <Modal
        visible={showTextModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTextModal(false)}
      >
        <View style={styles.textModalOverlay}>
          <View style={styles.textModalContainer}>
            <Text style={styles.textModalTitle}>
              {editingTextIndex !== null ? 'Edit Text' : 'Add Text'}
            </Text>

            <TextInput
              style={styles.textModalInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Enter your text..."
              placeholderTextColor="#888"
              multiline={true}
              autoFocus={true}
            />

            <View style={styles.textModalButtons}>
              <TouchableOpacity
                style={styles.textModalButton}
                onPress={() => setShowTextModal(false)}
              >
                <Text style={styles.textModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.textModalButton, styles.textModalButtonPrimary]}
                onPress={handleAddText}
              >
                <Text
                  style={[
                    styles.textModalButtonText,
                    styles.textModalButtonTextPrimary,
                  ]}
                >
                  {editingTextIndex !== null ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 10,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    backgroundColor: 'transparent',
  },
  imageHidden: {
    opacity: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: spacing.md,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  imageInfoText: {
    color: 'white',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  editingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.md,
    borderRadius: 8,
    zIndex: 5,
  },
  editingModeText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  // Crop overlay styles
  cropOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cropArea: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  cropHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  cropHandleTopLeft: {
    top: -10,
    left: -10,
  },
  cropHandleTopRight: {
    top: -10,
    right: -10,
  },
  cropHandleBottomLeft: {
    bottom: -10,
    left: -10,
  },
  cropHandleBottomRight: {
    bottom: -10,
    right: -10,
  },
  cropDimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cropDimArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cropDimMiddle: {
    flexDirection: 'row',
  },
  // Aspect ratio selector styles
  aspectRatioSelector: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  aspectRatioContent: {
    paddingHorizontal: spacing.lg,
  },
  aspectRatioButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  aspectRatioButtonActive: {
    backgroundColor: colors.primary,
  },
  aspectRatioText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  aspectRatioTextActive: {
    color: 'white',
  },
  // Drawing tools styles
  drawingToolsSelector: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  colorPickerSection: {
    marginBottom: spacing.sm,
  },
  brushSizeSection: {
    marginBottom: spacing.xs,
  },
  toolSectionTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  colorPickerContent: {
    paddingHorizontal: spacing.lg,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: 'white',
  },
  brushSizeContent: {
    paddingHorizontal: spacing.lg,
  },
  brushSizeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  brushSizeButtonActive: {
    backgroundColor: colors.primary,
  },
  brushSizeIndicator: {
    marginBottom: 2,
  },
  brushSizeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '500',
  },
  // Drawing overlay styles
  drawingOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawingSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Text tools styles
  textToolsSelector: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fontSizeSection: {
    marginBottom: spacing.xs,
  },
  fontSizeContent: {
    paddingHorizontal: spacing.lg,
  },
  fontSizeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fontSizeButtonActive: {
    backgroundColor: colors.primary,
  },
  fontSizePreview: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  fontSizeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '500',
  },
  // Text overlay styles
  textOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textOverlay: {
    position: 'absolute',
    padding: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
  },
  overlayText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Text modal styles
  textModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textModalContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 300,
  },
  textModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  textModalInput: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  textModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textModalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  textModalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  textModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  textModalButtonTextPrimary: {
    color: 'white',
  },
  toolbar: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  toolbarContent: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    marginHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolButtonActive: {
    backgroundColor: colors.primary,
  },
  toolButtonText: {
    fontSize: 20,
    marginBottom: 2,
  },
  toolButtonLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  toolButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toolButtonTextDisabled: {
    color: '#666',
  },
});

export default ImageEditor;
