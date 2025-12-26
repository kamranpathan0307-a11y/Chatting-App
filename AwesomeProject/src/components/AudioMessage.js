import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

const AudioMessage = ({
  audioUrl,
  duration,
  isOutgoing = false,
  onPress,
  style,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  const formatTime = seconds => {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (onPress) {
      onPress();
      return;
    }

    try {
      setIsLoading(true);

      if (isPlaying) {
        // Pause audio
        setIsPlaying(false);
        // In a real implementation, you would pause the audio player here
      } else {
        // Play audio
        setIsPlaying(true);
        // In a real implementation, you would start the audio player here
        // For demo purposes, we'll simulate playback
        simulatePlayback();
      }
    } catch (error) {
      setHasError(true);
      console.error('Audio playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate audio playback for demo purposes
  const simulatePlayback = () => {
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        if (newTime >= totalDuration) {
          setIsPlaying(false);
          clearInterval(interval);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Store interval reference to clear it when component unmounts or stops
    return interval;
  };

  const renderPlayButton = () => {
    if (isLoading) {
      return (
        <View style={styles.playButton}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.playButton}>
          <Text style={styles.errorIcon}>⚠</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
        activeOpacity={0.7}
      >
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    );
  };

  const renderWaveform = () => {
    // Simple waveform visualization using bars
    const bars = Array.from({ length: 20 }, (_, index) => {
      const height = Math.random() * 20 + 5; // Random height between 5-25
      const isActive = isPlaying && (currentTime / totalDuration) * 20 > index;

      return (
        <View
          key={index}
          style={[
            styles.waveformBar,
            { height },
            isActive && styles.waveformBarActive,
          ]}
        />
      );
    });

    return <View style={styles.waveform}>{bars}</View>;
  };

  const renderProgressBar = () => {
    const progress =
      totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    isOutgoing ? styles.outgoingContainer : styles.incomingContainer,
    style,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.audioContent}>
        {renderPlayButton()}

        <View style={styles.audioInfo}>
          {renderWaveform()}
          {renderProgressBar()}

          <View style={styles.timeContainer}>
            <Text
              style={[styles.timeText, isOutgoing && styles.timeTextOutgoing]}
            >
              {isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}
            </Text>
          </View>
        </View>
      </View>

      {hasError && (
        <Text
          style={[styles.errorText, isOutgoing && styles.errorTextOutgoing]}
        >
          Unable to play audio
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs / 2,
    minWidth: 200,
    maxWidth: 280,
  },
  incomingContainer: {
    alignSelf: 'flex-start',
  },
  outgoingContainer: {
    alignSelf: 'flex-end',
  },
  audioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  playIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2, // Slight offset for play icon
  },
  errorIcon: {
    color: 'white',
    fontSize: 16,
  },
  audioInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 25,
    marginBottom: spacing.xs / 2,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: colors.border,
    borderRadius: 1.5,
  },
  waveformBarActive: {
    backgroundColor: colors.primary,
  },
  progressContainer: {
    marginBottom: spacing.xs / 2,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  timeTextOutgoing: {
    color: colors.messageTextOutgoing,
    opacity: 0.8,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs / 2,
  },
  errorTextOutgoing: {
    color: colors.error,
  },
});

export default memo(AudioMessage);
