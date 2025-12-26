import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VideoGalleryPicker from '../VideoGalleryPicker';
import PermissionManager from '../../utils/PermissionManager';

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock PermissionManager
jest.mock('../../utils/PermissionManager', () => ({
  handleMediaPermissions: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockLaunchImageLibrary =
  require('react-native-image-picker').launchImageLibrary;

describe('VideoGalleryPicker', () => {
  const mockProps = {
    selectionLimit: 2,
    onSelection: jest.fn(),
    onCancel: jest.fn(),
    allowMultipleSelection: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Handling', () => {
    it('should request gallery permissions on initialization', async () => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: true,
        permissions: { photoLibrary: { granted: true } },
      });

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ didCancel: true });
      });

      render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(PermissionManager.handleMediaPermissions).toHaveBeenCalledWith(
          'gallery',
        );
      });
    });

    it('should show permission denied state when permissions are not granted', async () => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: false,
        permissions: { photoLibrary: { granted: false } },
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('Permission Required')).toBeTruthy();
        expect(
          getByText('Video library access is required to select videos.'),
        ).toBeTruthy();
      });
    });
  });

  describe('Video Loading', () => {
    beforeEach(() => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: true,
        permissions: { photoLibrary: { granted: true } },
      });
    });

    it('should show loading state initially', () => {
      mockLaunchImageLibrary.mockImplementation(() => {
        // Don't call callback to simulate loading
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      expect(getByText('Loading videos...')).toBeTruthy();
    });

    it('should load videos successfully', async () => {
      const mockVideos = [
        {
          uri: 'file://video1.mp4',
          fileName: 'video1.mp4',
          width: 1920,
          height: 1080,
          duration: 120,
          fileSize: 10240000,
          type: 'video/mp4',
        },
        {
          uri: 'file://video2.mp4',
          fileName: 'video2.mp4',
          width: 1280,
          height: 720,
          duration: 60,
          fileSize: 5120000,
          type: 'video/mp4',
        },
      ];

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        expect(options.mediaType).toBe('video');
        callback({ assets: mockVideos });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('Select Videos')).toBeTruthy();
      });
    });

    it('should show empty state when no videos are found', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: [] });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('No Videos Found')).toBeTruthy();
        expect(
          getByText('No videos were found in your video library.'),
        ).toBeTruthy();
      });
    });

    it('should handle video picker errors', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ errorMessage: 'Failed to load videos' });
      });

      render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to load videos from gallery.',
        );
      });
    });
  });

  describe('Single Selection Mode', () => {
    const singleSelectionProps = {
      ...mockProps,
      allowMultipleSelection: false,
      selectionLimit: 1,
    };

    it('should call onSelection immediately when video is pressed in single selection mode', async () => {
      const mockVideos = [
        {
          uri: 'file://video1.mp4',
          fileName: 'video1.mp4',
          width: 1920,
          height: 1080,
          duration: 120,
          fileSize: 10240000,
          type: 'video/mp4',
        },
      ];

      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: true,
        permissions: { photoLibrary: { granted: true } },
      });

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: mockVideos });
      });

      const { getByText } = render(
        <VideoGalleryPicker {...singleSelectionProps} />,
      );

      await waitFor(() => {
        expect(getByText('Select Video')).toBeTruthy();
      });

      expect(singleSelectionProps.onSelection).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Selection Mode', () => {
    beforeEach(() => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: true,
        permissions: { photoLibrary: { granted: true } },
      });
    });

    it('should show selection info in multiple selection mode', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: [] });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('0 of 2 selected')).toBeTruthy();
      });
    });

    it('should show done button when videos are selected', async () => {
      const mockVideos = [
        {
          uri: 'file://video1.mp4',
          fileName: 'video1.mp4',
          width: 1920,
          height: 1080,
          duration: 120,
          fileSize: 10240000,
          type: 'video/mp4',
        },
      ];

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: mockVideos });
      });

      const { queryByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        // Initially no done button should be visible
        expect(queryByText(/Done \(/)).toBeFalsy();
      });
    });
  });

  describe('Video Information Display', () => {
    beforeEach(() => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: true,
        permissions: { photoLibrary: { granted: true } },
      });
    });

    it('should format duration correctly', async () => {
      const mockVideos = [
        {
          uri: 'file://video1.mp4',
          fileName: 'video1.mp4',
          width: 1920,
          height: 1080,
          duration: 125, // 2:05
          fileSize: 10240000,
          type: 'video/mp4',
        },
      ];

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: mockVideos });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('2:05')).toBeTruthy();
      });
    });

    it('should format file size correctly', async () => {
      const mockVideos = [
        {
          uri: 'file://video1.mp4',
          fileName: 'video1.mp4',
          width: 1920,
          height: 1080,
          duration: 120,
          fileSize: 10485760, // 10MB
          type: 'video/mp4',
        },
      ];

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: mockVideos });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('10.0MB')).toBeTruthy();
      });
    });

    it('should handle videos without duration', async () => {
      const mockVideos = [
        {
          uri: 'file://video1.mp4',
          fileName: 'video1.mp4',
          width: 1920,
          height: 1080,
          duration: null,
          fileSize: 10240000,
          type: 'video/mp4',
        },
      ];

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ assets: mockVideos });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(getByText('0:00')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should call onCancel when cancel button is pressed', async () => {
      PermissionManager.handleMediaPermissions.mockResolvedValue({
        success: true,
        permissions: { photoLibrary: { granted: true } },
      });

      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ didCancel: true });
      });

      const { getByText } = render(<VideoGalleryPicker {...mockProps} />);

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle permission initialization errors', async () => {
      PermissionManager.handleMediaPermissions.mockRejectedValue(
        new Error('Permission error'),
      );

      render(<VideoGalleryPicker {...mockProps} />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to access video library. Please try again.',
        );
      });
    });
  });
});
