# 🚦 `rate-limiters/` — API Throttling & Abuse Protection Layer

> **I'm the README.md file of this folder, built to document the heartbeat of your request security mechanism.** 🛡️

---

## 📖 **Introduction**

In a production-grade authentication service, **security doesn’t stop at validation** — it extends to **how frequently** requests are made.

The `rate-limiters/` folder is your **first line of resilience** against brute-force attacks, spamming, and overload attempts. By throttling both **per-device** and **per-user-device** request frequencies, this layer ensures your backend stays protected, even during DDoS-level stress.

This system is fully **middleware-compatible**, **modular**, and built using the **Factory Design Pattern** — creating customizable rate limiters for every API class (sign-in, sign-out, activate, block, etc.)

---

## 🧭 Table of Contents

- 🗂️ [Folder Structure](#-folder-structure)
- ⚙️ [Core Design & Factory Pattern](#-core-design--factory-pattern)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 🗂️ **Folder Structure**

> 📦 Total: **3 files**

| 📄 File Name | 📋 Purpose Summary |
|-------------|--------------------|
| `create-rate-limiter-factory.js` | 🏭 Factory function to dynamically create custom rate limiters based on request context |
| `special-api-rate-limiter.js`    | 🧬 Device-only rate limiter set — handles unauthenticated or pre-token flows |
| `general-api.rate-limiter.js`    | 🧑‍💻 User + Device-based rate limiter set — for token-authenticated & sensitive APIs |

---

## ⚙️ **Core Design & Factory Pattern**

This layer uses a **Factory Design Pattern**, which allows you to:
- Dynamically create a middleware limiter for each endpoint.
- Inject configuration directly from `rate-limit.config.js`.
- Reuse the same factory logic with different constraints (DRY Principle ✅).

### 🏭 `createRateLimiter()`
Used when both **`userID` and `deviceID`** are available — ideal for:
- Authenticated requests (e.g., deactivate account, block/unblock, change password)

🔐 Internally checks:
- If rate limit exceeded for a (userID + deviceID) pair.
- Adds `Retry-After`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

---

### 🧬 `createDeviceBasedRateLimiter()`
Used in early-stage or public APIs where **userID isn’t confirmed yet** — such as:
- Sign-up
- Sign-in
- Activate Account
- Malformed Requests

Checks frequency **per deviceID** only. Ideal for unauthenticated paths.

---

## 🧠 **Design Principles & Patterns**

| ✅ Principle / Pattern          | 💡 Where Applied                                                                 |
|--------------------------------|----------------------------------------------------------------------------------|
| **SRP (Single Responsibility)** | Each rate limiter file serves either device-only or user-device-based routes.   |
| **Factory Design Pattern**      | Dynamically creates rate-limiting middleware based on config                     |
| **DRY (Don't Repeat Yourself)** | Core limiter logic abstracted into reusable factories                           |
| **Fail Fast**                   | Early exit if rate exceeded — avoids controller calls                           |
| **KISS (Keep It Simple, Stupid)**| Limiter middleware is lightweight, focused only on rate validation             |
| **YAGNI**                       | Only generates limiter when explicitly requested; avoids over-engineering        |
| **Scalable Configs**            | Centralized via `rate-limit.config.js`, ready for future tuning per endpoint    |

---

## 🎯 **Final Takeaway**

The `rate-limiters/` folder ensures that **frequency abuse never compromises logic, security, or performance**.

Every route is equipped with a precision limiter that respects both the **user context** and **device fingerprint** — giving your system **granular control and resilience** against excessive load or malicious behavior.

> Engineered with foresight by **Yatharth Kumar Saxena**  
> Let this folder act as the **shield against overload** and **the gatekeeper of system stability**. 🚦

