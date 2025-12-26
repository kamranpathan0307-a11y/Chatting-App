// Media configuration constants

export const MEDIA_CONFIG = {
  // API endpoints
  UPLOAD_ENDPOINT: '/api/media/upload',
  UPLOAD_MULTIPLE_ENDPOINT: '/api/media/upload/multiple',
  SERVE_ENDPOINT: '/api/media/serve',

  // Upload settings
  MAX_CONCURRENT_UPLOADS: 3,
  UPLOAD_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds

  // Compression settings
  IMAGE_QUALITY: 0.8, // 80% quality
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_MAX_HEIGHT: 1920,

  // Video settings
  VIDEO_QUALITY: 'medium',
  VIDEO_MAX_DURATION: 300, // 5 minutes in seconds

  // Audio settings
  AUDIO_QUALITY: 'medium',
  AUDIO_MAX_DURATION: 600, // 10 minutes in seconds

  // UI settings
  THUMBNAIL_SIZE: 150,
  ANIMATION_DURATION: 300,
  MODAL_ANIMATION_DURATION: 250,

  // Cache settings
  CACHE_SIZE_LIMIT: 100 * 1024 * 1024, // 100MB
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
};

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const PICKER_OPTIONS = {
  CAMERA: 'camera',
  IMAGE_GALLERY: 'imageGallery',
  VIDEO_GALLERY: 'videoGallery',
  AUDIO: 'audio',
  DOCUMENT: 'document',
};
