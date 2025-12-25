import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { colors, spacing, typography } from '../theme';
import { formatTime } from '../utils/formatTime';

const ChatItem = ({ chat, onPress }) => {
  const lastMessageText = chat.lastMessage?.text || 'No messages yet';
  const timeText = formatTime(chat.timestamp);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar
        source={chat.avatar}
        initials={chat.initials}
        size={56}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={styles.time}>{timeText}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.message} numberOfLines={1}>
            {lastMessageText}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    ...typography.bodySmall,
    color: colors.textLight,
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 13,
  },
  unreadBadge: {
    backgroundColor: colors.unreadBadge,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: 'bold',
  },
});

export default memo(ChatItem);

