import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../theme';
import Avatar from '../components/Avatar';
import { getAllContacts } from '../utils/contacts';
import { showInviteOptions } from '../utils/invite';
import API from '../utils/api';

const ContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUser();
    syncContacts();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const syncContacts = async () => {
    try {
      setLoading(true);

      // Get contacts from device
      const deviceContacts = await getAllContacts();
      
      if (deviceContacts.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      // Extract phone numbers
      const phoneNumbers = deviceContacts.map(c => c.phone);

      // Check which contacts are registered users
      const response = await API.post('/contacts/check', {
        phoneNumbers,
      });

      if (response.data) {
        // Combine device contacts with backend data
        const combinedContacts = deviceContacts.map((deviceContact) => {
          const registered = response.data.registered.find(
            (r) => r.phone === deviceContact.phone
          );
          
          if (registered) {
            return {
              ...deviceContact,
              isRegistered: true,
              userId: registered.user._id,
              user: registered.user,
            };
          } else {
            return {
              ...deviceContact,
              isRegistered: false,
            };
          }
        });

        // Sort: registered first, then by name
        combinedContacts.sort((a, b) => {
          if (a.isRegistered && !b.isRegistered) return -1;
          if (!a.isRegistered && b.isRegistered) return 1;
          return a.name.localeCompare(b.name);
        });

        setContacts(combinedContacts);
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      if (error.message?.includes('permission')) {
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to sync your contacts.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to sync contacts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContactPress = async (contact) => {
    if (contact.isRegistered) {
      try {
        // Get or create chat with this user
        const response = await API.post('/chats', {
          otherUserId: contact.userId,
        });
        
        if (response.data && response.data._id) {
          navigation.navigate('IndividualChat', {
            chatId: response.data._id,
            chatName: contact.user.name || contact.name,
          });
        } else {
          Alert.alert('Error', 'Failed to create chat');
        }
      } catch (error) {
        console.error('Error creating/getting chat:', error);
        Alert.alert('Error', 'Failed to start chat. Please try again.');
      }
    } else {
      // Show invite options
      showInviteOptions(contact.phone);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContactItem = ({ item }) => {
    const displayName = item.isRegistered ? (item.user?.name || item.name) : item.name;
    const displayAvatar = item.isRegistered ? item.user?.avatar : null;
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}
        activeOpacity={0.7}
      >
        <Avatar
          source={displayAvatar}
          initials={initials}
          size={56}
        />
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.contactPhone} numberOfLines={1}>
            {item.phone}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            item.isRegistered ? styles.chatButton : styles.inviteButton,
          ]}
          onPress={() => handleContactPress(item)}
        >
          <Text style={[
            styles.actionButtonText,
            item.isRegistered ? styles.chatButtonText : styles.inviteButtonText,
          ]}>
            {item.isRegistered ? 'Chat' : 'Invite'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity onPress={syncContacts}>
          <Text style={styles.syncText}>Sync</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts"
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Syncing contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item, index) => `${item.phone}-${index}`}
          renderItem={renderContactItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts found</Text>
              <Text style={styles.emptySubtext}>
                {contacts.length === 0
                  ? 'Sync your contacts to find friends'
                  : 'Try adjusting your search'}
              </Text>
            </View>
          }
        />
      )}
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
  title: {
    ...typography.h1,
  },
  syncText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  contactPhone: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontSize: 13,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: colors.primary,
  },
  inviteButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  chatButtonText: {
    color: colors.background,
  },
  inviteButtonText: {
    color: colors.text,
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
});

export default ContactsScreen;

