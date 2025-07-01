# 🧠 `services/` — Logical Command Center of the Auth System

> **I'm the README.md file of this folder, here to guide you step-by-step!** 🚀

---

## 📖 **Introduction**

Welcome to the **`services/` folder**, the **intelligence layer** of this authentication ecosystem. These files don't just handle requests — they **enforce rules**, **generate identities**, and **control access velocity** with clean, scalable logic.

Think of this folder as the **bridge between raw logic and real-world flow** — whether it’s generating userIDs that never collide, limiting brute-force attempts using rate-limiting thresholds, or signing tokens seamlessly with logging — everything here is **stateless**, **composable**, and **design-pattern-rich**.

All services inside this folder are carefully modularized following **SRP**, and several of them use **Factory**, **Singleton**, and **Open-Closed** principles to future-proof the entire system.

---

## 🧭 Table of Contents

- 🗂️ [Folder Overview](#-folder-overview)
- 📄 [Detailed File-Wise Breakdown](#-detailed-file-wise-breakdown)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 🗂️ **Folder Overview**

> 📦 Total: **3 files**

| 📄 File Name              | 📋 Purpose Summary |
|--------------------------|---------------------|
| `rate-limiter.service.js`| 🛑 Tracks request frequency using `deviceID` + `routeKey` combo |
| `token.service.js`       | 🔐 Generates refresh tokens when login happens via token |
| `userID.service.js`      | 🆔 Factory + Singleton driven logic for safe User ID generation |

---

## 📄 **Detailed File-Wise Breakdown**

### 🛑 `rate-limiter.service.js`

- **Purpose**: Implements per-device-per-route rate limiting (typically 5 requests/minute).
- `getRateLimitMeta()`: Reads existing request count and last request time
- `shouldBlockRequest()`: Applies business logic to decide if request is blocked
- `incrementRateLimitCount()`: Atomically increments request count and timestamps

> 🔄 Used in sensitive APIs like `/not-found` or account actions to avoid abuse.

---

### 🔐 `token.service.js`

- **Purpose**: Handles token-based login logic
- `signInWithToken(req, res)`:  
  - Logs login type (`refresh`, `re-auth`, etc.)  
  - Creates refresh token using `makeTokenWithMongoID()` from `utils/`
  - Automatically logs and returns the token

> 🔒 Keeps `services/` clean by outsourcing JWT creation logic to the utility layer.

---

### 🆔 `userID.service.js`

- **Purpose**: Generates unique userID using:
  - MongoDB counter (`seq`)
  - Machine code (`IP_Address_Code`)
  - User role prefix (`CUS`, etc.)

#### 🏭 Uses 3 Main Sub-Functions:

- `increaseCustomerCounter(res)`  
  - Increments MongoDB counter  
  - Ensures thread-safe userID creation  
  - **Follows SRP & Singleton** (1 document = 1 counter)

- `createCustomerCounter(res)`  
  - Initializes counter if missing (only once per machine)

- `makeUserID(res)`  
  - **Factory** for creating userID → combines counter + prefix + machine code  
  - Respects machine limit (`userRegistrationCapacity`)  
  - Logs every important stage

---

## 🧠 **Design Principles & Patterns**

| ✅ Principle / Pattern         | 💡 Where Applied |
|-------------------------------|------------------|
| **SRP** (Single Responsibility Principle) | All 3 services do 1 focused job |
| **Factory Pattern**           | `makeUserID()` creates unique structured IDs |
| **Singleton Pattern**         | `createCustomerCounter()` ensures 1 MongoDB counter per role |
| **OCP** (Open-Closed Principle) | `makeUserID()` can evolve for admins/devices without rewriting |
| **KISS**                      | Token login and rate-limiter logic is minimal and clean |
| **DRY**                       | DB operations and logging reused via imported utils |

---

## 🎯 **Final Takeaway**

This `services/` folder is where **core backend intelligence resides**. Every time a user signs up, logs in, or sends too many requests — these services **decide what happens next**, and **how it should happen**.

> Whether it's **creating a globally unique userID**, **signing tokens** silently, or **stopping abuse** through rate-limits — this folder is the decision engine.  
> Designed with care by **Yatharth Kumar Saxena** 🧠  
> Let logic scale, securely and smartly — one service at a time.
