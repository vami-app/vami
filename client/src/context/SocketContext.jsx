"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { apiFetch } from "@/lib/api";

const SocketContext = createContext({
  socket: null,
  unreadCount: 0,
  notifications: [],
  refreshNotifications: async () => {},
  markAsRead: async (id) => {},
  markAllAsRead: async () => {},
});

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiFetch("/notifications?limit=10");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("[SocketContext] fetch notifications failed:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const socketInstance = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("[SocketContext] Connected to real-time notification stream");
    });

    socketInstance.on("notification", (newNotif) => {
      console.log("[SocketContext] Live notification received:", newNotif);
      setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount((count) => count + 1);
    });

    socketInstance.on("disconnect", () => {
      console.log("[SocketContext] Real-time socket disconnected");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("[SocketContext] markAsRead failed:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[SocketContext] markAllAsRead failed:", err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        notifications,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
