# 🧬 `models/` — Schema Definitions & Data Contracts

> **I'm the `README.md` file of this folder — here to document the structural DNA of your backend.** 🧠

---

## 📖 **Introduction**

Welcome to the **models layer** — the **data blueprint** of your Custom Authentication Service.

This folder contains all **MongoDB schema definitions** used across the system. These schemas represent your business contracts — how users are stored, how authentication logs are tracked, and how rate limiting is enforced.

Every field in these models is **carefully validated**, **tightly structured**, and **deeply integrated** with enums, regex patterns, length constraints, and logical flags to ensure:

- 🔐 **Security**
- 🔎 **Traceability**
- 🧩 **Extendability**
- ⚙️ **Functional Integrity**

---

## 🧭 Table of Contents

- 🗂️ [Folder Structure](#-folder-structure)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 🗂️ **Folder Structure**

> 📦 Total: **5 Mongoose model files**

| 📄 File Name              | 🔍 Description |
|---------------------------|----------------|
| `user.model.js`           | 👤 Defines the core user document structure: identity, security flags, status toggles, device tracking, OTP logic |
| `auth-logs.model.js`      | 📜 Stores auth events: login, logout, block, unblock — with rich metadata like who performed the action and on what device |
| `device-rate-limit.model.js` | 🚦 Tracks unauthenticated rate limits using deviceID (sign-up, OTP, etc.) |
| `rate-limit.model.js`     | 📊 Stores fine-grained rate limiting info per (deviceID + routeKey) — enables route-level analytics |
| `id-generator.model.js`   | 🆔 Generic counter model for generating unique sequential IDs (used in registration, payments, orders, etc.) |

---

## 🧠 **Design Principles & Patterns**

| ✅ Principle / Pattern          | 💡 Where Applied                                                                 |
|--------------------------------|----------------------------------------------------------------------------------|
| **SRP (Single Responsibility)** | Each schema targets one entity (User, Auth Log, Rate Limit, etc.)                |
| **DRY**                        | Common regex, enums, and length configs abstracted in centralized config files   |
| **Validation at Schema Layer** | All inputs validated through regex, enums, and custom validators                 |
| **Fail Fast**                  | Errors raised immediately if device duplication or invalid input is detected     |
| **Open-Closed Principle (OCP)**| Schema allows safe addition of fields (e.g., `adminActions`, `devices.info`)     |
| **Extensibility**              | OTP, device tracking, and logs can evolve without breaking legacy data           |
| **Data Integrity First**       | Indexed fields (like `userID`, `fullPhoneNumber`, `deviceID`) avoid duplication  |

---

## 🎯 **Final Takeaway**

The `models/` folder acts as the **data backbone** of your service — defining the truth about every user, device, event, and rate-limiting decision.

By designing **modular**, **strongly-typed**, and **responsibly validated** schemas, you've laid the groundwork for a service that is:

- Easy to extend
- Hard to corrupt
- Ready for analytics and audit
- Production-grade from day one

> Engineered with structure by **Yatharth Kumar Saxena**  
> Let this folder be the **ledger of truth** and the **guardian of data integrity** 🧬
