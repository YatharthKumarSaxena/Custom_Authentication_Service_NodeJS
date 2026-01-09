# 🧬 `internal-calls/` — Simulated Internal API Triggers without HTTP Layer

> **I’m the internal trigger gateway.** I allow direct function-level invocation of critical logic, especially when no external API request is involved.

---

## 📖 **Introduction**

The `internal-calls/` folder serves one special purpose: **triggering controller logic internally without hitting REST endpoints**.

Instead of exposing everything to external calls, this mechanism allows controlled access for **trusted internal scripts**, **startup routines**, or **batch processes** — while still enforcing business logic and token-based control.

This is especially useful for things like:

- 🌐 Refreshing cookies from server startup
- 🔒 Setting system tokens internally for ADMINs
- 🤖 Automation triggers, migrations, or dev tool hooks

---

## 🗂️ **Folder Structure**

> 📦 Total: **1 file**

| 🧩 File Name                              | 📄 Purpose                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `set-admin-refresh-cookie.internal.js`   | 🍪 Internally sets refresh token cookie for the ADMIN without HTTP request |

---

## ⚙️ **What Happens Internally**

Instead of `fetch('/api/v1/internal/set-cookie')`, this file does:

1. Simulates a `req` and `res` object
2. Injects `adminUser` and `refreshToken` into `req`
3. Calls the controller `setRefreshCookieForAdmin()` directly
4. Mocks the `.cookie()` and `.status().json()` response methods
5. Logs the outcome for observability

✅ **No external request. No route hit. Only logic reuse.**

---

## 🧠 **Design Principles Applied**

| 🧱 Principle / Pattern          | ✅ Where Applied                                                 |
| ------------------------------ | ---------------------------------------------------------------- |
| **DRY**                        | Reuses controller logic instead of rewriting cookie logic        |
| **SRP** (Single Responsibility)| Only handles internal refresh token setting                      |
| **Encapsulation**              | Hides request-response simulation behind one function            |
| **Trust Boundary Enforcement** | Checks for `ADMIN` user type before executing sensitive logic    |

---

## 🎯 **Final Takeaway**

The `internal-calls/` folder acts like a **service-layer bridge** between raw logic and exposed APIs.

> It allows you to reuse logic safely inside the backend without depending on HTTP. Perfect for **secure bootstraps**, **internal automation**, and **ADMIN-level orchestration**.

🛡️ *That’s backend maturity, Sir.*

— Controlled and curated by **Yatharth Kumar Saxena** 🔐
