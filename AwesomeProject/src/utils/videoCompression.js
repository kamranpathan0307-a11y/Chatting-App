import { Platform, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import fileCleanupManager from './FileCleanupManager';

/**
 * Video compression utility for React Native
 * This provides a simplified compression interface that can be extended
 * with native compression libraries as needed
 */

export const COMPRESSION_PRESETS = {
  LOW: {
    quality: 'low',
    bitrate: '500k',
    resolution: '480x360',
    description: 'Low quality, smallest file size',
  },
  MEDIUM: {
    quality: 'medium',
    bitrate: '1000k',
    resolution: '720x480',
    description: 'Medium quality, balanced size',
  },
  HIGH: {
    quality: 'high',
    bitrate: '2000k',
    resolution: '1280x720',
    description: 'High quality, larger file size',
  },
};

/**
 * Check if video needs compression based on file size
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes (default 25MB)
 * @returns {boolean} - Whether compression is needed
 */
export const needsCompression = (fileSize, maxSize = 25 * 1024 * 1024) => {
  return fileSize > maxSize;
};

/**
 * Get recommended compression preset based on file size
 * @param {number} fileSize - File size in bytes
 * @returns {object} - Compression preset
 */
export const getRecommendedPreset = fileSize => {
  const sizeMB = fileSize / (1024 * 1024);

  if (sizeMB > 100) {
    return COMPRESSION_PRESETS.LOW;
  } else if (sizeMB > 50) {
    return COMPRESSION_PRESETS.MEDIUM;
  } else {
    return COMPRESSION_PRESETS.HIGH;
  }
};

/**
 * Simulate video compression with progress callbacks
 * This is a placeholder implementation that simulates compression
 * In a real app, this would use native compression libraries
 *
 * @param {string} inputPath - Path to input video file
 * @param {object} options - Compression options
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} - Compression result
 */
export const compressVideo = async (
  inputPath,
  options = {},
  onProgress = () => {},
) => {
  try {
    const {
      preset = COMPRESSION_PRESETS.MEDIUM,
      outputPath = null,
      quality = 'medium',
      uploadId = null,
    } = options;

    // Generate output path if not provided
    const timestamp = Date.now();
    const outputFilePath =
      outputPath ||
      `${RNFS.CachesDirectoryPath}/compressed_video_${timestamp}.mp4`;

    // Register temporary files for cleanup
    fileCleanupManager.registerTempFile(inputPath, uploadId, 'original');
    fileCleanupManager.registerTempFile(outputFilePath, uploadId, 'compressed');

    // Simulate compression progress
    return new Promise((resolve, reject) => {
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random progress between 5-20%

        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);

          // Simulate compression completion
          setTimeout(() => {
            resolve({
              success: true,
              outputPath: outputFilePath,
              originalSize: 0, // Would be calculated from input file
              compressedSize: 0, // Would be calculated from output file
              compressionRatio: 0.6, // Simulated 40% size reduction
              preset: preset,
              duration: 0, // Would be extracted from video metadata
            });
          }, 500);
        }

        onProgress(Math.min(progress, 100));
      }, 200);

      // Simulate potential compression failure
      setTimeout(() => {
        if (Math.random() < 0.05) {
          // 5% chance of failure for testing
          clearInterval(progressInterval);

          // Clean up on failure
          if (uploadId) {
            fileCleanupManager.cleanupAfterFailedUpload(uploadId);
          }

          reject(new Error('Compression failed: Simulated error'));
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Video compression error:', error);
    throw new Error(`Compression failed: ${error.message}`);
  }
};

/**
 * Get video file information
 * @param {string} filePath - Path to video file
 * @returns {Promise<object>} - Video information
 */
export const getVideoInfo = async filePath => {
  try {
    const fileStats = await RNFS.stat(filePath);

    // In a real implementation, this would extract video metadata
    // using a library like react-native-video-processing or FFmpeg
    return {
      size: fileStats.size,
      duration: 0, // Would be extracted from video
      width: 0, // Would be extracted from video
      height: 0, // Would be extracted from video
      bitrate: 0, // Would be extracted from video
      format: 'mp4', // Would be detected from file
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};

/**
 * Cancel ongoing compression
 * @param {string} compressionId - ID of compression to cancel
 */
export const cancelCompression = compressionId => {
  // In a real implementation, this would cancel the native compression process
  console.log('Cancelling compression:', compressionId);
};

/**
 * Clean up temporary compression files
 * @param {string} filePath - Path to file to clean up
 */
export const cleanupTempFile = async filePath => {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
      console.log('Cleaned up temp file:', filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
};

/**
 * Show compression options dialog to user
 * @param {number} fileSize - Original file size in bytes
 * @returns {Promise<object>} - Selected compression preset
 */
export const showCompressionDialog = fileSize => {
  return new Promise(resolve => {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    const recommended = getRecommendedPreset(fileSize);

    Alert.alert(
      'Video Compression',
      `Your video is ${sizeMB}MB. Choose compression quality:`,
      [
        {
          text: 'Low Quality',
          onPress: () => resolve(COMPRESSION_PRESETS.LOW),
        },
        {
          text: 'Medium Quality',
          onPress: () => resolve(COMPRESSION_PRESETS.MEDIUM),
        },
        {
          text: 'High Quality',
          onPress: () => resolve(COMPRESSION_PRESETS.HIGH),
        },
        {
          text: `Recommended (${recommended.quality})`,
          onPress: () => resolve(recommended),
          style: 'default',
        },
      ],
      { cancelable: false },
    );
  });
};

export default {
  compressVideo,
  needsCompression,
  getRecommendedPreset,
  getVideoInfo,
  cancelCompression,
  cleanupTempFile,
  showCompressionDialog,
  COMPRESSION_PRESETS,
};
