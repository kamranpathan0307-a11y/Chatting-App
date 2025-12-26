import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;
let isConnecting = false;
let connectionPromise = null;

// Initialize socket connection with JWT token
export const initializeSocket = async () => {
  // Return existing socket if connected
  if (socket && socket.connected) {
    return socket;
  }

  // If already connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  isConnecting = true;
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('No token found');
      }

      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
        socket = null;
      }

      socket = io('http://172.20.10.3:5000', {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        isConnecting = false;
        resolve(socket);
      });

      socket.on('disconnect', reason => {
        console.log('Socket disconnected:', reason);
        isConnecting = false;
      });

      socket.on('connect_error', error => {
        console.error('Socket connection error:', error);
        console.error('Error message:', error.message);
        console.error('Error type:', error.type);
        console.error('Error description:', error.description);
        isConnecting = false;
        reject(error);
      });

      // If already connected, resolve immediately
      if (socket.connected) {
        isConnecting = false;
        resolve(socket);
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
      isConnecting = false;
      reject(error);
    }
  });

  return connectionPromise;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
    connectionPromise = null;
  }
};

// Get socket instance (returns null if not initialized)
export const getSocket = () => {
  return socket;
};

// Media upload event helpers
export const emitMediaUploadProgress = (
  chatId,
  messageId,
  uploadId,
  progress,
) => {
  if (socket && socket.connected) {
    socket.emit('mediaUploadProgress', {
      chatId,
      messageId,
      uploadId,
      progress,
    });
  }
};

export const emitMediaUploadComplete = (
  chatId,
  messageId,
  uploadId,
  mediaUrl,
) => {
  if (socket && socket.connected) {
    socket.emit('mediaUploadComplete', {
      chatId,
      messageId,
      uploadId,
      mediaUrl,
    });
  }
};

export const emitMediaUploadFailed = (chatId, messageId, uploadId, error) => {
  if (socket && socket.connected) {
    socket.emit('mediaUploadFailed', {
      chatId,
      messageId,
      uploadId,
      error,
    });
  }
};

export const emitMessageStatusUpdate = (chatId, messageId, status) => {
  if (socket && socket.connected) {
    socket.emit('updateMessageStatus', {
      chatId,
      messageId,
      status,
    });
  }
};

export const emitMediaComposing = (chatId, mediaType, action) => {
  if (socket && socket.connected) {
    socket.emit('mediaComposing', {
      chatId,
      mediaType,
      action,
    });
  }
};

// Setup media event listeners
export const setupMediaEventListeners = callbacks => {
  if (!socket) return;

  // Media upload progress
  socket.on(
    'mediaUploadProgress',
    callbacks.onMediaUploadProgress || (() => {}),
  );

  // Media upload complete
  socket.on(
    'mediaUploadComplete',
    callbacks.onMediaUploadComplete || (() => {}),
  );

  // Media upload failed
  socket.on('mediaUploadFailed', callbacks.onMediaUploadFailed || (() => {}));

  // Message status updates
  socket.on(
    'messageStatusUpdate',
    callbacks.onMessageStatusUpdate || (() => {}),
  );

  // Media composing indicators
  socket.on('userMediaComposing', callbacks.onUserMediaComposing || (() => {}));
};

// Remove media event listeners
export const removeMediaEventListeners = () => {
  if (!socket) return;

  socket.off('mediaUploadProgress');
  socket.off('mediaUploadComplete');
  socket.off('mediaUploadFailed');
  socket.off('messageStatusUpdate');
  socket.off('userMediaComposing');
};

// Default export - returns socket or null
export default getSocket;
