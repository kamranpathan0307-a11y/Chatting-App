import React, { useState } from 'react';
import CameraInterface from './CameraInterface';
import ImageEditor from './ImageEditor';
import VideoPreview from './VideoPreview';

const CameraWorkflow = ({
  visible,
  mediaType = 'mixed',
  onMediaReady,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState('camera'); // 'camera', 'imageEditor', 'videoPreview'
  const [capturedMedia, setCapturedMedia] = useState(null);

  const handleCameraCapture = mediaAsset => {
    setCapturedMedia(mediaAsset);

    // Route to appropriate editor based on media type
    if (mediaAsset.type === 'image') {
      setCurrentStep('imageEditor');
    } else if (mediaAsset.type === 'video') {
      setCurrentStep('videoPreview');
    }
  };

  const handleImageEditorSave = editedImageUri => {
    // Update the media asset with edited image URI
    const updatedMedia = {
      ...capturedMedia,
      uri: editedImageUri,
    };

    // Return the final media to parent component
    onMediaReady(updatedMedia);

    // Reset workflow
    resetWorkflow();
  };

  const handleVideoPreviewSend = videoUri => {
    // Update the media asset with final video URI
    const updatedMedia = {
      ...capturedMedia,
      uri: videoUri,
    };

    // Return the final media to parent component
    onMediaReady(updatedMedia);

    // Reset workflow
    resetWorkflow();
  };

  const handleImageEditorCancel = () => {
    // Go back to camera
    setCurrentStep('camera');
    setCapturedMedia(null);
  };

  const handleVideoPreviewCancel = () => {
    // Go back to camera
    setCurrentStep('camera');
    setCapturedMedia(null);
  };

  const handleCameraCancel = () => {
    // Cancel entire workflow
    resetWorkflow();
    onCancel();
  };

  const resetWorkflow = () => {
    setCurrentStep('camera');
    setCapturedMedia(null);
  };

  // Reset workflow when visibility changes
  React.useEffect(() => {
    if (!visible) {
      resetWorkflow();
    }
  }, [visible]);

  return (
    <>
      <CameraInterface
        visible={visible && currentStep === 'camera'}
        mediaType={mediaType}
        onCapture={handleCameraCapture}
        onCancel={handleCameraCancel}
      />

      <ImageEditor
        visible={visible && currentStep === 'imageEditor'}
        imageUri={capturedMedia?.uri}
        onSave={handleImageEditorSave}
        onCancel={handleImageEditorCancel}
      />

      <VideoPreview
        visible={visible && currentStep === 'videoPreview'}
        videoUri={capturedMedia?.uri}
        onSend={handleVideoPreviewSend}
        onCancel={handleVideoPreviewCancel}
      />
    </>
  );
};

export default CameraWorkflow;
