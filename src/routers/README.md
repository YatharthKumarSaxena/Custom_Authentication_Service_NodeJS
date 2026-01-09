# 🌐 `routers/` — API Gateway & Entry Control System

> **I'm the README.md file of this folder, here to guide you step-by-step!** 🚀

---

## 📖 **Introduction**

Welcome to the **`routers/` folder** — the **entry gatekeeper** of the Custom Authentication Service. Every public or internal request flows through this folder first. Think of it as the **air traffic controller** of your backend — **filtering**, **routing**, and **guarding** access to controllers via **strict middleware orchestration**.

From user sign-up to admin-controlled blocking, each route is:
- Thoroughly validated
- Modularly rate-limited
- Securely authenticated
- And guarded using **device-specific**, **token-based**, and **role-based** access checks

This folder is the **frontline of defense and flow**, maintaining clear separation between **auth**, **admin**, **internal**, and **user profile** domains.

---

## 🧭 Table of Contents

- 🗂️ [Folder Overview](#-folder-overview)
- 📄 [Detailed Route Breakdown](#-detailed-route-breakdown)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 🗂️ **Folder Overview**

> 📦 Total: **5 files**

| 📄 File Name         | 📋 Purpose Summary |
|----------------------|-------------------|
| `index.js`           | 🧩 Binds all route modules using base URIs; exported to server.js |
| `auth.routes.js`     | 🔐 Handles user signup/signin, token-based flows, and account ops |
| `admin.routes.js`    | 👑 Admin-only operations like block/unblock, audit logs, account views |
| `user.routes.js`     | 👤 Authenticated user profile fetch/update |
| `internal.routes.js` | 🧬 Internal service routes like secure cookie setup for admins |

---

## 📄 **Detailed Route Breakdown**

### 🔐 `auth.routes.js`
Handles **public and protected user** routes:
- `POST /signup`, `POST /signin`
- `POST /signout`, `POST /signout-current-device`
- `PATCH /activate`, `PATCH /deactivate`, `PATCH /change-password`
- `GET /check-my-active-devices`

🔒 **Middlewares**:
- Device validation
- Token ownership + validation
- Account status check (blocked / deactivated / verified)
- Rate limiting on sensitive APIs

---

### 👑 `admin.routes.js`
Routes only accessible to **verified admins**:
- `PATCH /block`, `PATCH /unblock` users
- `POST /get-user-logs`
- `GET /get-user-details`, `GET /get-user-sessions`
- `GET /get-total-registered-users`

🔐 **Admin-Only Controls**:
- Validates admin credentials
- Checks admin's own session and verification
- Rate-limited to avoid abuse
- Uses internal controller functions where needed

---

### 👤 `user.routes.js`
- `GET /my-profile`: View own account details
- `PATCH /update-profile`: Update basic profile fields

⚙️ **Safety Measures**:
- Blocks updates to immutable fields
- Verifies account and token ownership
- Rate limits misuse attempts

---

### 🧬 `internal.routes.js`
Single protected route:
- `POST /set-admin-cookie`: Manages secure refresh cookie setting via admin API

⚠️ Only used in internal workflows (like admin panel-based login) and protected with:
- Admin check
- Verified session
- Input body validation

---

### 🧩 `index.js`
Maps each route file to its base path:
```js
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/internal", internalRoutes);

---

## 🧠 **Design Principles & Patterns**

| ✅ Principle / Pattern          | 💡 Where Applied                                                                 |
|--------------------------------|----------------------------------------------------------------------------------|
| **SRP (Single Responsibility)** | Each route file handles a single user group (auth, admin, user, internal)       |
| **Modularity**                 | Clean separation of routes, middlewares, and controllers                         |
| **DRY**                        | Shared middlewares reused across all route groups                                |
| **Least Privilege Access**     | Admin-specific logic deeply isolated from public user endpoints                  |
| **Fail Fast**                  | All request checks are validated before controller logic is invoked              |
| **KISS**                       | Controllers are lightweight — pre-validation handled in router layer             |
| **Scalability Ready**          | Easily extendable for more user types (e.g., `superadmin.routes.js`)             |

---

## 🎯 **Final Takeaway**

The `routers/` folder is the **first line of execution** in the backend architecture — ensuring every request is **filtered**, **validated**, and **securely routed**.

It embodies your design philosophy:

> **“Trust no one by default — validate, verify, and then allow.”**

By isolating route groups, enforcing robust middleware pipelines, and minimizing controller burden, you’ve built a **battle-tested gateway** that is ready to scale under real-world production load.

> Engineered with clarity by **Yatharth Kumar Saxena**  
> Let this folder be the **guardian of clean code** and **secure flow**. 🔐
