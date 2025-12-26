const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/images',
    'uploads/videos', 
    'uploads/audio',
    'uploads/documents',
    'uploads/thumbnails'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize directories
createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio/';
    } else {
      uploadPath += 'documents/';
    }
    
    // Create date-based subdirectory
    const now = new Date();
    const dateDir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const fullPath = path.join(uploadPath, dateDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with user ID and timestamp
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for security and validation
const fileFilter = (req, file, cb) => {
  // Define allowed file types per requirements 7.2, 10.5
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'text/plain'
    ]
  };
  
  const allAllowedTypes = [
    ...allowedTypes.image,
    ...allowedTypes.video,
    ...allowedTypes.audio,
    ...allowedTypes.document
  ];
  
  // Check if file type is allowed
  if (!allAllowedTypes.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
  
  // Check file size limits per type
  const sizeLimit = getFileSizeLimit(file.mimetype);
  if (file.size && file.size > sizeLimit) {
    const sizeMB = (sizeLimit / (1024 * 1024)).toFixed(0);
    return cb(new Error(`File size exceeds ${sizeMB}MB limit for ${file.mimetype.split('/')[0]} files`), false);
  }
  
  cb(null, true);
};

// File size limits (in bytes) - per requirements 10.5
const getFileSizeLimit = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return 5 * 1024 * 1024; // 5MB for images
  } else if (mimetype.startsWith('video/')) {
    return 25 * 1024 * 1024; // 25MB for videos
  } else if (mimetype.startsWith('audio/')) {
    return 10 * 1024 * 1024; // 10MB for audio
  } else {
    return 10 * 1024 * 1024; // 10MB for documents
  }
};

const limits = {
  fileSize: 25 * 1024 * 1024, // Max file size (will be validated per type)
  files: 10 // Max 10 files per request
};

// Create multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Create type-specific upload middleware
const createTypeSpecificUpload = (mediaType) => {
  const typeSpecificFilter = (req, file, cb) => {
    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
      audio: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'text/plain'
      ]
    };

    if (!allowedTypes[mediaType] || !allowedTypes[mediaType].includes(file.mimetype)) {
      return cb(new Error(`Invalid file type for ${mediaType} upload. Expected: ${allowedTypes[mediaType]?.join(', ')}`), false);
    }

    // Check file size limits per type
    const sizeLimit = getFileSizeLimit(file.mimetype);
    if (file.size && file.size > sizeLimit) {
      const sizeMB = (sizeLimit / (1024 * 1024)).toFixed(0);
      return cb(new Error(`File size exceeds ${sizeMB}MB limit for ${mediaType} files`), false);
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter: typeSpecificFilter,
    limits: { fileSize: getFileSizeLimit(mediaType === 'video' ? 'video/' : mediaType === 'image' ? 'image/' : mediaType === 'audio' ? 'audio/' : 'application/') }
  });
};

// Export different upload configurations
module.exports = {
  uploadSingle: upload.single('media'),
  uploadMultiple: upload.array('media', 10),
  uploadFields: upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 },
    { name: 'audio', maxCount: 5 },
    { name: 'documents', maxCount: 10 }
  ]),
  // Type-specific uploads for dedicated endpoints
  uploadImage: createTypeSpecificUpload('image').single('image'),
  uploadVideo: createTypeSpecificUpload('video').single('video'),
  uploadAudio: createTypeSpecificUpload('audio').single('audio'),
  uploadDocument: createTypeSpecificUpload('document').single('document'),
  createUploadDirs,
  getFileSizeLimit
};