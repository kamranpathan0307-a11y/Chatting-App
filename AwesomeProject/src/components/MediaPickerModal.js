import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../theme';
import { MEDIA_CONFIG } from '../config/media';
import PerformanceMonitor from '../utils/PerformanceMonitor';

const { height: screenHeight } = Dimensions.get('window');

const MediaPickerModal = ({
  visible,
  onClose,
  onCameraPress,
  onImageGalleryPress,
  onVideoGalleryPress,
  onAudioPress,
  onDocumentPress,
}) => {
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0.95);
  const animationStartTime = useRef(0);

  // Optimized animation configuration for 300ms target
  const ANIMATION_DURATION = Math.min(
    MEDIA_CONFIG.MODAL_ANIMATION_DURATION,
    250,
  );
  const SPRING_CONFIG = {
    damping: 25,
    stiffness: 400,
    mass: 0.8,
  };
  const TIMING_CONFIG = {
    duration: ANIMATION_DURATION,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Use bezier instead of out(cubic)
  };

  useEffect(() => {
    if (visible) {
      animationStartTime.current = Date.now();
      PerformanceMonitor.startTimer('modalAnimation', { action: 'open' });

      // Animate in with optimized timing
      translateY.value = withSpring(0, SPRING_CONFIG, () => {
        const duration = Date.now() - animationStartTime.current;
        runOnJS(PerformanceMonitor.endTimer)('modalAnimation', {
          action: 'open',
          duration,
        });
      });
      backdropOpacity.value = withTiming(1, TIMING_CONFIG);
      scaleValue.value = withSpring(1, SPRING_CONFIG);
    } else {
      PerformanceMonitor.startTimer('modalAnimation', { action: 'close' });

      // Animate out faster for better responsiveness
      const quickConfig = {
        duration: ANIMATION_DURATION * 0.8, // 20% faster exit
        easing: Easing.bezier(0.4, 0.0, 1, 1), // Use bezier instead of in(cubic)
      };

      translateY.value = withTiming(screenHeight, quickConfig, () => {
        const duration = Date.now() - animationStartTime.current;
        runOnJS(PerformanceMonitor.endTimer)('modalAnimation', {
          action: 'close',
          duration,
        });
      });
      backdropOpacity.value = withTiming(0, quickConfig);
      scaleValue.value = withTiming(0.95, quickConfig);
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scaleValue.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleOptionPress = callback => {
    // Measure animation performance with PerformanceMonitor
    const animationTime = Date.now() - animationStartTime.current;
    PerformanceMonitor.recordMetric('modalAnimation', animationTime, {
      action: 'interaction',
      callback: callback?.name || 'unknown',
    });

    // Quick exit animation
    const exitConfig = {
      duration: ANIMATION_DURATION * 0.7,
      easing: Easing.bezier(0.4, 0.0, 0.6, 1), // Use bezier instead of in(quad)
    };

    translateY.value = withTiming(screenHeight, exitConfig);
    backdropOpacity.value = withTiming(0, exitConfig);
    scaleValue.value = withTiming(0.9, exitConfig, () => {
      runOnJS(onClose)();
      if (callback) {
        // Delay callback slightly to ensure smooth transition
        setTimeout(() => runOnJS(callback)(), 50);
      }
    });
  };

  const handleBackdropPress = () => {
    handleOptionPress();
  };

  const mediaOptions = [
    {
      id: 'camera',
      title: 'Camera',
      icon: '📷',
      onPress: onCameraPress,
      color: colors.primary,
    },
    {
      id: 'imageGallery',
      title: 'Image Gallery',
      icon: '🖼️',
      onPress: onImageGalleryPress,
      color: '#FF6B6B',
    },
    {
      id: 'videoGallery',
      title: 'Video Gallery',
      icon: '🎬',
      onPress: onVideoGalleryPress,
      color: '#4ECDC4',
    },
    {
      id: 'audio',
      title: 'Audio',
      icon: '🎵',
      onPress: onAudioPress,
      color: '#45B7D1',
    },
    {
      id: 'document',
      title: 'Documents',
      icon: '📄',
      onPress: onDocumentPress,
      color: '#96CEB4',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View style={[styles.bottomSheet, animatedModalStyle]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>Share Media</Text>

          {/* Options Grid */}
          <View style={styles.optionsContainer}>
            {mediaOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={() => handleOptionPress(option.onPress)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: option.color },
                  ]}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBackdropPress}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  optionButton: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '18%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
});

export default MediaPickerModal;
