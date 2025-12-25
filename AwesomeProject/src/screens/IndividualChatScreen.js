import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocket, initializeSocket } from "../utils/socket";
import API from "../utils/api";
import { colors, spacing, typography } from "../theme";
import MessageBubble from "../components/MessageBubble";

const IndividualChatScreen = ({ route, navigation }) => {
  const { chatId, chatName } = route.params;

  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    // Set header title
    navigation.setOptions({
      title: chatName || "Chat",
    });

    loadUser();
    loadMessages();
    setupSocket();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("receiveMessage");
        socket.emit("leaveChat", chatId);
      }
    };
  }, [chatId, navigation]);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/messages/${chatId}`);
      if (response.data && Array.isArray(response.data)) {
        // Transform messages to match component format
        const transformedMessages = response.data.map((msg) => ({
          id: msg._id,
          text: msg.text || "",
          senderId: msg.senderId?._id || msg.senderId,
          chatId: msg.chatId?._id || msg.chatId,
          messageType: msg.messageType || "text",
          timestamp: msg.createdAt || Date.now(),
          status: "delivered",
        }));
        setChatMessages(transformedMessages);
        
        // Scroll to bottom after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      const errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 404) {
        // Chat doesn't exist yet - this is OK for new chats
        setChatMessages([]);
      } else if (error.response?.status === 403) {
        Alert.alert("Access Denied", "You don't have access to this chat.");
        navigation.goBack();
      } else if (error.response?.status === 401) {
        Alert.alert("Authentication Error", "Please login again.");
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
        console.warn("Socket not connected, will retry when sending message");
        return;
      }

      // Join chat room
      socket.emit("joinChat", chatId);
      console.log("Joined chat room:", chatId);

      // Listen for new messages
      socket.on("receiveMessage", (msg) => {
        // Only add if message belongs to this chat
        const msgChatId = msg.chatId?._id || msg.chatId;
        if (msgChatId === chatId || msgChatId?.toString() === chatId?.toString()) {
          const transformedMsg = {
            id: msg._id || msg.id || Date.now().toString(),
            text: msg.text || "",
            senderId: msg.senderId?._id || msg.senderId,
            chatId: msgChatId,
            messageType: msg.messageType || "text",
            timestamp: msg.createdAt || msg.timestamp || Date.now(),
            status: "delivered",
          };
          
          setChatMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === transformedMsg.id)) {
              return prev;
            }
            return [...prev, transformedMsg];
          });
          
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });
    } catch (error) {
      console.error("Error setting up socket:", error);
    }
  };

  // 📤 Send message
  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;

    const messageText = inputText.trim();
    setInputText("");

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      chatId,
      senderId: currentUser._id,
      text: messageText,
      messageType: "text",
      timestamp: Date.now(),
      status: "sending",
    };

    // Optimistic update
    setChatMessages((prev) => [...prev, newMessage]);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send to backend via API
      const response = await API.post("/messages", {
        chatId,
        text: messageText,
        messageType: "text",
      });

      // Update message with server response
      if (response.data) {
        const serverMessage = {
          id: response.data._id || response.data.id,
          text: response.data.text,
          senderId: response.data.senderId?._id || response.data.senderId,
          chatId: response.data.chatId?._id || response.data.chatId,
          messageType: response.data.messageType || "text",
          timestamp: response.data.createdAt || Date.now(),
          status: "delivered",
        };

        setChatMessages((prev) => {
          // Replace temp message with server message
          const filtered = prev.filter((m) => m.id !== tempId);
          return [...filtered, serverMessage];
        });

        // Emit via socket for real-time delivery
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit("sendMessage", {
            ...serverMessage,
            chatId: chatId,
          });
        } else {
          // Try to initialize and send
          initializeSocket().then((sock) => {
            if (sock && sock.connected) {
              sock.emit("sendMessage", {
                ...serverMessage,
                chatId: chatId,
              });
            }
          }).catch((err) => {
            console.error("Failed to send via socket:", err);
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove failed message
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // 💬 Message bubble
  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUser?._id;

    return (
      <MessageBubble
        message={{
          text: item.text,
          timestamp: item.timestamp,
          status: item.status,
          type: item.messageType,
        }}
        isOutgoing={isMe}
        sender={!isMe ? { name: chatName } : null}
        showAvatar={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: "center",
    alignItems: "center",
  },
  chatArea: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  inputContainer: {
    flexDirection: "row",
    padding: spacing.sm,
    backgroundColor: colors.backgroundLight,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
});
