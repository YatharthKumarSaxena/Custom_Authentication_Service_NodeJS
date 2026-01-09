# 🧰 `utils/` — The Brain Behind the Auth System

> **I'm the README.md file of this folder, here to guide you step-by-step!** 🚀

---

## 📖 **Introduction**

Welcome to the **`utils/` folder**, the **silent yet powerful backbone** of the entire Custom Authentication Service. Think of it as the **gatekeeper** of logic — enforcing validations, setting secure cookies, creating and refreshing JWTs, managing devices, logging authentication events, and ensuring consistency across headers — all with precision and modular discipline.

This folder is engineered not just for functionality, but for **reusability**, **clarity**, and **security hardening**. Every function here is a reliable tool — designed using **SOLID principles**, respecting **KISS**, **DRY**, and enhanced using **Factory** and **Template Method** patterns where appropriate.

---

## 🧭 Table of Contents

- 🗂️ [Folder Overview](#-folder-overview)
- 📄 [Detailed File-Wise Breakdown](#-detailed-file-wise-breakdown)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 🗂️ **Folder Overview**

> 📦 Total: **10 utility files** + this README.md

| 📄 File Name                    | 📋 Purpose Summary |
|-------------------------------|---------------------|
| `auth-log-utils.js`           | 🔐 Logs authentication events for both customers & admins |
| `auth.utils.js`               | 🧠 Core validators, password checks, user existence detection |
| `cookie-manager.utils.js`     | 🍪 Securely sets & clears HTTP-only refresh token cookies |
| `device.utils.js`             | 📱 Checks device limits per user/device + constructs new devices |
| `extract-token.utils.js`      | 🛡️ Extracts JWTs from headers and cookies |
| `field-validators.utils.js`   | 🧹 Validates string length and RegEx matches |
| `fresh-session.utils.js`      | ♻️ Decides when to rotate refresh tokens based on thresholds |
| `issue-token.utils.js`        | 🏭 Factory for JWT generation and logging of issuance |
| `time-stamps.utils.js`        | ⏱️ Custom timestamp generator and prefixed logger |
| `token-headers.utils.js`      | 🎫 Standardizes access token headers for response objects |

---

## 📄 **Detailed File-Wise Breakdown**

### 🔐 `auth-log-utils.js`
- Logs all key auth activities: LOGIN, REGISTER, BLOCK, UNBLOCK, TOKEN ISSUE, etc.
- Accepts optional `adminActions` like `reason`, `targetUserID`, `filter`
- Follows Template Method structure to reuse log format for admin setup as well

---

### 🧠 `auth.utils.js`
- Ensures only one identifier (userID/email/phone) is used at a time
- Detects if user already exists in DB
- Validates password using bcrypt
- Constructs full phone numbers with regex and length safety
- Identifies admin IDs via prefix logic

---

### 🍪 `cookie-manager.utils.js`
- `setRefreshTokenCookie()`: Sets refresh token securely
- `clearRefreshTokenCookie()`: Clears it during sign-out or session reset
- Logs success/failure for both operations using `logWithTime`

---

### 📱 `device.utils.js`
- `checkUserDeviceLimit()`: Validates max device limit per user (Admin vs Customer)
- `checkDeviceThreshold()`: Ensures a device isn't linked to too many users
- `createDeviceField()`: Constructs device meta for registration/login

---

### 🛡️ `extract-token.utils.js`
- `extractAccessToken()`: Parses Bearer token from headers
- `extractRefreshToken()`: Pulls refresh token from cookies
- Shields against malformed tokens or missing headers

---

### 🧹 `field-validators.utils.js`
- Two focused tools:
  - `validateLength(str, min, max)`
  - `isValidRegex(str, regex)`
- Core utility behind field validation logic in signup/update flows

---

### ♻️ `fresh-session.utils.js`
- Checks if the refresh token should be rotated (based on age threshold)
- Issues a new one if required and updates the DB
- Ensures optimal session freshness without unnecessary regeneration

---

### 🏭 `issue-token.utils.js`
- Implements **Factory Pattern** for creating `access` or `refresh` JWTs
- Issues token using `jwt.sign()` with proper secret & expiry
- Logs event using either `logAuthEvent` or `adminAuthLogForSetUp`

---

### ⏱️ `time-stamps.utils.js`
- `getTimeStamp()`: Returns current ISO string wrapped in `[]` for consistency
- `logWithTime(...)`: Prefixes every console log with 📅 timestamp — used across all major operations

---

### 🎫 `token-headers.utils.js`
- `setAccessTokenHeaders(res, token)`: 
  - Sets `x-access-token` and a flag `x-token-refreshed` in headers
  - Also exposes these headers to frontend via `Access-Control-Expose-Headers`
- Gracefully exits if headers already sent

---

## 🧠 **Design Principles & Patterns**

| ✅ Principle / Pattern        | 💡 Where It Was Applied                     |
|------------------------------|---------------------------------------------|
| **SRP** (Single Responsibility Principle) | All utility files are dedicated to a single concern |
| **Factory Pattern**          | `issue-token.utils.js`                      |
| **Template Method Pattern**  | `auth-log-utils.js`                         |
| **DRY**                      | Reused logic for cookie, token, timestamp, etc. |
| **KISS** (Keep It Simple)    | Straightforward interfaces like `extractAccessToken()` |
| **YAGNI** (You Aren’t Gonna Need It) | Avoids bloat; only core utilities included |

---

## 🎯 **Final Takeaway**

The `utils/` folder is the **nervous system** of this authentication platform. It quietly powers **validation**, **token creation**, **cookie management**, **logging**, and **security** — without ever being directly exposed to the end-user.

> **If this folder is strong, the whole system stands tall.**  
> Built & documented by **Yatharth Kumar Saxena** 🧠  
> Maintain it with love, and let logic thrive behind the scenes.
