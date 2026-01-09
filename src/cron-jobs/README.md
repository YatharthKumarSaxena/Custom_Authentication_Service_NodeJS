# ⏰ `cron-jobs/` — Background Automation & Scheduled Cleanups

> **I’m the `README.md` of this folder — documenting the silent janitor bots that keep your system lean and performant.** 🧹🧠

---

## 📖 **Introduction**

Welcome to the `cron-jobs/` folder — the **automated task hub** of your authentication service.  
These scripts run quietly in the background, performing periodic **cleanup operations** that protect system hygiene and resource efficiency.

By using `node-cron`, each job is **timed, scoped, and modular** — with dynamic control via `cron.config.js`.

This ensures:
- 🧼 **Old auth logs** don’t bloat your database.
- 🪦 **Inactive users** are retired gracefully.
- 🧠 Every deletion is **logged and auditable**.

---

## 🧭 Table of Contents

- 🗂️ [Folder Structure](#-folder-structure)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 🗂️ **Folder Structure**

> 📦 Total: **3 files**

| 📄 File Name                     | 🧾 Description |
|----------------------------------|----------------|
| `index.js`                       | 🔁 Boots all cron jobs — imported in `server.js` to activate schedules |
| `cleanup-auth-logs.job.js`      | 🗑️ Deletes old authentication logs older than `N` days (from `auth.logs`) |
| `delete-deactivated-users.job.js` | ⚰️ Removes `isActive: false` users who’ve been deactivated beyond retention threshold |

---

## 🧠 **Design Principles & Patterns**

| ✅ Principle / Pattern            | 💡 Where Applied |
|----------------------------------|------------------|
| **Factory Control via Config**   | Jobs can be turned on/off via `cron.config.js` flags |
| **Fail Fast**                    | Invalid configs (e.g., 0 days retention) halt execution early |
| **SRP (Single Responsibility)**  | Each job manages only one cleanup operation |
| **DRY**                          | Common utilities like `logAuthEvent` and `logWithTime` reused in both jobs |
| **Auditable Design**            | Every deletion creates an `auth.logs` entry (SYSTEM tag) |
| **TimeZone Safe**               | All jobs use `cron.schedule(..., { timezone })` for global compatibility |
| **Resilient Error Handling**     | Wrapped in `try-catch` with structured error logs using `errorMessage()` |

---

## 🎯 **Final Takeaway**

The `cron-jobs/` folder represents **backend maturity** — enabling automatic, secure, and monitored background jobs without relying on manual triggers.

Whether it’s:
- ✂️ Shrinking deadweight logs,
- 🪦 Retiring stale accounts,
- 📖 Logging system-level events for audit,

…you’ve built a self-healing backend powered by **scheduled intelligence**.

> Engineered with foresight by **Yatharth Kumar Saxena**  
> Let this folder be your backend’s **janitor & guardian** — working silently but effectively. ⏳🧹
