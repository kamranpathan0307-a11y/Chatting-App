/**
 * Example usage of PermissionManager
 * This file demonstrates how to use the PermissionManager utility class
 * for handling permissions in the media upload system
 */

import PermissionManager from './PermissionManager';

/**
 * Example: Handle camera permission for photo capture
 */
export const handleCameraAccess = async () => {
  try {
    const result = await PermissionManager.ensurePermission('camera');

    if (result.granted) {
      console.log('Camera permission granted, can proceed with camera');
      // Proceed with camera functionality
      return true;
    } else {
      console.log('Camera permission denied');
      if (result.showError) {
        PermissionManager.showPermissionError('camera', result.status);
      }
      return false;
    }
  } catch (error) {
    console.error('Error handling camera permission:', error);
    return false;
  }
};

/**
 * Example: Handle gallery access permissions
 */
export const handleGalleryAccess = async () => {
  try {
    const result = await PermissionManager.handleMediaPermissions('gallery');

    if (result.success) {
      console.log('Gallery permissions granted, can access photo library');
      // Proceed with gallery functionality
      return true;
    } else {
      console.log('Gallery permissions denied');
      // Error messages are already shown by handleMediaPermissions
      return false;
    }
  } catch (error) {
    console.error('Error handling gallery permissions:', error);
    return false;
  }
};

/**
 * Example: Handle audio recording permissions
 */
export const handleAudioRecording = async () => {
  try {
    const result = await PermissionManager.handleMediaPermissions('audio');

    if (result.success) {
      console.log('Audio permissions granted, can record audio');
      // Proceed with audio recording functionality
      return true;
    } else {
      console.log('Audio permissions denied');
      return false;
    }
  } catch (error) {
    console.error('Error handling audio permissions:', error);
    return false;
  }
};

/**
 * Example: Check multiple permissions at once
 */
export const checkAllMediaPermissions = async () => {
  try {
    const permissions = ['camera', 'microphone', 'photoLibrary'];
    const results = await PermissionManager.checkMultiplePermissions(
      permissions,
    );

    console.log('Permission status:');
    for (const [permission, result] of Object.entries(results)) {
      console.log(
        `${permission}: ${result.granted ? 'Granted' : 'Denied'} (${
          result.status
        })`,
      );
    }

    return results;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {};
  }
};

/**
 * Example: Handle document picker permissions
 */
export const handleDocumentAccess = async () => {
  try {
    const result = await PermissionManager.handleMediaPermissions('document');

    if (result.success) {
      console.log('Document permissions granted, can access files');
      // Proceed with document picker functionality
      return true;
    } else {
      console.log('Document permissions denied');
      return false;
    }
  } catch (error) {
    console.error('Error handling document permissions:', error);
    return false;
  }
};

/**
 * Example: Permission status debugging
 */
export const debugPermissionStatus = async permissionType => {
  try {
    const result = await PermissionManager.checkPermission(permissionType);
    const description = PermissionManager.getStatusDescription(result.status);

    console.log(`Permission: ${permissionType}`);
    console.log(`Status: ${result.status}`);
    console.log(`Description: ${description}`);
    console.log(`Granted: ${result.granted}`);

    return result;
  } catch (error) {
    console.error('Error debugging permission status:', error);
    return null;
  }
};
