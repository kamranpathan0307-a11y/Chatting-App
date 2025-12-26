import { Platform } from 'react-native';
import PermissionManager from './PermissionManager';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  video: 25 * 1024 * 1024, // 25MB
  audio: 10 * 1024 * 1024, // 10MB
  document: 10 * 1024 * 1024, // 10MB
};

// Supported file types
export const SUPPORTED_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
  audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg'],
  document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'txt'],
};

/**
 * Check if a permission is granted
 * @param {string} permissionType - Type of permission to check
 * @returns {Promise<boolean>} - Whether permission is granted
 */
export const checkPermission = async permissionType => {
  try {
    const result = await PermissionManager.checkPermission(permissionType);
    return result.granted;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Request a permission from the user
 * @param {string} permissionType - Type of permission to request
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestPermission = async permissionType => {
  try {
    const result = await PermissionManager.requestPermission(permissionType);
    return result.granted;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension in lowercase
 */
export const getFileExtension = filename => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if file type is supported
 * @param {string} filename - The filename
 * @param {string} mediaType - The media type (image, video, audio, document)
 * @returns {boolean} - Whether file type is supported
 */
export const isFileTypeSupported = (filename, mediaType) => {
  const extension = getFileExtension(filename);
  return SUPPORTED_TYPES[mediaType]?.includes(extension) || false;
};

/**
 * Check if file size is within limits
 * @param {number} fileSize - File size in bytes
 * @param {string} mediaType - The media type (image, video, audio, document)
 * @returns {boolean} - Whether file size is within limits
 */
export const isFileSizeValid = (fileSize, mediaType) => {
  const limit = FILE_SIZE_LIMITS[mediaType];
  return limit ? fileSize <= limit : true;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get media type from MIME type
 * @param {string} mimeType - The MIME type
 * @returns {string} - Media type (image, video, audio, document)
 */
export const getMediaTypeFromMime = mimeType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

/**
 * Generate unique media ID
 * @returns {string} - Unique media ID
 */
export const generateMediaId = () => {
  return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Export PermissionManager for advanced permission handling
export { default as PermissionManager } from './PermissionManager';
