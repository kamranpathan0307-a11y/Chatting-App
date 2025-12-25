import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../theme';
import ChatItem from '../components/ChatItem';
import API from '../utils/api';

const ChatsListScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadChats();
    };
    init();
    
    // Refresh chats when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadChats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        return user;
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
    return null;
  };

  const loadChats = async () => {
    try {
      const response = await API.get('/chats');
      if (response.data) {
        // Get current user for comparison
        const user = currentUser || await loadUser();
        
        // Transform backend data to match ChatItem component format
        const transformedChats = response.data.map(chat => {
          const otherMember = chat.members?.find(m => m._id !== user?._id) || chat.members?.[0];
          return {
            id: chat._id,
            name: otherMember?.name || 'Unknown',
            avatar: otherMember?.avatar || null,
            initials: otherMember?.name ? otherMember.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?',
            lastMessage: chat.lastMessage ? {
              text: chat.lastMessage.text || '',
              timestamp: chat.lastMessage.createdAt || Date.now(),
            } : null,
            unreadCount: chat.unreadCount || 0,
            timestamp: chat.lastMessage?.createdAt || chat.updatedAt || Date.now(),
            isGroup: chat.members?.length > 2,
            participants: chat.members?.map(m => m._id) || [],
          };
        });
        
        // Sort by timestamp
        transformedChats.sort((a, b) => b.timestamp - a.timestamp);
        setChats(transformedChats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      // Fallback to empty array on error
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const handleChatPress = (chat) => {
    navigation.navigate('IndividualChat', { 
      chatId: chat.id, 
      chatName: chat.name
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.topLinks}>
        <TouchableOpacity>
          <Text style={styles.linkText}>Broadcast Lists</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.linkText}>New Group</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem chat={item} onPress={() => handleChatPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats found</Text>
              <Text style={styles.emptySubtext}>Start a new conversation</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Contacts')}
      >
        <Text style={styles.fabIcon}>👥</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  editText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  title: {
    ...typography.h1,
  },
  cameraIcon: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    marginHorizontal: spacing.md,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 36,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
  },
  topLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 24,
  },
});

export default ChatsListScreen;

