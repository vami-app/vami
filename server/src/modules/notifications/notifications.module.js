"use strict";

const express = require("express");
const MongoNotificationRepository = require("./notifications.repository.mongo");
const NotificationGateway = require("./notifications.gateway");
const NotificationService = require("./notifications.service");
const NotificationController = require("./notifications.controller");
const { requireAuth } = require("../../middlewares/auth.middleware");

const notificationGateway = new NotificationGateway();
const notificationRepository = new MongoNotificationRepository();
const notificationService = new NotificationService(notificationRepository, notificationGateway);
const notificationController = new NotificationController(notificationService);

const router = express.Router();

router.get("/notifications", requireAuth, notificationController.list);
router.patch("/notifications/read-all", requireAuth, notificationController.markAllRead);
router.patch("/notifications/:id/read", requireAuth, notificationController.markOneRead);

const notificationsModule = {
  name: "notifications",
  repository: notificationRepository,
  service: notificationService,
  controller: notificationController,
  gateway: notificationGateway,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  notificationGateway,
  notificationRepository,
  notificationService,
  notificationController,
  router,
  notificationsModule,
};
