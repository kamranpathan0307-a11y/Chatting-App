import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { formatMessageTime } from '../utils/formatTime';
import Avatar from './Avatar';
import ImageMessage from './ImageMessage';
import VideoMessage from './VideoMessage';
import AudioMessage from './AudioMessage';
import DocumentMessage from './DocumentMessage';

const MessageBubble = ({ message, isOutgoing, sender, showAvatar = false }) => {
  const bubbleStyle = isOutgoing
    ? styles.outgoingBubble
    : styles.incomingBubble;
  const textStyle = isOutgoing ? styles.outgoingText : styles.incomingText;
  const containerStyle = isOutgoing
    ? styles.outgoingContainer
    : styles.incomingContainer;

  const renderStatusIcon = () => {
    if (!isOutgoing) return null;

    const status = message.deliveryStatus || message.status;
    switch (status) {
      case 'sent':
        return <Text style={styles.statusIcon}>✓</Text>;
      case 'delivered':
        return <Text style={styles.statusIcon}>✓✓</Text>;
      case 'read':
        return <Text style={[styles.statusIcon, styles.statusRead]}>✓✓</Text>;
      default:
        return null;
    }
  };

  const renderMediaContent = () => {
    const messageType = message.messageType || message.type;

    switch (messageType) {
      case 'image':
        return (
          <ImageMessage
            imageUrl={message.mediaUrl || message.imageUrl}
            thumbnail={message.thumbnailUrl}
            width={message.width}
            height={message.height}
            isOutgoing={isOutgoing}
          />
        );

      case 'video':
        return (
          <VideoMessage
            videoUrl={message.mediaUrl}
            thumbnail={message.thumbnailUrl}
            duration={message.duration}
            width={message.width}
            height={message.height}
            isOutgoing={isOutgoing}
          />
        );

      case 'audio':
        return (
          <AudioMessage
            audioUrl={message.mediaUrl}
            duration={message.duration}
            isOutgoing={isOutgoing}
          />
        );

      case 'document':
        return (
          <DocumentMessage
            documentUrl={message.mediaUrl}
            fileName={message.fileName}
            fileSize={message.fileSize}
            mimeType={message.mimeType}
            isOutgoing={isOutgoing}
          />
        );

      default:
        return null;
    }
  };

  const hasMediaContent = message.messageType && message.messageType !== 'text';
  const hasTextContent = message.text && message.text.trim().length > 0;

  return (
    <View style={containerStyle}>
      {!isOutgoing && showAvatar && (
        <Avatar
          source={sender?.avatar}
          initials={sender?.initials}
          size={32}
          style={styles.avatar}
        />
      )}

      <View style={[bubbleStyle, hasMediaContent && styles.mediaBubble]}>
        {/* Render media content */}
        {hasMediaContent && renderMediaContent()}

        {/* Render text content if present */}
        {hasTextContent && <Text style={textStyle}>{message.text}</Text>}

        {/* Footer with timestamp and status */}
        <View style={styles.footer}>
          <Text style={[styles.time, isOutgoing && styles.timeOutgoing]}>
            {formatMessageTime(message.timestamp)}
          </Text>
          {renderStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  incomingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  outgoingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  avatar: {
    marginRight: spacing.xs,
  },
  incomingBubble: {
    maxWidth: '75%',
    backgroundColor: colors.messageIncoming,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopLeftRadius: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  outgoingBubble: {
    maxWidth: '75%',
    backgroundColor: colors.messageOutgoing,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopRightRadius: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  mediaBubble: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  incomingText: {
    ...typography.body,
    color: colors.messageText,
  },
  outgoingText: {
    ...typography.body,
    color: colors.messageTextOutgoing,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs / 2,
    gap: spacing.xs / 2,
  },
  time: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 11,
  },
  timeOutgoing: {
    color: colors.messageTextOutgoing,
    opacity: 0.9,
  },
  statusIcon: {
    fontSize: 12,
    color: colors.messageTextOutgoing,
    opacity: 0.9,
    marginLeft: spacing.xs / 2,
  },
  statusRead: {
    color: colors.messageTextOutgoing,
  },
});

export default memo(MessageBubble);
