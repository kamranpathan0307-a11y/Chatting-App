const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { 
  uploadSingle, 
  uploadMultiple, 
  uploadImage, 
  uploadVideo, 
  uploadAudio, 
  uploadDocument,
  getFileSizeLimit 
} = require('../middleware/mediaUpload');
const auth = require('../middleware/auth');
const MediaProcessor = require('../services/mediaProcessor');
const fileCleanupService = require('../services/fileCleanupService');

// Helper function to create media response object
const createMediaResponse = async (file, userId, processResults = null) => {
  const mediaData = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: file.mimetype.split('/')[0],
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
    uploadedBy: userId,
    url: `/api/media/serve/${path.basename(file.path)}`,
    thumbnailUrl: null,
    compressed: false
  };

  if (processResults) {
    if (processResults.thumbnailPath) {
      mediaData.thumbnailUrl = `/api/media/thumbnail/${path.basename(processResults.thumbnailPath)}`;
    }
    if (processResults.compressedPath) {
      mediaData.compressed = true;
      mediaData.compressedPath = processResults.compressedPath;
      mediaData.originalSize = file.size;
      mediaData.compressedSize = fs.existsSync(processResults.compressedPath) 
        ? fs.statSync(processResults.compressedPath).size 
        : file.size;
    }
  }

  return mediaData;
};

// POST /api/media/upload/image - Upload image files
router.post('/upload/image', auth, uploadImage, async (req, res) => {
  const uploadId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file uploaded' 
      });
    }

    // Register the uploaded file for cleanup tracking
    fileCleanupService.registerTempFile(req.file.path, uploadId, 'original');

    // Process the image (compress and generate thumbnail)
    let processResults = null;
    try {
      fileCleanupService.registerProcessingFile(req.file.path, 'image_processing');
      
      processResults = await MediaProcessor.processUploadedMedia(
        req.file.path, 
        req.file.mimetype,
        {
          image: { quality: 80, maxWidth: 1920, maxHeight: 1080 },
          thumbnail: { width: 150, height: 150, quality: 70 }
        }
      );

      // Register processed files for cleanup tracking
      if (processResults.compressedPath) {
        fileCleanupService.registerTempFile(processResults.compressedPath, uploadId, 'compressed');
      }
      if (processResults.thumbnailPath) {
        fileCleanupService.registerTempFile(processResults.thumbnailPath, uploadId, 'thumbnail');
      }

      fileCleanupService.unregisterProcessingFile(req.file.path);
    } catch (processError) {
      console.warn('Image processing failed, continuing without processing:', processError.message);
      fileCleanupService.unregisterProcessingFile(req.file.path);
    }

    const mediaData = await createMediaResponse(req.file, req.user.id, processResults);
    
    // Clean up temporary files after successful processing (keep original and final files)
    await fileCleanupService.cleanupAfterSuccessfulUpload(uploadId, true);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      media: mediaData
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Clean up all files on error
    await fileCleanupService.cleanupAfterFailedUpload(uploadId);
    
    res.status(500).json({ 
      success: false,
      error: 'Image upload failed',
      details: error.message 
    });
  }
});

// POST /api/media/upload/video - Upload video files
router.post('/upload/video', auth, uploadVideo, async (req, res) => {
  const uploadId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No video file uploaded' 
      });
    }

    // Register the uploaded file for cleanup tracking
    fileCleanupService.registerTempFile(req.file.path, uploadId, 'original');

    // Process the video (compress if large and generate thumbnail)
    let processResults = null;
    try {
      fileCleanupService.registerProcessingFile(req.file.path, 'video_processing');
      
      const shouldCompress = req.file.size > (10 * 1024 * 1024); // Compress if > 10MB
      processResults = await MediaProcessor.processUploadedMedia(
        req.file.path, 
        req.file.mimetype,
        {
          compressVideo: shouldCompress,
          video: { quality: 23, maxWidth: 1280, maxHeight: 720 },
          thumbnail: { width: 150, height: 150, timeOffset: '00:00:01' }
        }
      );

      // Register processed files for cleanup tracking
      if (processResults.compressedPath) {
        fileCleanupService.registerTempFile(processResults.compressedPath, uploadId, 'compressed');
      }
      if (processResults.thumbnailPath) {
        fileCleanupService.registerTempFile(processResults.thumbnailPath, uploadId, 'thumbnail');
      }

      fileCleanupService.unregisterProcessingFile(req.file.path);
    } catch (processError) {
      console.warn('Video processing failed, continuing without processing:', processError.message);
      fileCleanupService.unregisterProcessingFile(req.file.path);
    }

    const mediaData = await createMediaResponse(req.file, req.user.id, processResults);
    
    // Clean up temporary files after successful processing (keep original and final files)
    await fileCleanupService.cleanupAfterSuccessfulUpload(uploadId, true);
    
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      media: mediaData
    });
  } catch (error) {
    console.error('Video upload error:', error);
    
    // Clean up all files on error
    await fileCleanupService.cleanupAfterFailedUpload(uploadId);
    
    res.status(500).json({ 
      success: false,
      error: 'Video upload failed',
      details: error.message 
    });
  }
});

// POST /api/media/upload/audio - Upload audio files
router.post('/upload/audio', auth, uploadAudio, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No audio file uploaded' 
      });
    }

    // Process the audio (generate thumbnail)
    let processResults = null;
    try {
      processResults = await MediaProcessor.processUploadedMedia(
        req.file.path, 
        req.file.mimetype,
        {
          thumbnail: { width: 150, height: 150, backgroundColor: '#4A90E2' }
        }
      );
    } catch (processError) {
      console.warn('Audio processing failed, continuing without processing:', processError.message);
    }

    const mediaData = await createMediaResponse(req.file, req.user.id, processResults);
    
    res.json({
      success: true,
      message: 'Audio uploaded successfully',
      media: mediaData
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Audio upload failed',
      details: error.message 
    });
  }
});

// POST /api/media/upload/document - Upload document files
router.post('/upload/document', auth, uploadDocument, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No document file uploaded' 
      });
    }

    // Process the document (generate thumbnail)
    let processResults = null;
    try {
      processResults = await MediaProcessor.processUploadedMedia(
        req.file.path, 
        req.file.mimetype,
        {
          thumbnail: { width: 150, height: 150, backgroundColor: '#E74C3C' }
        }
      );
    } catch (processError) {
      console.warn('Document processing failed, continuing without processing:', processError.message);
    }

    const mediaData = await createMediaResponse(req.file, req.user.id, processResults);
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      media: mediaData
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Document upload failed',
      details: error.message 
    });
  }
});

// Upload single media file (legacy endpoint)
router.post('/upload', auth, uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mediaData = {
      id: Date.now().toString(),
      type: req.file.mimetype.split('/')[0], // image, video, audio, application
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      media: mediaData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple media files
router.post('/upload/multiple', auth, uploadMultiple, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const mediaFiles = req.files.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: file.mimetype.split('/')[0],
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    }));

    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      media: mediaFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve media files (authenticated) - GET /api/media/serve/:mediaId
router.get('/serve/:mediaId', auth, (req, res) => {
  try {
    const { mediaId } = req.params;
    
    // For now, we'll treat mediaId as the filename since we don't have a database yet
    // In production, you would query the database to get file path and verify permissions
    
    // Search for the file in all media directories
    const searchDirs = [
      'uploads/images',
      'uploads/videos', 
      'uploads/audio',
      'uploads/documents'
    ];
    
    let filePath = null;
    let mimeType = null;
    
    // Search through date-organized directories
    for (const baseDir of searchDirs) {
      if (fs.existsSync(baseDir)) {
        // Search recursively through date directories
        const findFileRecursively = (dir) => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              const found = findFileRecursively(itemPath);
              if (found) return found;
            } else if (item === mediaId || item.includes(mediaId)) {
              return itemPath;
            }
          }
          return null;
        };
        
        const foundPath = findFileRecursively(baseDir);
        if (foundPath) {
          filePath = foundPath;
          break;
        }
      }
    }
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        error: 'Media file not found' 
      });
    }
    
    // Determine MIME type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.txt': 'text/plain'
    };
    
    mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set appropriate headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: 'Failed to serve media file' 
        });
      }
    });
    
  } catch (error) {
    console.error('Serve media error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to serve media file',
      details: error.message 
    });
  }
});

// Serve thumbnail files - GET /api/media/thumbnail/:mediaId
router.get('/thumbnail/:mediaId', auth, (req, res) => {
  try {
    const { mediaId } = req.params;
    
    // Look for thumbnail in thumbnails directory
    let thumbnailPath = path.join('uploads/thumbnails', mediaId);
    
    // If the mediaId doesn't include extension, try common thumbnail extensions
    if (!fs.existsSync(thumbnailPath)) {
      const possibleExtensions = ['.jpg', '.jpeg', '.png'];
      for (const ext of possibleExtensions) {
        const testPath = thumbnailPath + ext;
        if (fs.existsSync(testPath)) {
          thumbnailPath = testPath;
          break;
        }
      }
    }
    
    // If still not found, try to find by partial filename match
    if (!fs.existsSync(thumbnailPath)) {
      const thumbnailDir = 'uploads/thumbnails';
      if (fs.existsSync(thumbnailDir)) {
        const files = fs.readdirSync(thumbnailDir);
        const matchingFile = files.find(file => 
          file.includes(mediaId) || file.includes(mediaId.replace(/\.[^/.]+$/, ""))
        );
        if (matchingFile) {
          thumbnailPath = path.join(thumbnailDir, matchingFile);
        }
      }
    }
    
    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ 
        success: false,
        error: 'Thumbnail not found' 
      });
    }
    
    // Set appropriate headers for thumbnail
    res.setHeader('Content-Type', 'image/jpeg'); // Thumbnails are typically JPEG
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the thumbnail
    const fileStream = fs.createReadStream(thumbnailPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Thumbnail streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: 'Failed to serve thumbnail' 
        });
      }
    });
    
  } catch (error) {
    console.error('Serve thumbnail error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to serve thumbnail',
      details: error.message 
    });
  }
});

// Get media info - GET /api/media/info/:mediaId
router.get('/info/:mediaId', auth, (req, res) => {
  try {
    const { mediaId } = req.params;
    
    // Search for the file in all media directories
    const searchDirs = [
      'uploads/images',
      'uploads/videos', 
      'uploads/audio',
      'uploads/documents'
    ];
    
    let filePath = null;
    let fileStats = null;
    
    // Search through date-organized directories
    for (const baseDir of searchDirs) {
      if (fs.existsSync(baseDir)) {
        const findFileRecursively = (dir) => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              const found = findFileRecursively(itemPath);
              if (found) return found;
            } else if (item === mediaId || item.includes(mediaId)) {
              return itemPath;
            }
          }
          return null;
        };
        
        const foundPath = findFileRecursively(baseDir);
        if (foundPath) {
          filePath = foundPath;
          fileStats = fs.statSync(foundPath);
          break;
        }
      }
    }
    
    if (!filePath || !fileStats) {
      return res.status(404).json({ 
        success: false,
        error: 'Media file not found' 
      });
    }
    
    // Extract file information
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const fileSize = fileStats.size;
    const uploadedAt = fileStats.birthtime;
    
    // Determine media type and MIME type
    let mediaType = 'document';
    let mimeType = 'application/octet-stream';
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      mediaType = 'image';
      mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : `image/${ext.slice(1)}`;
    } else if (['.mp4', '.avi', '.mov', '.wmv', '.webm'].includes(ext)) {
      mediaType = 'video';
      mimeType = ext === '.mp4' ? 'video/mp4' : `video/${ext.slice(1)}`;
    } else if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(ext)) {
      mediaType = 'audio';
      mimeType = ext === '.mp3' ? 'audio/mpeg' : `audio/${ext.slice(1)}`;
    }
    
    const mediaInfo = {
      id: mediaId,
      fileName: fileName,
      fileSize: fileSize,
      mediaType: mediaType,
      mimeType: mimeType,
      uploadedAt: uploadedAt,
      filePath: filePath,
      url: `/api/media/serve/${mediaId}`,
      thumbnailUrl: `/api/media/thumbnail/${mediaId}`
    };
    
    res.json({
      success: true,
      media: mediaInfo
    });
    
  } catch (error) {
    console.error('Media info error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get media info',
      details: error.message 
    });
  }
});

// Delete media file
router.delete('/:mediaId', auth, (req, res) => {
  try {
    const { mediaId } = req.params;
    
    // Placeholder for media deletion
    res.status(501).json({ 
      error: 'Media deletion not yet implemented',
      message: 'This endpoint will be implemented when media storage is integrated with the database'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

module.exports = router;