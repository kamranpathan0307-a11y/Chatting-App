import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { formatMessageTime } from '../utils/formatTime';
import Avatar from './Avatar';

const MessageBubble = ({ message, isOutgoing, sender, showAvatar = false }) => {
  const bubbleStyle = isOutgoing ? styles.outgoingBubble : styles.incomingBubble;
  const textStyle = isOutgoing ? styles.outgoingText : styles.incomingText;
  const containerStyle = isOutgoing ? styles.outgoingContainer : styles.incomingContainer;

  const renderStatusIcon = () => {
    if (!isOutgoing) return null;
    
    switch (message.status) {
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
      
      <View style={bubbleStyle}>
        {message.type === 'image' && message.imageUrl && (
          <TouchableOpacity activeOpacity={0.9}>
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        
        {message.text && (
          <Text style={textStyle}>{message.text}</Text>
        )}
        
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
  incomingText: {
    ...typography.body,
    color: colors.messageText,
  },
  outgoingText: {
    ...typography.body,
    color: colors.messageTextOutgoing,
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 6,
    marginBottom: spacing.xs,
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

