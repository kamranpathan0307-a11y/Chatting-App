import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSocket,
  initializeSocket,
  setupMediaEventListeners,
  removeMediaEventListeners,
  emitMediaUploadProgress,
  emitMediaComposing,
} from '../utils/socket';
import API from '../utils/api';
import { colors, spacing, typography } from '../theme';
import MessageBubble from '../components/MessageBubble';
import InputBar from '../components/InputBar';
import CameraWorkflow from '../components/CameraWorkflow';

const IndividualChatScreen = ({ route, navigation }) => {
  const { chatId, chatName } = route.params;

  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCameraWorkflow, setShowCameraWorkflow] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    // Set header title
    navigation.setOptions({
      title: chatName || 'Chat',
    });

    loadUser();
    loadMessages();
    setupSocket();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('receiveMessage');
        removeMediaEventListeners();
        socket.emit('leaveChat', chatId);
      }
    };
  }, [chatId, navigation]);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/messages/${chatId}`);
      if (response.data && Array.isArray(response.data)) {
        // Transform messages to match component format
        const transformedMessages = response.data.map(msg => ({
          id: msg._id,
          text: msg.text || '',
          senderId: msg.senderId?._id || msg.senderId,
          chatId: msg.chatId?._id || msg.chatId,
          messageType: msg.messageType || 'text',
          mediaUrl: msg.mediaUrl,
          thumbnailUrl: msg.thumbnailUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          mimeType: msg.mimeType,
          width: msg.width,
          height: msg.height,
          duration: msg.duration,
          uploadStatus: msg.uploadStatus || 'uploaded',
          uploadProgress: msg.uploadProgress || 100,
          timestamp: msg.createdAt || Date.now(),
          deliveryStatus: msg.deliveryStatus || 'delivered',
        }));
        setChatMessages(transformedMessages);

        // Scroll to bottom after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      const errorMessage = error.response?.data?.message || error.message;

      if (error.response?.status === 404) {
        // Chat doesn't exist yet - this is OK for new chats
        setChatMessages([]);
      } else if (error.response?.status === 403) {
        Alert.alert('Access Denied', "You don't have access to this chat.");
        navigation.goBack();
      } else if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again.');
        // Token might be invalid, will be handled by interceptor
      } else {
        // Continue with empty messages array for other errors
        setChatMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = async () => {
    try {
      // Ensure socket is initialized and connected
      let socket = getSocket();

      if (!socket || !socket.connected) {
        socket = await initializeSocket();
      }

      if (!socket || !socket.connected) {
        console.warn('Socket not connected, will retry when sending message');
        return;
      }

      // Join chat room
      socket.emit('joinChat', chatId);
      console.log('Joined chat room:', chatId);

      // Listen for new messages
      socket.on('receiveMessage', msg => {
        // Only add if message belongs to this chat
        const msgChatId = msg.chatId?._id || msg.chatId;
        if (
          msgChatId === chatId ||
          msgChatId?.toString() === chatId?.toString()
        ) {
          const transformedMsg = {
            id: msg._id || msg.id || Date.now().toString(),
            text: msg.text || '',
            senderId: msg.senderId?._id || msg.senderId,
            chatId: msgChatId,
            messageType: msg.messageType || 'text',
            mediaUrl: msg.mediaUrl,
            thumbnailUrl: msg.thumbnailUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            mimeType: msg.mimeType,
            width: msg.width,
            height: msg.height,
            duration: msg.duration,
            uploadStatus: msg.uploadStatus || 'uploaded',
            uploadProgress: msg.uploadProgress || 100,
            timestamp: msg.createdAt || msg.timestamp || Date.now(),
            deliveryStatus: msg.deliveryStatus || 'delivered',
          };

          setChatMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === transformedMsg.id)) {
              return prev;
            }
            return [...prev, transformedMsg];
          });

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      // Setup media event listeners
      setupMediaEventListeners({
        onMediaUploadProgress: data => {
          // Update upload progress for messages from other users
          if (data.senderId !== currentUser?._id) {
            setChatMessages(prev =>
              prev.map(msg =>
                msg.id === data.messageId
                  ? { ...msg, uploadProgress: data.progress }
                  : msg,
              ),
            );
          }
        },

        onMediaUploadComplete: data => {
          // Update media URL when upload completes from other users
          if (data.senderId !== currentUser?._id) {
            setChatMessages(prev =>
              prev.map(msg =>
                msg.id === data.messageId
                  ? {
                      ...msg,
                      mediaUrl: data.mediaUrl,
                      uploadStatus: 'uploaded',
                      uploadProgress: 100,
                    }
                  : msg,
              ),
            );
          }
        },

        onMediaUploadFailed: data => {
          // Update upload status when upload fails from other users
          if (data.senderId !== currentUser?._id) {
            setChatMessages(prev =>
              prev.map(msg =>
                msg.id === data.messageId
                  ? { ...msg, uploadStatus: 'failed' }
                  : msg,
              ),
            );
          }
        },

        onMessageStatusUpdate: data => {
          // Update message delivery status
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === data.messageId
                ? { ...msg, deliveryStatus: data.status }
                : msg,
            ),
          );
        },

        onUserMediaComposing: data => {
          // Handle media composing indicators (e.g., show "User is taking a photo...")
          console.log(
            `User ${data.userId} is ${data.action} composing ${data.mediaType}`,
          );
          // TODO: Implement UI indicators for media composing
        },
      });
    } catch (error) {
      console.error('Error setting up socket:', error);
    }
  };

  // 📤 Send message
  const handleSend = async messageText => {
    if (!messageText || !currentUser) return;

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      chatId,
      senderId: currentUser._id,
      text: messageText,
      messageType: 'text',
      timestamp: Date.now(),
      deliveryStatus: 'sending',
    };

    // Optimistic update
    setChatMessages(prev => [...prev, newMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send to backend via API
      const response = await API.post('/messages', {
        chatId,
        text: messageText,
        messageType: 'text',
      });

      // Update message with server response
      if (response.data) {
        const serverMessage = {
          id: response.data._id || response.data.id,
          text: response.data.text,
          senderId: response.data.senderId?._id || response.data.senderId,
          chatId: response.data.chatId?._id || response.data.chatId,
          messageType: response.data.messageType || 'text',
          timestamp: response.data.createdAt || Date.now(),
          deliveryStatus: 'delivered',
        };

        setChatMessages(prev => {
          // Replace temp message with server message
          const filtered = prev.filter(m => m.id !== tempId);
          return [...filtered, serverMessage];
        });

        // Emit via socket for real-time delivery
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('sendMessage', {
            ...serverMessage,
            chatId: chatId,
          });
        } else {
          // Try to initialize and send
          initializeSocket()
            .then(sock => {
              if (sock && sock.connected) {
                sock.emit('sendMessage', {
                  ...serverMessage,
                  chatId: chatId,
                });
              }
            })
            .catch(err => {
              console.error('Failed to send via socket:', err);
            });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // 📤 Send media message
  const handleSendMediaMessage = async mediaAsset => {
    if (!mediaAsset || !currentUser) return;

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      chatId,
      senderId: currentUser._id,
      text: mediaAsset.caption || null,
      messageType: mediaAsset.type,
      mediaUrl: mediaAsset.uri, // Temporary local URI
      thumbnailUrl: mediaAsset.thumbnail,
      fileName: mediaAsset.fileName,
      fileSize: mediaAsset.fileSize,
      mimeType: mediaAsset.mimeType,
      width: mediaAsset.width,
      height: mediaAsset.height,
      duration: mediaAsset.duration,
      uploadStatus: 'uploading',
      uploadProgress: 0,
      timestamp: Date.now(),
      deliveryStatus: 'sending',
    };

    // Optimistic update
    setChatMessages(prev => [...prev, newMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Create FormData for media upload
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('messageType', mediaAsset.type);
      if (mediaAsset.caption) {
        formData.append('text', mediaAsset.caption);
      }

      // Add media file
      formData.append('media', {
        uri: mediaAsset.uri,
        type: mediaAsset.mimeType,
        name: mediaAsset.fileName,
      });

      // Add metadata
      if (mediaAsset.width)
        formData.append('width', mediaAsset.width.toString());
      if (mediaAsset.height)
        formData.append('height', mediaAsset.height.toString());
      if (mediaAsset.duration)
        formData.append('duration', mediaAsset.duration.toString());

      // Send to backend via API with progress tracking
      const response = await API.post('/messages/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );

          // Update upload progress locally
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === tempId
                ? {
                    ...msg,
                    uploadProgress: progress,
                    uploadStatus: progress === 100 ? 'uploaded' : 'uploading',
                  }
                : msg,
            ),
          );

          // Emit progress to other chat participants
          emitMediaUploadProgress(chatId, tempId, tempId, progress);
        },
      });

      // Update message with server response
      if (response.data) {
        const serverMessage = {
          id: response.data._id || response.data.id,
          text: response.data.text,
          senderId: response.data.senderId?._id || response.data.senderId,
          chatId: response.data.chatId?._id || response.data.chatId,
          messageType: response.data.messageType,
          mediaUrl: response.data.mediaUrl,
          thumbnailUrl: response.data.thumbnailUrl,
          fileName: response.data.fileName,
          fileSize: response.data.fileSize,
          mimeType: response.data.mimeType,
          width: response.data.width,
          height: response.data.height,
          duration: response.data.duration,
          uploadStatus: 'uploaded',
          uploadProgress: 100,
          timestamp: response.data.createdAt || Date.now(),
          deliveryStatus: 'delivered',
        };

        setChatMessages(prev => {
          // Replace temp message with server message
          const filtered = prev.filter(m => m.id !== tempId);
          return [...filtered, serverMessage];
        });

        // Emit via socket for real-time delivery
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('sendMessage', {
            ...serverMessage,
            chatId: chatId,
          });
        }
      }
    } catch (error) {
      console.error('Error sending media message:', error);

      // Update message to show failed status
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, uploadStatus: 'failed', deliveryStatus: 'failed' }
            : msg,
        ),
      );

      Alert.alert('Upload Failed', 'Failed to send media. Please try again.');
    }
  };

  // Media handler functions
  const handleCameraPress = () => {
    // Emit media composing start
    emitMediaComposing(chatId, 'photo', 'start');
    setShowCameraWorkflow(true);
  };

  const handleCameraWorkflowComplete = mediaAsset => {
    // Emit media composing stop
    emitMediaComposing(chatId, mediaAsset.type, 'stop');
    setShowCameraWorkflow(false);
    handleSendMediaMessage(mediaAsset);
  };

  const handleCameraWorkflowCancel = () => {
    // Emit media composing stop
    emitMediaComposing(chatId, 'photo', 'stop');
    setShowCameraWorkflow(false);
  };

  const handleImageGalleryPress = () => {
    console.log('Image gallery pressed');
    // TODO: Implement image gallery functionality
    // This will be implemented in future tasks
  };

  const handleVideoGalleryPress = () => {
    console.log('Video gallery pressed');
    // TODO: Implement video gallery functionality
    // This will be implemented in future tasks
  };

  const handleAudioPress = () => {
    console.log('Audio pressed');
    // TODO: Implement audio functionality
    // This will be implemented in future tasks
  };

  const handleDocumentPress = () => {
    console.log('Document pressed');
    // TODO: Implement document functionality
    // This will be implemented in future tasks
  };

  // 💬 Message bubble
  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUser?._id;

    return (
      <MessageBubble
        message={{
          text: item.text,
          timestamp: item.timestamp,
          deliveryStatus: item.deliveryStatus,
          messageType: item.messageType,
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          width: item.width,
          height: item.height,
          duration: item.duration,
          uploadStatus: item.uploadStatus,
          uploadProgress: item.uploadProgress,
        }}
        isOutgoing={isMe}
        sender={!isMe ? { name: chatName } : null}
        showAvatar={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.chatArea}
            inverted={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation</Text>
              </View>
            }
          />
        )}

        {/* ⌨️ Input Bar */}
        <InputBar
          onSend={handleSend}
          onCameraPress={handleCameraPress}
          onImageGalleryPress={handleImageGalleryPress}
          onVideoGalleryPress={handleVideoGalleryPress}
          onAudioPress={handleAudioPress}
          onDocumentPress={handleDocumentPress}
        />
      </KeyboardAvoidingView>

      {/* Camera Workflow */}
      <CameraWorkflow
        visible={showCameraWorkflow}
        mediaType="mixed"
        onMediaReady={handleCameraWorkflowComplete}
        onCancel={handleCameraWorkflowCancel}
      />
    </SafeAreaView>
  );
};

export default IndividualChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
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
