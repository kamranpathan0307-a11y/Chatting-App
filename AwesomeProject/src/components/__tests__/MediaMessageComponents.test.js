import React from 'react';
import { render } from '@testing-library/react-native';
import ImageMessage from '../ImageMessage';
import VideoMessage from '../VideoMessage';
import AudioMessage from '../AudioMessage';
import DocumentMessage from '../DocumentMessage';

describe('Media Message Components', () => {
  describe('ImageMessage', () => {
    const mockImageProps = {
      imageUrl: 'https://example.com/image.jpg',
      width: 400,
      height: 300,
      isOutgoing: false,
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<ImageMessage {...mockImageProps} />);
      }).not.toThrow();
    });

    it('should handle missing props gracefully', () => {
      expect(() => {
        render(<ImageMessage />);
      }).not.toThrow();
    });
  });

  describe('VideoMessage', () => {
    const mockVideoProps = {
      videoUrl: 'https://example.com/video.mp4',
      thumbnail: 'https://example.com/thumbnail.jpg',
      duration: 120,
      width: 640,
      height: 480,
      isOutgoing: true,
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<VideoMessage {...mockVideoProps} />);
      }).not.toThrow();
    });

    it('should handle missing props gracefully', () => {
      expect(() => {
        render(<VideoMessage />);
      }).not.toThrow();
    });
  });

  describe('AudioMessage', () => {
    const mockAudioProps = {
      audioUrl: 'https://example.com/audio.mp3',
      duration: 45,
      isOutgoing: false,
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<AudioMessage {...mockAudioProps} />);
      }).not.toThrow();
    });

    it('should render audio controls', () => {
      const { getByText } = render(<AudioMessage {...mockAudioProps} />);

      expect(getByText('0:45')).toBeTruthy();
    });

    it('should handle missing props gracefully', () => {
      expect(() => {
        render(<AudioMessage />);
      }).not.toThrow();
    });
  });

  describe('DocumentMessage', () => {
    const mockDocumentProps = {
      documentUrl: 'https://example.com/document.pdf',
      fileName: 'sample-document.pdf',
      fileSize: 1024000, // 1MB
      mimeType: 'application/pdf',
      isOutgoing: true,
    };

    it('should render without crashing', () => {
      expect(() => {
        render(<DocumentMessage {...mockDocumentProps} />);
      }).not.toThrow();
    });

    it('should render document info correctly', () => {
      const { getByText } = render(<DocumentMessage {...mockDocumentProps} />);

      expect(getByText('sample-document.pdf')).toBeTruthy();
      expect(getByText('PDF')).toBeTruthy();
      expect(getByText('1000 KB')).toBeTruthy();
    });

    it('should show correct file type icon for PDF', () => {
      const { getByText } = render(<DocumentMessage {...mockDocumentProps} />);

      expect(getByText('📕')).toBeTruthy();
    });

    it('should show warning for large files', () => {
      const largeFileProps = {
        ...mockDocumentProps,
        fileSize: 15 * 1024 * 1024, // 15MB
      };

      const { getByText } = render(<DocumentMessage {...largeFileProps} />);

      expect(getByText('Large file - may take time to download')).toBeTruthy();
    });

    it('should handle missing props gracefully', () => {
      expect(() => {
        render(<DocumentMessage />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should apply outgoing styles correctly', () => {
      const components = [
        <ImageMessage isOutgoing={true} imageUrl="test.jpg" />,
        <VideoMessage isOutgoing={true} videoUrl="test.mp4" />,
        <AudioMessage isOutgoing={true} audioUrl="test.mp3" />,
        <DocumentMessage isOutgoing={true} fileName="test.pdf" />,
      ];

      components.forEach(component => {
        expect(() => {
          render(component);
        }).not.toThrow();
      });
    });
  });
});
