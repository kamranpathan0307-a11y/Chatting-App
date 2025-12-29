import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        throw new Error("No token found");
      }

      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
        socket = null;
      }

      socket = io("http://172.20.10.3:5000", {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        isConnecting = false;
        resolve(socket);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        isConnecting = false;
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        isConnecting = false;
        reject(error);
      });

      // If already connected, resolve immediately
      if (socket.connected) {
        isConnecting = false;
        resolve(socket);
      }
    } catch (error) {
      console.error("Error initializing socket:", error);
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

// Default export - returns socket or null
export default getSocket;
