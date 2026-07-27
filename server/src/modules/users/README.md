# User Module Architecture & Verification Record

> **Module**: `users`
> **Primary Models**: `User` (`users.model.js`)
> **Bridge File**: `server/src/models/User.js`

---

## 1. Architecture Overview
- **`users.model.js`**: Exact verbatim copy of schema definition.
- **`users.repository.mongo.js`**: `MongoUserRepository` handles pure data access for credentials, profiles, subdomains, roles, bans, and cascade pulls.
- **`users.service.js`**: `UserService` handles password verification, token generation, OAuth account linking, ban-triggered socket disconnections (`disconnectUserSockets`), avatar unlinks, and full 18-step cascade execution.
- **`users.controller.js`**: `UserController` handles 28 HTTP endpoints across Auth (`/api/auth`), Users (`/api/users`), and Admin (`/api/admin/users`).
- **`users.module.js`**: Kernel registry entry points.

---

## 2. Inventory & Boundary Rules
- **Pure Repository Boundary**: `MongoUserRepository` contains zero business rules and zero socket dependencies.
- **Administrative Scripts Exemption**: Administrative scripts (`send-weekly-digest.js`, `promote_admin.js`, `backfill_follows.js`, `reset_export_limit.js`, `seed.js`) use the permanent bridge (`models/User.js`).
- **Real-Time Consumers**: `passport.js` OAuth strategy callbacks, Socket.IO auth handshake, and `notify.js` publish dispatcher call `userRepository` / `userService`.
- **18-Step Cascade**: Account deletion cascade in `UserService` coordinates all 18 steps, using domain repositories for external models.
