import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CameraInterface from '../CameraInterface';
import PermissionManager from '../../utils/PermissionManager';

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
}));

// Mock PermissionManager
jest.mock('../../utils/PermissionManager', () => ({
  handleMediaPermissions: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockImagePicker = require('react-native-image-picker');

describe('CameraInterface', () => {
  const mockProps = {
    visible: true,
    mediaType: 'photo',
    onCapture: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful permission mock
    PermissionManager.handleMediaPermissions.mockResolvedValue({
      success: true,
      permissions: { camera: { granted: true } },
    });
  });

  describe('Visibility', () => {
    it('should render when visible is true', async () => {
      const { getByText } = render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Photo')).toBeTruthy();
      });
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <CameraInterface {...mockProps} visible={false} />,
      );

      expect(queryByText('Cancel')).toBeNull();
    });
  });

  describe('Permission Handling', () => {
    it('should request camera permissions on mount', async () => {
      render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        expect(PermissionManager.handleMediaPermissions).toHaveBeenCalledWith(
          'camera',
        );
      });
    });

    it('should call onCancel when permissions are denied', async () => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: false,
        permissions: { camera: { granted: false } },
      });

      render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        expect(mockProps.onCancel).toHaveBeenCalled();
      });
    });
  });

  describe('Media Type Support', () => {
    it('should support photo capture mode', async () => {
      const { getByText } = render(
        <CameraInterface {...mockProps} mediaType="photo" />,
      );

      await waitFor(() => {
        expect(getByText('Photo')).toBeTruthy();
      });
    });

    it('should support video capture mode', async () => {
      const { getByText } = render(
        <CameraInterface {...mockProps} mediaType="video" />,
      );

      await waitFor(() => {
        expect(getByText('Video')).toBeTruthy();
      });
    });

    it('should support mixed mode', async () => {
      const { getByText, getAllByText } = render(
        <CameraInterface {...mockProps} mediaType="mixed" />,
      );

      await waitFor(() => {
        expect(getAllByText('Photo').length).toBeGreaterThan(0);
        expect(getByText('Video')).toBeTruthy();
      });
    });
  });

  describe('Camera Operations', () => {
    it('should capture photo when capture button is pressed', async () => {
      const mockPhoto = {
        uri: 'file://photo.jpg',
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
        fileSize: 1024000,
      };

      mockImagePicker.launchCamera.mockImplementation((options, callback) => {
        callback({
          assets: [mockPhoto],
        });
      });

      const { getByTestId } = render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        const captureButton = getByTestId('capture-button');
        fireEvent.press(captureButton);
      });

      expect(mockImagePicker.launchCamera).toHaveBeenCalled();
    });

    it('should handle camera errors gracefully', async () => {
      mockImagePicker.launchCamera.mockImplementation((options, callback) => {
        callback({
          errorMessage: 'Camera error',
        });
      });

      const { getByTestId } = render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        const captureButton = getByTestId('capture-button');
        fireEvent.press(captureButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Camera Error',
        'Failed to capture media. Please try again.',
        [{ text: 'OK' }],
      );
    });
  });

  describe('Navigation', () => {
    it('should call onCancel when cancel button is pressed', async () => {
      const { getByText } = render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        fireEvent.press(getByText('Cancel'));
      });

      expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle permission initialization errors', async () => {
      PermissionManager.handleMediaPermissions.mockRejectedValue(
        new Error('Permission error'),
      );

      render(<CameraInterface {...mockProps} />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Error',
          'Unable to access camera permissions. Please try again.',
          [{ text: 'OK', onPress: expect.any(Function) }],
        );
      });
    });
  });
});
