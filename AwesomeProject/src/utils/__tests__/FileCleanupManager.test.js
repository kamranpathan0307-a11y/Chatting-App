import { FileCleanupManager } from '../FileCleanupManager';
import RNFS from 'react-native-fs';

// Mock RNFS
jest.mock('react-native-fs', () => ({
  exists: jest.fn(),
  unlink: jest.fn(),
  CachesDirectoryPath: '/mock/cache/path',
  readDir: jest.fn(),
}));

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('FileCleanupManager', () => {
  let cleanupManager;

  beforeEach(() => {
    cleanupManager = new FileCleanupManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupManager.destroy();
  });

  describe('registerTempFile', () => {
    it('should register a temporary file for tracking', () => {
      const filePath = '/path/to/temp/file.jpg';
      const uploadId = 'upload123';

      cleanupManager.registerTempFile(filePath, uploadId, 'original');

      const stats = cleanupManager.getCleanupStats();
      expect(stats.totalTempFiles).toBe(1);
      expect(stats.totalUploads).toBe(1);
      expect(stats.filesByType.original).toBe(1);
    });

    it('should handle null file path gracefully', () => {
      cleanupManager.registerTempFile(null, 'upload123', 'original');

      const stats = cleanupManager.getCleanupStats();
      expect(stats.totalTempFiles).toBe(0);
    });
  });

  describe('cleanupAfterSuccessfulUpload', () => {
    it('should clean up files associated with upload ID', async () => {
      const filePath1 = '/path/to/file1.jpg';
      const filePath2 = '/path/to/file2.jpg';
      const uploadId = 'upload123';

      RNFS.exists.mockResolvedValue(true);
      RNFS.unlink.mockResolvedValue();

      cleanupManager.registerTempFile(filePath1, uploadId, 'original');
      cleanupManager.registerTempFile(filePath2, uploadId, 'thumbnail');

      await cleanupManager.cleanupAfterSuccessfulUpload(uploadId);

      expect(RNFS.unlink).toHaveBeenCalledWith(filePath1);
      expect(RNFS.unlink).toHaveBeenCalledWith(filePath2);

      const stats = cleanupManager.getCleanupStats();
      expect(stats.totalUploads).toBe(0);
    });

    it('should handle non-existent upload ID gracefully', async () => {
      await cleanupManager.cleanupAfterSuccessfulUpload('nonexistent');

      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
  });

  describe('cleanupAfterFailedUpload', () => {
    it('should clean up files associated with failed upload', async () => {
      const filePath = '/path/to/failed/file.jpg';
      const uploadId = 'failed123';

      RNFS.exists.mockResolvedValue(true);
      RNFS.unlink.mockResolvedValue();

      cleanupManager.registerTempFile(filePath, uploadId, 'original');

      await cleanupManager.cleanupAfterFailedUpload(uploadId);

      expect(RNFS.unlink).toHaveBeenCalledWith(filePath);

      const stats = cleanupManager.getCleanupStats();
      expect(stats.totalUploads).toBe(0);
    });
  });

  describe('cleanupOldTempFiles', () => {
    it('should clean up files older than specified age', async () => {
      const oldFilePath = '/path/to/old/file.jpg';
      const newFilePath = '/path/to/new/file.jpg';

      RNFS.exists.mockResolvedValue(true);
      RNFS.unlink.mockResolvedValue();

      // Register old file (simulate old timestamp)
      cleanupManager.registerTempFile(oldFilePath, null, 'temp');
      const oldFileInfo = Array.from(cleanupManager.tempFiles).find(
        f => f.path === oldFilePath,
      );
      if (oldFileInfo) {
        oldFileInfo.createdAt = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      }

      // Register new file
      cleanupManager.registerTempFile(newFilePath, null, 'temp');

      await cleanupManager.cleanupOldTempFiles(60 * 60 * 1000); // 1 hour max age

      expect(RNFS.unlink).toHaveBeenCalledWith(oldFilePath);
      expect(RNFS.unlink).not.toHaveBeenCalledWith(newFilePath);
    });
  });

  describe('cleanupAllTempFiles', () => {
    it('should clean up all tracked temporary files', async () => {
      const filePath1 = '/path/to/file1.jpg';
      const filePath2 = '/path/to/file2.jpg';

      RNFS.exists.mockResolvedValue(true);
      RNFS.unlink.mockResolvedValue();

      cleanupManager.registerTempFile(filePath1, 'upload1', 'original');
      cleanupManager.registerTempFile(filePath2, 'upload2', 'thumbnail');

      await cleanupManager.cleanupAllTempFiles();

      expect(RNFS.unlink).toHaveBeenCalledWith(filePath1);
      expect(RNFS.unlink).toHaveBeenCalledWith(filePath2);

      const stats = cleanupManager.getCleanupStats();
      expect(stats.totalTempFiles).toBe(0);
      expect(stats.totalUploads).toBe(0);
    });
  });

  describe('getCleanupStats', () => {
    it('should return accurate cleanup statistics', () => {
      cleanupManager.registerTempFile('/file1.jpg', 'upload1', 'original');
      cleanupManager.registerTempFile('/file2.jpg', 'upload1', 'thumbnail');
      cleanupManager.registerTempFile('/file3.jpg', 'upload2', 'compressed');

      const stats = cleanupManager.getCleanupStats();

      expect(stats.totalTempFiles).toBe(3);
      expect(stats.totalUploads).toBe(2);
      expect(stats.filesByType.original).toBe(1);
      expect(stats.filesByType.thumbnail).toBe(1);
      expect(stats.filesByType.compressed).toBe(1);
      expect(stats.isCleaningUp).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle file deletion errors gracefully', async () => {
      const filePath = '/path/to/file.jpg';
      const uploadId = 'upload123';

      RNFS.exists.mockResolvedValue(true);
      RNFS.unlink.mockRejectedValue(new Error('Permission denied'));

      cleanupManager.registerTempFile(filePath, uploadId, 'original');

      // Should not throw error
      await expect(
        cleanupManager.cleanupAfterSuccessfulUpload(uploadId),
      ).resolves.toBeUndefined();
    });

    it('should handle non-existent files gracefully', async () => {
      const filePath = '/path/to/nonexistent.jpg';
      const uploadId = 'upload123';

      RNFS.exists.mockResolvedValue(false);

      cleanupManager.registerTempFile(filePath, uploadId, 'original');

      await cleanupManager.cleanupAfterSuccessfulUpload(uploadId);

      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
  });
});
