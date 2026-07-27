"use strict";

const express = require("express");
const MongoUserRepository = require("./users.repository.mongo");
const UserService = require("./users.service");
const UserController = require("./users.controller");
const { requireAuth, optionalAuth, requireAdmin } = require("../../middlewares/auth.middleware");
const { authLimiter } = require("../../middlewares/rateLimiter");
const { upload } = require("../../middlewares/upload.middleware");
const { validate } = require("../../middlewares/validate");
const { updateSubdomainRules } = require("../../validators/user.validator");
const passport = require("../../config/passport");

const userRepository = new MongoUserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Auth Router (/api/auth)
const authRouter = express.Router();
authRouter.post("/register", userController.register);
authRouter.post("/login", userController.login);
authRouter.post("/logout", requireAuth, userController.logout);
authRouter.post("/refresh", userController.refresh);
authRouter.get("/me", requireAuth, userController.me);
authRouter.post("/forgot-password", userController.forgotPassword);
authRouter.post("/reset-password", userController.resetPassword);
authRouter.get("/verify-email", userController.verifyEmail);
authRouter.post("/resend-verification", requireAuth, userController.resendVerification);
authRouter.get("/unsubscribe", userController.unsubscribe);

// OAuth routes
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
authRouter.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth_failed" }), userController.oauthCallback);
authRouter.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));
authRouter.get("/github/callback", passport.authenticate("github", { session: false, failureRedirect: "/login?error=oauth_failed" }), userController.oauthCallback);

// Users Router (/api/users)
const userRouter = express.Router();
userRouter.get("/me/bookmarks", requireAuth, userController.getBookmarks);
userRouter.patch("/me", requireAuth, userController.updateMe);
userRouter.post("/me/avatar", requireAuth, upload.single("avatar"), userController.uploadAvatar);
userRouter.post("/me/export/request", requireAuth, userController.requestExport);
userRouter.get("/me/export/download", requireAuth, userController.downloadExport);
userRouter.patch("/me/subdomain", requireAuth, updateSubdomainRules, validate, userController.updateSubdomain);
userRouter.post("/me/delete-request", requireAuth, userController.requestDeleteAccount);
userRouter.delete("/me", requireAuth, userController.deleteAccount);

userRouter.get("/:username", optionalAuth, userController.getProfile);
userRouter.post("/:username/follow", requireAuth, userController.toggleFollow);

// Admin Users Router (/api/admin/users)
const adminUserRouter = express.Router();
adminUserRouter.use(requireAuth, requireAdmin);
adminUserRouter.get("/", userController.listUsers);
adminUserRouter.patch("/:id/role", userController.updateUserRole);
adminUserRouter.patch("/:id/ban", userController.banUser);
adminUserRouter.patch("/:id/unban", userController.unbanUser);

const usersModule = {
  name: "users",
  userRepository,
  userService,
  userController,
  authRouter,
  userRouter,
  adminUserRouter,
  boot: (app) => {
    app.use("/api/auth", authLimiter, authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/admin/users", adminUserRouter);
  },
};

module.exports = {
  userRepository,
  userService,
  userController,
  usersModule,
};
