const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class MediaProcessor {
  
  /**
   * Compress and optimize image files
   * @param {string} inputPath - Path to the original image
   * @param {string} outputPath - Path for the compressed image (optional)
   * @param {Object} options - Compression options
   * @returns {Promise<string>} - Path to the compressed image
   */
  static async compressImage(inputPath, outputPath = null, options = {}) {
    try {
      const {
        quality = 80,
        maxWidth = 1920,
        maxHeight = 1080,
        format = 'jpeg'
      } = options;

      if (!outputPath) {
        const ext = path.extname(inputPath);
        outputPath = inputPath.replace(ext, `_compressed${ext}`);
      }

      await sharp(inputPath)
        .resize(maxWidth, maxHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Image compression error:', error);
      throw new Error(`Failed to compress image: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail for images
   * @param {string} inputPath - Path to the original image
   * @param {string} outputPath - Path for the thumbnail (optional)
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} - Path to the thumbnail
   */
  static async generateImageThumbnail(inputPath, outputPath = null, options = {}) {
    try {
      const {
        width = 150,
        height = 150,
        quality = 70
      } = options;

      if (!outputPath) {
        const fileName = path.basename(inputPath, path.extname(inputPath));
        outputPath = path.join('uploads/thumbnails', `${fileName}_thumb.jpg`);
      }

      // Ensure thumbnails directory exists
      const thumbnailDir = path.dirname(outputPath);
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      await sharp(inputPath)
        .resize(width, height, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Image thumbnail generation error:', error);
      throw new Error(`Failed to generate image thumbnail: ${error.message}`);
    }
  }

  /**
   * Compress video files using FFmpeg
   * @param {string} inputPath - Path to the original video
   * @param {string} outputPath - Path for the compressed video (optional)
   * @param {Object} options - Compression options
   * @returns {Promise<string>} - Path to the compressed video
   */
  static async compressVideo(inputPath, outputPath = null, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const {
          quality = 23, // CRF value (lower = better quality, larger file)
          maxWidth = 1280,
          maxHeight = 720,
          videoBitrate = '1000k',
          audioBitrate = '128k'
        } = options;

        if (!outputPath) {
          const ext = path.extname(inputPath);
          outputPath = inputPath.replace(ext, '_compressed.mp4');
        }

        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .videoBitrate(videoBitrate)
          .audioBitrate(audioBitrate)
          .size(`${maxWidth}x${maxHeight}`)
          .outputOptions([
            '-crf', quality.toString(),
            '-preset', 'medium',
            '-movflags', '+faststart' // Optimize for web streaming
          ])
          .on('end', () => {
            console.log('Video compression completed:', outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('Video compression error:', error);
            reject(new Error(`Failed to compress video: ${error.message}`));
          })
          .on('progress', (progress) => {
            console.log(`Video compression progress: ${progress.percent}%`);
          })
          .save(outputPath);

      } catch (error) {
        reject(new Error(`Video compression setup failed: ${error.message}`));
      }
    });
  }

  /**
   * Generate thumbnail for video files
   * @param {string} inputPath - Path to the original video
   * @param {string} outputPath - Path for the thumbnail (optional)
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} - Path to the thumbnail
   */
  static async generateVideoThumbnail(inputPath, outputPath = null, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const {
          timeOffset = '00:00:01', // Take screenshot at 1 second
          width = 150,
          height = 150
        } = options;

        if (!outputPath) {
          const fileName = path.basename(inputPath, path.extname(inputPath));
          outputPath = path.join('uploads/thumbnails', `${fileName}_thumb.jpg`);
        }

        // Ensure thumbnails directory exists
        const thumbnailDir = path.dirname(outputPath);
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        ffmpeg(inputPath)
          .seekInput(timeOffset)
          .frames(1)
          .size(`${width}x${height}`)
          .on('end', () => {
            console.log('Video thumbnail generated:', outputPath);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('Video thumbnail generation error:', error);
            reject(new Error(`Failed to generate video thumbnail: ${error.message}`));
          })
          .save(outputPath);

      } catch (error) {
        reject(new Error(`Video thumbnail setup failed: ${error.message}`));
      }
    });
  }

  /**
   * Generate thumbnail for audio files (waveform or generic icon)
   * @param {string} inputPath - Path to the original audio
   * @param {string} outputPath - Path for the thumbnail (optional)
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} - Path to the thumbnail
   */
  static async generateAudioThumbnail(inputPath, outputPath = null, options = {}) {
    try {
      const {
        width = 150,
        height = 150,
        backgroundColor = '#4A90E2',
        textColor = '#FFFFFF'
      } = options;

      if (!outputPath) {
        const fileName = path.basename(inputPath, path.extname(inputPath));
        outputPath = path.join('uploads/thumbnails', `${fileName}_thumb.jpg`);
      }

      // Ensure thumbnails directory exists
      const thumbnailDir = path.dirname(outputPath);
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Create a simple audio icon thumbnail using Sharp
      const svgIcon = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${backgroundColor}"/>
          <g fill="${textColor}" transform="translate(${width/2}, ${height/2})">
            <circle cx="-20" cy="0" r="3"/>
            <circle cx="-10" cy="-8" r="3"/>
            <circle cx="0" cy="-12" r="3"/>
            <circle cx="10" cy="-8" r="3"/>
            <circle cx="20" cy="0" r="3"/>
            <circle cx="10" cy="8" r="3"/>
            <circle cx="0" cy="12" r="3"/>
            <circle cx="-10" cy="8" r="3"/>
          </g>
        </svg>
      `;

      await sharp(Buffer.from(svgIcon))
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Audio thumbnail generation error:', error);
      throw new Error(`Failed to generate audio thumbnail: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail for document files
   * @param {string} inputPath - Path to the original document
   * @param {string} outputPath - Path for the thumbnail (optional)
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} - Path to the thumbnail
   */
  static async generateDocumentThumbnail(inputPath, outputPath = null, options = {}) {
    try {
      const {
        width = 150,
        height = 150,
        backgroundColor = '#E74C3C',
        textColor = '#FFFFFF'
      } = options;

      if (!outputPath) {
        const fileName = path.basename(inputPath, path.extname(inputPath));
        outputPath = path.join('uploads/thumbnails', `${fileName}_thumb.jpg`);
      }

      // Ensure thumbnails directory exists
      const thumbnailDir = path.dirname(outputPath);
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Get file extension for icon
      const ext = path.extname(inputPath).toUpperCase().slice(1);
      
      // Create a document icon thumbnail
      const svgIcon = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${backgroundColor}"/>
          <rect x="30" y="20" width="90" height="110" fill="${textColor}" rx="5"/>
          <rect x="35" y="25" width="80" height="100" fill="${backgroundColor}"/>
          <text x="${width/2}" y="${height/2 + 5}" text-anchor="middle" fill="${textColor}" font-family="Arial" font-size="16" font-weight="bold">${ext}</text>
        </svg>
      `;

      await sharp(Buffer.from(svgIcon))
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Document thumbnail generation error:', error);
      throw new Error(`Failed to generate document thumbnail: ${error.message}`);
    }
  }

  /**
   * Process uploaded media file (compress and generate thumbnail)
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing results
   */
  static async processUploadedMedia(filePath, mimeType, options = {}) {
    try {
      const results = {
        originalPath: filePath,
        compressedPath: null,
        thumbnailPath: null,
        processed: false
      };

      if (mimeType.startsWith('image/')) {
        // Compress image and generate thumbnail
        results.compressedPath = await this.compressImage(filePath, null, options.image);
        results.thumbnailPath = await this.generateImageThumbnail(filePath, null, options.thumbnail);
        results.processed = true;
      } else if (mimeType.startsWith('video/')) {
        // Compress video and generate thumbnail
        if (options.compressVideo !== false) {
          results.compressedPath = await this.compressVideo(filePath, null, options.video);
        }
        results.thumbnailPath = await this.generateVideoThumbnail(filePath, null, options.thumbnail);
        results.processed = true;
      } else if (mimeType.startsWith('audio/')) {
        // Generate audio thumbnail (no compression needed for audio)
        results.thumbnailPath = await this.generateAudioThumbnail(filePath, null, options.thumbnail);
        results.processed = true;
      } else {
        // Generate document thumbnail
        results.thumbnailPath = await this.generateDocumentThumbnail(filePath, null, options.thumbnail);
        results.processed = true;
      }

      return results;
    } catch (error) {
      console.error('Media processing error:', error);
      throw new Error(`Failed to process media: ${error.message}`);
    }
  }
}

module.exports = MediaProcessor;