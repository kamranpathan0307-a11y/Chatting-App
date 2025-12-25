import React from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import SettingsItem from '../components/SettingsItem';
import Avatar from '../components/Avatar';
import { currentUser } from '../data/users';

const SettingsScreen = ({ navigation }) => {
  const settingsItems = [
    {
      id: 'account',
      icon: '👤',
      title: 'Account',
      onPress: () => {},
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: 'Privacy',
      onPress: () => {},
    },
    {
      id: 'chats',
      icon: '💬',
      title: 'Chats',
      onPress: () => {},
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications',
      onPress: () => {},
    },
    {
      id: 'storage',
      icon: '💾',
      title: 'Data and Storage Usage',
      onPress: () => {},
    },
    {
      id: 'help',
      icon: '❓',
      title: 'Help',
      onPress: () => {},
    },
    {
      id: 'tell-friend',
      icon: '❤️',
      title: 'Tell a Friend',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <TouchableOpacity 
        style={styles.profileCard}
        activeOpacity={0.7}
      >
        <Avatar
          source={currentUser.avatar}
          initials={currentUser.name.split(' ').map(n => n[0]).join('')}
          size={64}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{currentUser.name}</Text>
          <Text style={styles.profileStatus}>{currentUser.status}</Text>
        </View>
        <Text style={styles.qrIcon}>📱</Text>
      </TouchableOpacity>

      <FlatList
        data={settingsItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SettingsItem
            icon={item.icon}
            title={item.title}
            onPress={item.onPress}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>FROM Metaverse</Text>
        <Text style={styles.footerText}>Version 2.14.0</Text>
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    marginHorizontal: spacing.md,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 36,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  profileStatus: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  qrIcon: {
    fontSize: 24,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.caption,
    color: colors.textLight,
    marginVertical: spacing.xs / 2,
  },
});

export default SettingsScreen;

