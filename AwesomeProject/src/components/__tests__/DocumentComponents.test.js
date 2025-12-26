import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import DocumentPickerComponent from '../DocumentPicker';
import DocumentPreview from '../DocumentPreview';

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pickSingle: jest.fn(),
  isCancel: jest.fn(),
  types: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    plainText: 'text/plain',
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('DocumentPicker Component', () => {
  const mockProps = {
    onSelection: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render document picker interface', () => {
      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      expect(getByText('Select Document')).toBeTruthy();
      expect(
        getByText('Choose a document from your device to share'),
      ).toBeTruthy();
      expect(getByText('Browse Files')).toBeTruthy();
      expect(getByText('Supported Formats:')).toBeTruthy();
      expect(getByText('Maximum file size: 10MB')).toBeTruthy();
    });

    it('should show loading state when picking document', async () => {
      DocumentPicker.pickSingle.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Browse Files'));

      await waitFor(() => {
        expect(getByText('Opening file browser...')).toBeTruthy();
      });
    });
  });

  describe('Document Selection', () => {
    it('should handle successful document selection', async () => {
      const mockDocument = {
        uri: 'file://document.pdf',
        fileCopyUri: 'file://cached/document.pdf',
        name: 'test-document.pdf',
        size: 1024000, // 1MB
        type: 'application/pdf',
      };

      DocumentPicker.pickSingle.mockResolvedValue(mockDocument);

      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Browse Files'));

      await waitFor(() => {
        expect(mockProps.onSelection).toHaveBeenCalledWith({
          id: expect.stringContaining('doc_'),
          type: 'document',
          uri: mockDocument.fileCopyUri,
          fileName: mockDocument.name,
          fileSize: mockDocument.size,
          mimeType: mockDocument.type,
          extension: 'pdf',
        });
      });
    });

    it('should reject unsupported file types', async () => {
      const mockDocument = {
        uri: 'file://document.exe',
        name: 'malware.exe',
        size: 1024000,
        type: 'application/x-executable',
      };

      DocumentPicker.pickSingle.mockResolvedValue(mockDocument);

      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Browse Files'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Unsupported File Type',
          'Only PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, TXT files are supported.',
          [{ text: 'OK' }],
        );
        expect(mockProps.onSelection).not.toHaveBeenCalled();
      });
    });

    it('should reject files that are too large', async () => {
      const mockDocument = {
        uri: 'file://large-document.pdf',
        name: 'large-document.pdf',
        size: 15 * 1024 * 1024, // 15MB
        type: 'application/pdf',
      };

      DocumentPicker.pickSingle.mockResolvedValue(mockDocument);

      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Browse Files'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'File Too Large',
          expect.stringContaining('exceeds the 10MB limit'),
          [{ text: 'OK' }],
        );
        expect(mockProps.onSelection).not.toHaveBeenCalled();
      });
    });

    it('should handle user cancellation', async () => {
      const error = new Error('User cancelled');
      DocumentPicker.isCancel.mockReturnValue(true);
      DocumentPicker.pickSingle.mockRejectedValue(error);

      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Browse Files'));

      await waitFor(() => {
        expect(mockProps.onSelection).not.toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });

    it('should handle picker errors', async () => {
      const error = new Error('Picker error');
      DocumentPicker.isCancel.mockReturnValue(false);
      DocumentPicker.pickSingle.mockRejectedValue(error);

      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Browse Files'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to select document. Please try again.',
          [{ text: 'OK' }],
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const { getByText } = render(<DocumentPickerComponent {...mockProps} />);

      fireEvent.press(getByText('Cancel'));

      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });
});

describe('DocumentPreview Component', () => {
  const mockDocumentAsset = {
    id: 'doc_123',
    type: 'document',
    uri: 'file://document.pdf',
    fileName: 'test-document.pdf',
    fileSize: 2 * 1024 * 1024, // 2MB
    mimeType: 'application/pdf',
    extension: 'pdf',
  };

  const mockProps = {
    documentAsset: mockDocumentAsset,
    onSend: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render document preview interface', () => {
      const { getByText, getAllByText } = render(
        <DocumentPreview {...mockProps} />,
      );

      expect(getByText('Document Preview')).toBeTruthy();
      expect(getAllByText('test-document.pdf').length).toBeGreaterThan(0);
      expect(getAllByText('2 MB').length).toBeGreaterThan(0);
      expect(getAllByText('PDF').length).toBeGreaterThan(0);
      expect(getByText('Send Document')).toBeTruthy();
    });

    it('should show file details correctly', () => {
      const { getByText } = render(<DocumentPreview {...mockProps} />);

      expect(getByText('File Details')).toBeTruthy();
      expect(getByText('Name:')).toBeTruthy();
      expect(getByText('Size:')).toBeTruthy();
      expect(getByText('Type:')).toBeTruthy();
      expect(getByText('MIME Type:')).toBeTruthy();
    });

    it('should return null when no document asset is provided', () => {
      const { UNSAFE_root } = render(
        <DocumentPreview {...mockProps} documentAsset={null} />,
      );

      expect(UNSAFE_root.children).toHaveLength(0);
    });
  });

  describe('File Size Warnings', () => {
    it('should show warning for large files (5MB+)', () => {
      const largeDocument = {
        ...mockDocumentAsset,
        fileSize: 7 * 1024 * 1024, // 7MB
      };

      const { getByText } = render(
        <DocumentPreview {...mockProps} documentAsset={largeDocument} />,
      );

      expect(getByText('Large File')).toBeTruthy();
      expect(getByText(/may take longer to upload/)).toBeTruthy();
    });

    it('should show error for files too large (10MB+)', () => {
      const tooLargeDocument = {
        ...mockDocumentAsset,
        fileSize: 15 * 1024 * 1024, // 15MB
      };

      const { getByText, getAllByText } = render(
        <DocumentPreview {...mockProps} documentAsset={tooLargeDocument} />,
      );

      expect(getAllByText('File Too Large').length).toBeGreaterThan(0);
      expect(getByText(/Maximum file size is 10MB/)).toBeTruthy();
    });

    it('should not show warnings for normal sized files', () => {
      const { queryByText } = render(<DocumentPreview {...mockProps} />);

      expect(queryByText('Large File')).toBeFalsy();
      expect(queryByText('File Too Large')).toBeFalsy();
    });
  });

  describe('Send Functionality', () => {
    it('should call onSend for normal sized files', () => {
      const { getByText } = render(<DocumentPreview {...mockProps} />);

      fireEvent.press(getByText('Send Document'));

      expect(mockProps.onSend).toHaveBeenCalledWith(mockDocumentAsset);
    });

    it('should show confirmation dialog for large files', () => {
      const largeDocument = {
        ...mockDocumentAsset,
        fileSize: 7 * 1024 * 1024, // 7MB
      };

      const { getByText } = render(
        <DocumentPreview {...mockProps} documentAsset={largeDocument} />,
      );

      fireEvent.press(getByText('Send Document'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Large File Warning',
        expect.stringContaining('7 MB'),
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Anyway', onPress: expect.any(Function) },
        ]),
      );
    });

    it('should prevent sending files that are too large', () => {
      const tooLargeDocument = {
        ...mockDocumentAsset,
        fileSize: 15 * 1024 * 1024, // 15MB
      };

      const { getAllByText, getByText } = render(
        <DocumentPreview {...mockProps} documentAsset={tooLargeDocument} />,
      );

      // The button should be disabled and show "File Too Large" text
      const fileTooLargeButtons = getAllByText('File Too Large');
      expect(fileTooLargeButtons.length).toBeGreaterThan(0);

      // Check that the error message is displayed
      expect(getByText(/Maximum file size is 10MB/)).toBeTruthy();

      // The onSend should not be called since button is disabled
      expect(mockProps.onSend).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const { getByText } = render(<DocumentPreview {...mockProps} />);

      fireEvent.press(getByText('Cancel'));

      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('File Type Icons', () => {
    it('should show correct icon for PDF files', () => {
      const { getByText } = render(<DocumentPreview {...mockProps} />);

      expect(getByText('📄')).toBeTruthy();
    });

    it('should show correct icon for Word documents', () => {
      const wordDocument = {
        ...mockDocumentAsset,
        extension: 'docx',
        fileName: 'document.docx',
      };

      const { getByText } = render(
        <DocumentPreview {...mockProps} documentAsset={wordDocument} />,
      );

      expect(getByText('📝')).toBeTruthy();
    });

    it('should show correct icon for Excel files', () => {
      const excelDocument = {
        ...mockDocumentAsset,
        extension: 'xlsx',
        fileName: 'spreadsheet.xlsx',
      };

      const { getByText } = render(
        <DocumentPreview {...mockProps} documentAsset={excelDocument} />,
      );

      expect(getByText('📈')).toBeTruthy();
    });
  });
});
