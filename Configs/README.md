# 🛠️ `configs/` — Environment-Aware Configurations for Secure & Dynamic System Behavior

> **I’m the `README.md` for the brain of your backend.** Every config here adapts the system to run across environments, manage limits, enforce rules, and follow best practices without touching core code.

---

## 📖 **Introduction**

This folder acts as the **central nervous system** of the custom authentication service — from cookies to cron jobs, rate limits to regex. All reusable configuration values and control switches live here.

By externalizing logic into modular config files, this service becomes:

* 🔁 **Flexible across environments** (local, staging, production)
* 🔐 **More secure** (less hardcoding)
* 🧠 **Easier to maintain and scale** (centralized updates)

---

## 🗂️ **Folder Structure**

> 📦 Total: **16 files**

| 🧩 Config File                   | 📄 Purpose                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `auth-log-events.config.js`      | 🔐 Enum list of all allowed auth events (e.g., LOGIN, LOGOUT, etc.)          |
| `cookies.config.js`              | 🍪 Config for cookie security settings (httpOnly, secure, domain, sameSite)  |
| `cron.config.js`                 | ⏰ Schedules for cron jobs like user & log cleanup                            |
| `db.config.js`                   | 🛢️ DB name and connection URL — injected from `.env`                        |
| `error-handler.config.js`        | 🚨 Reusable functions for error messaging (internal, invalid, blocked, etc.) |
| `field-length.config.js`         | ✍️ Minimum and maximum allowed lengths for form fields                       |
| `http-status.config.js`          | 🌐 HTTP status codes used across the app                                     |
| `id-prefixes.config.js`          | 🪪 Prefixes for Customer (CUS) and Admin (ADM) IDs                           |
| `ip-address.config.js`           | 🌍 Stores a unique code per machine (used in userID generation)              |
| `rate-limit.config.js`           | 🧃 Per-device and per-user-device rate-limiting policies                     |
| `regex.config.js`                | 🔎 Regex patterns for phone, email, name, UUID, and passwords                |
| `server-error-handler.config.js` | 🔥 Global error catchers and malformed JSON handler middleware               |
| `server.config.js`               | 🎛️ Exports PORT number from env (used in `server.listen`)                   |
| `uri.config.js`                  | 📌 All API base paths and route strings — centralized for DRY routing        |
| `user-enums.config.js`           | 🧬 Immutable fields, device types, user types, block/unblock enums           |
| `user-id.config.js`              | 🧠 Advanced admin setup, access tokens, action enums, and limits             |

---

## 🧠 **Design Principles & Patterns**

| 🧱 Principle / Pattern               | ✅ Where Applied                                                         |
| ------------------------------------ | ----------------------------------------------------------------------- |
| **DRY** (Don’t Repeat Yourself)      | Error messages, URI constants, rate limits                              |
| **YAGNI** (You Aren’t Gonna Need It) | Only essential enums and fields kept                                    |
| **KISS** (Keep It Simple, Stupid)    | Logical grouping of each config by domain                               |
| **SOLID**                            | SRP in each config file: one job, done well                             |
| **Environment-Driven Configs**       | `.env` used extensively for all sensitive/tunable values                |
| **Enum-Based Design**                | Block/unblock reasons, actions, user types — to avoid hardcoded strings |

---

## 🎯 **Final Takeaway**

The `configs/` folder is your project’s **foundation of maintainability** and **operational intelligence**.

> Instead of scattering logic across code, you’ve centralized control, making your system:
>
> * Highly **adaptable**
> * Easy to **scale or patch**
> * Much **safer to operate**

🎓 *That’s how professionals build for the real world, Sir.*

— Engineered precisely by **Yatharth Kumar Saxena** 🧠
