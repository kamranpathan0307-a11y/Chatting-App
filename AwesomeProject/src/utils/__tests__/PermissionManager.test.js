import { Platform } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import PermissionManager from '../PermissionManager';

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  openSettings: jest.fn(),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openSettings: jest.fn(),
  },
}));

const mockCheck = require('react-native-permissions').check;
const mockRequest = require('react-native-permissions').request;
const mockOpenSettings = require('react-native-permissions').openSettings;

describe('PermissionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPermission', () => {
    it('should return granted status when permission is granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.checkPermission('camera');

      expect(result).toEqual({
        granted: true,
        status: RESULTS.GRANTED,
      });
      expect(mockCheck).toHaveBeenCalledWith('ios.permission.CAMERA');
    });

    it('should return denied status when permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);

      const result = await PermissionManager.checkPermission('camera');

      expect(result).toEqual({
        granted: false,
        status: RESULTS.DENIED,
      });
    });

    it('should handle platform-specific permissions', async () => {
      // Mock Platform.OS for Android
      const originalOS = Platform.OS;
      Platform.OS = 'android';

      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      await PermissionManager.checkPermission('camera');

      expect(mockCheck).toHaveBeenCalledWith('android.permission.CAMERA');

      // Restore original OS
      Platform.OS = originalOS;
    });

    it('should return granted for permissions not required on platform', async () => {
      const result = await PermissionManager.checkPermission('storage');

      expect(result).toEqual({
        granted: true,
        status: RESULTS.GRANTED,
      });
      expect(mockCheck).not.toHaveBeenCalled();
    });
  });

  describe('requestPermission', () => {
    it('should request permission and return result', async () => {
      mockRequest.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.requestPermission('microphone');

      expect(result).toEqual({
        granted: true,
        status: RESULTS.GRANTED,
      });
      expect(mockRequest).toHaveBeenCalledWith('ios.permission.MICROPHONE');
    });

    it('should handle permission denial', async () => {
      mockRequest.mockResolvedValue(RESULTS.DENIED);

      const result = await PermissionManager.requestPermission('microphone');

      expect(result).toEqual({
        granted: false,
        status: RESULTS.DENIED,
      });
    });
  });

  describe('ensurePermission', () => {
    it('should return granted if permission already granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.ensurePermission('camera');

      expect(result).toEqual({
        granted: true,
        status: RESULTS.GRANTED,
      });
      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('should request permission if not granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.ensurePermission('camera');

      expect(result).toEqual({
        granted: true,
        status: RESULTS.GRANTED,
      });
      expect(mockCheck).toHaveBeenCalled();
      expect(mockRequest).toHaveBeenCalled();
    });

    it('should add error flag when permission is denied after request', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.DENIED);

      const result = await PermissionManager.ensurePermission('camera');

      expect(result).toEqual({
        granted: false,
        status: RESULTS.DENIED,
        showError: true,
      });
    });
  });

  describe('handleMediaPermissions', () => {
    it('should handle camera permissions', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.handleMediaPermissions('camera');

      expect(result.success).toBe(true);
      expect(result.permissions.camera.granted).toBe(true);
    });

    it('should handle gallery permissions on iOS', async () => {
      Platform.OS = 'ios';
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.handleMediaPermissions('gallery');

      expect(result.success).toBe(true);
      expect(result.permissions.photoLibrary.granted).toBe(true);
    });

    it('should handle gallery permissions on Android', async () => {
      // Mock Platform.OS for Android
      const originalOS = Platform.OS;
      Platform.OS = 'android';

      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const result = await PermissionManager.handleMediaPermissions('gallery');

      expect(result.success).toBe(true);
      expect(result.permissions.photoLibrary.granted).toBe(true);
      expect(result.permissions.storage.granted).toBe(true);

      // Restore original OS
      Platform.OS = originalOS;
    });

    it('should return false when any required permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.DENIED);

      const result = await PermissionManager.handleMediaPermissions('camera');

      expect(result.success).toBe(false);
      expect(result.permissions.camera.granted).toBe(false);
    });
  });

  describe('getStatusDescription', () => {
    it('should return correct descriptions for each status', () => {
      expect(PermissionManager.getStatusDescription(RESULTS.GRANTED)).toBe(
        'Permission is granted',
      );
      expect(PermissionManager.getStatusDescription(RESULTS.DENIED)).toBe(
        'Permission has not been requested or denied',
      );
      expect(PermissionManager.getStatusDescription(RESULTS.BLOCKED)).toBe(
        'Permission is permanently blocked',
      );
      expect(PermissionManager.getStatusDescription(RESULTS.UNAVAILABLE)).toBe(
        'Permission is not available on this device',
      );
    });
  });
});
