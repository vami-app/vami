"use strict";

const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const env = require("./env");
const User = require("../models/User");

/** @type {Server|null} */
let io = null;

// Map<userIdString, Set<socketIdString>>
const userSocketMap = new Map();

/**
 * Initialize Socket.IO attached to an HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.startsWith("http://localhost:")) return callback(null, true);
        if (origin === env.clientUrl) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
    },
  });

  const parseCookies = cookieParser();

  // Socket.IO engine middleware using httpOnly cookies on handshake
  io.engine.use((req, res, next) => {
    // Handshake requests do not have query sid yet
    const isHandshake = req._query && req._query.sid === undefined;
    if (!isHandshake) {
      return next();
    }

    parseCookies(req, res, async () => {
      try {
        const token = req.cookies && req.cookies.accessToken;
        if (!token) {
          return next(new Error("Authentication token missing"));
        }

        const decoded = jwt.verify(token, env.jwtAccessSecret);
        if (!decoded || !decoded.sub) {
          return next(new Error("Invalid token payload"));
        }

        const user = await User.findById(decoded.sub);
        if (!user || user.status !== "active") {
          return next(new Error("User unauthorized or banned"));
        }

        req.user = user;
        return next();
      } catch (err) {
        return next(new Error("Authentication failed"));
      }
    });
  });

  io.on("connection", (socket) => {
    const req = socket.request;
    const user = req.user;

    if (!user) {
      socket.disconnect(true);
      return;
    }

    const userIdStr = String(user._id);

    // Track socket ID in user map
    if (!userSocketMap.has(userIdStr)) {
      userSocketMap.set(userIdStr, new Set());
    }
    userSocketMap.get(userIdStr).add(socket.id);

    // Join personal notification room
    socket.join(`user:${userIdStr}`);

    socket.on("disconnect", () => {
      const userSockets = userSocketMap.get(userIdStr);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketMap.delete(userIdStr);
        }
      }
    });
  });

  return io;
}

/**
 * Push a notification event to a recipient if online.
 * @param {string|import('mongoose').Types.ObjectId} recipientId
 * @param {Object} notification
 */
function emitNotificationToUser(recipientId, notification) {
  if (!io) return;
  const recipientIdStr = String(recipientId);
  io.to(`user:${recipientIdStr}`).emit("notification", notification);
}

/**
 * Forcefully disconnect all active socket connections for a user (e.g. when banned).
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
function disconnectUserSockets(userId) {
  const userIdStr = String(userId);
  const socketIds = userSocketMap.get(userIdStr);

  if (socketIds && io) {
    for (const socketId of socketIds) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    }
    userSocketMap.delete(userIdStr);
  }
}

/**
 * Get current IO instance.
 * @returns {Server|null}
 */
function getIO() {
  return io;
}

module.exports = {
  initSocket,
  emitNotificationToUser,
  disconnectUserSockets,
  getIO,
};
