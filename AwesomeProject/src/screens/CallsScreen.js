import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import Avatar from '../components/Avatar';
import { getSortedCalls } from '../data/calls';
import { formatTime } from '../utils/formatTime';

const CallsScreen = ({ navigation }) => {
  const calls = useMemo(() => getSortedCalls(), []);

  const formatDuration = (seconds) => {
    if (seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallItem = ({ item }) => {
    const callIcon = item.type === 'video' ? '📹' : '📞';
    const directionIcon = item.direction === 'incoming' ? '↓' : '↑';
    const isMissed = item.missed;

    return (
      <TouchableOpacity 
        style={styles.callItem}
        onPress={() => navigation.navigate('IndividualChat', { 
          chatId: item.contactId, 
          chatName: item.name 
        })}
        activeOpacity={0.7}
      >
        <Avatar
          source={item.avatar}
          initials={item.initials}
          size={56}
        />
        
        <View style={styles.callInfo}>
          <View style={styles.callHeader}>
            <Text style={[styles.callName, isMissed && styles.missedCall]}>
              {item.name}
            </Text>
            <View style={styles.callMeta}>
              <Text style={styles.callIcon}>{callIcon}</Text>
              <Text style={[styles.directionIcon, isMissed && styles.missedIcon]}>
                {directionIcon}
              </Text>
            </View>
          </View>
          
          <View style={styles.callFooter}>
            <Text style={[styles.callTime, isMissed && styles.missedText]}>
              {isMissed ? 'Missed' : formatTime(item.timestamp)}
            </Text>
            {!isMissed && item.duration > 0 && (
              <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.callButton}>
          <Text style={styles.callButtonIcon}>
            {item.type === 'video' ? '📹' : '📞'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
      </View>

      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        renderItem={renderCallItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No calls yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  callInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  callName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  missedCall: {
    color: colors.error,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  callIcon: {
    fontSize: 16,
  },
  directionIcon: {
    fontSize: 14,
    color: colors.textLight,
  },
  missedIcon: {
    color: colors.error,
  },
  callFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  callTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  missedText: {
    color: colors.error,
  },
  duration: {
    ...typography.caption,
    color: colors.textLight,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  callButtonIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },
});

export default CallsScreen;

