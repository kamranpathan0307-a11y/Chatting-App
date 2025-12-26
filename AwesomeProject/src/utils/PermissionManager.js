import { Platform, Alert, Linking } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';

/**
 * PermissionManager - Comprehensive permission handling utility
 * Handles camera, microphone, and storage permissions with user-friendly error messages
 */
class PermissionManager {
  // Get permission types mapping for cross-platform compatibility
  static getPermissionTypes() {
    return {
      camera:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA,
      microphone:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO,
      photoLibrary:
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      storage:
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
          : null,
    };
  }

  // User-friendly permission names for messages
  static PERMISSION_NAMES = {
    camera: 'Camera',
    microphone: 'Microphone',
    photoLibrary: 'Photo Library',
    storage: 'Storage',
  };

  // Error messages for different permission scenarios
  static ERROR_MESSAGES = {
    camera: {
      denied:
        'Camera access is required to take photos and videos. Please grant camera permission to continue.',
      blocked:
        'Camera access has been permanently denied. Please go to Settings > Privacy > Camera to enable access for this app.',
      unavailable: 'Camera is not available on this device.',
    },
    microphone: {
      denied:
        'Microphone access is required to record audio messages. Please grant microphone permission to continue.',
      blocked:
        'Microphone access has been permanently denied. Please go to Settings > Privacy > Microphone to enable access for this app.',
      unavailable: 'Microphone is not available on this device.',
    },
    photoLibrary: {
      denied:
        'Photo library access is required to select images and videos. Please grant photo library permission to continue.',
      blocked:
        'Photo library access has been permanently denied. Please go to Settings > Privacy > Photos to enable access for this app.',
      unavailable: 'Photo library is not available on this device.',
    },
    storage: {
      denied:
        'Storage access is required to access files and media. Please grant storage permission to continue.',
      blocked:
        'Storage access has been permanently denied. Please go to Settings > Apps > Permissions to enable storage access for this app.',
      unavailable: 'Storage access is not available.',
    },
  };

  /**
   * Check if a specific permission is granted
   * @param {string} permissionType - Type of permission to check (camera, microphone, photoLibrary, storage)
   * @returns {Promise<{granted: boolean, status: string}>} Permission status
   */
  static async checkPermission(permissionType) {
    try {
      const permissionTypes = this.getPermissionTypes();
      const permission = permissionTypes[permissionType];

      // If permission is not required on this platform, consider it granted
      if (!permission) {
        return { granted: true, status: RESULTS.GRANTED };
      }

      const result = await check(permission);
      return {
        granted: result === RESULTS.GRANTED,
        status: result,
      };
    } catch (error) {
      console.error(`Error checking ${permissionType} permission:`, error);
      return { granted: false, status: RESULTS.UNAVAILABLE };
    }
  }

  /**
   * Request a specific permission from the user
   * @param {string} permissionType - Type of permission to request
   * @returns {Promise<{granted: boolean, status: string}>} Permission result
   */
  static async requestPermission(permissionType) {
    try {
      const permissionTypes = this.getPermissionTypes();
      const permission = permissionTypes[permissionType];

      // If permission is not required on this platform, consider it granted
      if (!permission) {
        return { granted: true, status: RESULTS.GRANTED };
      }

      const result = await request(permission);
      return {
        granted: result === RESULTS.GRANTED,
        status: result,
      };
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return { granted: false, status: RESULTS.UNAVAILABLE };
    }
  }

  /**
   * Check and request permission if needed
   * @param {string} permissionType - Type of permission to ensure
   * @returns {Promise<{granted: boolean, status: string, showError?: boolean}>} Permission result with error flag
   */
  static async ensurePermission(permissionType) {
    try {
      // First check if permission is already granted
      const checkResult = await this.checkPermission(permissionType);

      if (checkResult.granted) {
        return checkResult;
      }

      // If not granted, request permission
      const requestResult = await this.requestPermission(permissionType);

      // Add error flag if permission was denied
      if (!requestResult.granted) {
        return {
          ...requestResult,
          showError: true,
        };
      }

      return requestResult;
    } catch (error) {
      console.error(`Error ensuring ${permissionType} permission:`, error);
      return {
        granted: false,
        status: RESULTS.UNAVAILABLE,
        showError: true,
      };
    }
  }

  /**
   * Show user-friendly error message for permission denial
   * @param {string} permissionType - Type of permission that was denied
   * @param {string} status - Permission status from react-native-permissions
   * @param {boolean} showSettingsOption - Whether to show option to open settings
   */
  static showPermissionError(
    permissionType,
    status,
    showSettingsOption = true,
  ) {
    const permissionName = this.PERMISSION_NAMES[permissionType];
    const messages = this.ERROR_MESSAGES[permissionType];

    let title = `${permissionName} Access Required`;
    let message = messages.denied;
    let buttons = [{ text: 'OK', style: 'default' }];

    // Customize message based on permission status
    switch (status) {
      case RESULTS.BLOCKED:
        message = messages.blocked;
        if (showSettingsOption) {
          buttons = [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              style: 'default',
              onPress: () => this.openAppSettings(),
            },
          ];
        }
        break;
      case RESULTS.UNAVAILABLE:
        title = `${permissionName} Unavailable`;
        message = messages.unavailable;
        break;
      case RESULTS.DENIED:
      default:
        message = messages.denied;
        break;
    }

    Alert.alert(title, message, buttons);
  }

  /**
   * Open app settings for manual permission granting
   */
  static async openAppSettings() {
    try {
      await openSettings();
    } catch (error) {
      console.error('Error opening app settings:', error);
      // Fallback to system settings if openSettings fails
      try {
        await Linking.openSettings();
      } catch (fallbackError) {
        console.error('Error opening system settings:', fallbackError);
        Alert.alert(
          'Settings Unavailable',
          'Please manually open Settings and grant the required permissions for this app.',
        );
      }
    }
  }

  /**
   * Check multiple permissions at once
   * @param {string[]} permissionTypes - Array of permission types to check
   * @returns {Promise<Object>} Object with permission results keyed by permission type
   */
  static async checkMultiplePermissions(permissionTypes) {
    const results = {};

    for (const permissionType of permissionTypes) {
      results[permissionType] = await this.checkPermission(permissionType);
    }

    return results;
  }

  /**
   * Request multiple permissions at once
   * @param {string[]} permissionTypes - Array of permission types to request
   * @returns {Promise<Object>} Object with permission results keyed by permission type
   */
  static async requestMultiplePermissions(permissionTypes) {
    const results = {};

    for (const permissionType of permissionTypes) {
      results[permissionType] = await this.requestPermission(permissionType);
    }

    return results;
  }

  /**
   * Get permission status description for debugging
   * @param {string} status - Permission status from react-native-permissions
   * @returns {string} Human-readable status description
   */
  static getStatusDescription(status) {
    switch (status) {
      case RESULTS.UNAVAILABLE:
        return 'Permission is not available on this device';
      case RESULTS.DENIED:
        return 'Permission has not been requested or denied';
      case RESULTS.LIMITED:
        return 'Permission is limited (iOS 14+)';
      case RESULTS.GRANTED:
        return 'Permission is granted';
      case RESULTS.BLOCKED:
        return 'Permission is permanently blocked';
      default:
        return 'Unknown permission status';
    }
  }

  /**
   * Handle permission workflow for media capture
   * @param {string} mediaType - Type of media (camera, gallery, audio, document)
   * @returns {Promise<{success: boolean, permissions: Object}>} Workflow result
   */
  static async handleMediaPermissions(mediaType) {
    let requiredPermissions = [];

    switch (mediaType) {
      case 'camera':
        requiredPermissions = ['camera'];
        break;
      case 'gallery':
        requiredPermissions = ['photoLibrary'];
        if (Platform.OS === 'android') {
          requiredPermissions.push('storage');
        }
        break;
      case 'audio':
        requiredPermissions = ['microphone'];
        if (Platform.OS === 'android') {
          requiredPermissions.push('storage');
        }
        break;
      case 'document':
        if (Platform.OS === 'android') {
          requiredPermissions = ['storage'];
        }
        break;
      default:
        return { success: true, permissions: {} };
    }

    const results = {};
    let allGranted = true;

    for (const permissionType of requiredPermissions) {
      const result = await this.ensurePermission(permissionType);
      results[permissionType] = result;

      if (!result.granted) {
        allGranted = false;
        if (result.showError) {
          this.showPermissionError(permissionType, result.status);
        }
      }
    }

    return {
      success: allGranted,
      permissions: results,
    };
  }
}

export default PermissionManager;
