import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MediaPickerModal from '../MediaPickerModal';

describe('MediaPickerModal', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onCameraPress: jest.fn(),
    onImageGalleryPress: jest.fn(),
    onVideoGalleryPress: jest.fn(),
    onAudioPress: jest.fn(),
    onDocumentPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when visible is true', () => {
      const { getByText } = render(<MediaPickerModal {...mockProps} />);

      expect(getByText('Camera')).toBeTruthy();
      expect(getByText('Image Gallery')).toBeTruthy();
      expect(getByText('Video Gallery')).toBeTruthy();
      expect(getByText('Audio')).toBeTruthy();
      expect(getByText('Documents')).toBeTruthy();
    });

    it('should not render content when visible is false', () => {
      const { queryByText } = render(
        <MediaPickerModal {...mockProps} visible={false} />,
      );

      // When modal is not visible, content should not be accessible
      expect(queryByText('Camera')).toBeNull();
    });
  });

  describe('Option Selection', () => {
    it('should call onCameraPress when Camera option is pressed', () => {
      const { getByText } = render(<MediaPickerModal {...mockProps} />);

      fireEvent.press(getByText('Camera'));
      expect(mockProps.onCameraPress).toHaveBeenCalledTimes(1);
    });

    it('should call onImageGalleryPress when Image Gallery option is pressed', () => {
      const { getByText } = render(<MediaPickerModal {...mockProps} />);

      fireEvent.press(getByText('Image Gallery'));
      expect(mockProps.onImageGalleryPress).toHaveBeenCalledTimes(1);
    });

    it('should call onVideoGalleryPress when Video Gallery option is pressed', () => {
      const { getByText } = render(<MediaPickerModal {...mockProps} />);

      fireEvent.press(getByText('Video Gallery'));
      expect(mockProps.onVideoGalleryPress).toHaveBeenCalledTimes(1);
    });

    it('should call onAudioPress when Audio option is pressed', () => {
      const { getByText } = render(<MediaPickerModal {...mockProps} />);

      fireEvent.press(getByText('Audio'));
      expect(mockProps.onAudioPress).toHaveBeenCalledTimes(1);
    });

    it('should call onDocumentPress when Documents option is pressed', () => {
      const { getByText } = render(<MediaPickerModal {...mockProps} />);

      fireEvent.press(getByText('Documents'));
      expect(mockProps.onDocumentPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Validation', () => {
    it('should handle missing callback props gracefully', () => {
      const minimalProps = {
        visible: true,
        onClose: jest.fn(),
      };

      expect(() => {
        render(<MediaPickerModal {...minimalProps} />);
      }).not.toThrow();
    });
  });
});
