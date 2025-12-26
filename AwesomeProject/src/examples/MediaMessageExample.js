import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  ImageMessage,
  VideoMessage,
  AudioMessage,
  DocumentMessage,
} from '../components/MediaMessages';
import { colors, spacing } from '../theme';

const MediaMessageExample = () => {
  // Example media message data
  const sampleMessages = [
    {
      type: 'image',
      imageUrl: 'https://picsum.photos/400/300?random=1',
      width: 400,
      height: 300,
      isOutgoing: false,
    },
    {
      type: 'video',
      videoUrl:
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnail: 'https://picsum.photos/640/480?random=2',
      duration: 120,
      width: 640,
      height: 480,
      isOutgoing: true,
    },
    {
      type: 'audio',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 45,
      isOutgoing: false,
    },
    {
      type: 'document',
      documentUrl:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'project-proposal.pdf',
      fileSize: 2048000, // 2MB
      mimeType: 'application/pdf',
      isOutgoing: true,
    },
    {
      type: 'document',
      documentUrl: 'https://example.com/large-file.zip',
      fileName: 'large-archive.zip',
      fileSize: 15 * 1024 * 1024, // 15MB - will show warning
      mimeType: 'application/zip',
      isOutgoing: false,
    },
  ];

  const renderMessage = (message, index) => {
    const commonProps = {
      key: index,
      isOutgoing: message.isOutgoing,
      style: styles.messageContainer,
    };

    switch (message.type) {
      case 'image':
        return (
          <ImageMessage
            {...commonProps}
            imageUrl={message.imageUrl}
            width={message.width}
            height={message.height}
          />
        );

      case 'video':
        return (
          <VideoMessage
            {...commonProps}
            videoUrl={message.videoUrl}
            thumbnail={message.thumbnail}
            duration={message.duration}
            width={message.width}
            height={message.height}
          />
        );

      case 'audio':
        return (
          <AudioMessage
            {...commonProps}
            audioUrl={message.audioUrl}
            duration={message.duration}
          />
        );

      case 'document':
        return (
          <DocumentMessage
            {...commonProps}
            documentUrl={message.documentUrl}
            fileName={message.fileName}
            fileSize={message.fileSize}
            mimeType={message.mimeType}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>{sampleMessages.map(renderMessage)}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    padding: spacing.md,
  },
  messageContainer: {
    marginVertical: spacing.sm,
  },
});

export default MediaMessageExample;
