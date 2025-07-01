# 🎮 `controllers/` — Central Nervous System for Executing Business Logic

> **I’m the command center of your system.** I take in validated requests, perform logic-heavy decisions, and return consistent responses — while orchestrating all middle layers like a pro.

---

## 📖 **Introduction**

The `controllers/` folder is the **brain** behind all user and admin interactions. Each function here is designed to:

- ✅ Authenticate & validate incoming requests  
- 🧠 Apply business rules (e.g., blocking, unblocking, profile updates)  
- 📚 Fetch, modify, and persist data via models  
- 🪝 Trigger logging, cookies, and internal events  

Everything from cookie setup to device monitoring and log access is governed right here.

---

## 🗂️ **Folder Structure**

> 📦 Total: **3 files shared (out of more expected)**

| 🧩 Controller File             | 📄 Purpose                                                                 |
| ----------------------------- | -------------------------------------------------------------------------- |
| `auth.controller.js`          | 🔑 Handles user registration, login, logout with device + token logic      |
| `internal-api.controllers.js` | 🔁 Internal-safe handlers like setting cookies, user stats, and profile update |
| `admin.controllers.js`        | 🛡️ Admin-only capabilities like block/unblock, access logs, and device tracking |

---

## ⚙️ **Controller Responsibilities**

### 🔐 `auth.controller.js`
Handles **end-to-end authentication logic** including:

- 🧠 `signUp`: Registration using full phone number, email ID, password  
  - Applies Template Method Pattern  
  - Uses `makeUserID()` (Factory Pattern)  
  - Encrypts password using `bcryptjs`  
  - Logs event and auto-logs in the user  
- 🔑 `signIn`: Validates login, enforces device & session rules  
  - Rejects duplicate login from same device  
  - Refresh token + Access token issued  
- 🚪 `signOut`: Logs user out from all devices, resets session  
- 🧠 `checkUserIsNotVerified`: Session + refresh token expiration guard  
- 📴 `signOutFromSpecificDevice`: Logs user out from current device only; if it’s the last device, session deactivates  
- 🔁 `changePassword`: Validates current password, encrypts new one, forces logout from all sessions  
- 🧾 `provideUserAccountDetails`: Returns profile snapshot including login/logout and activity history  
- 🟢 `activateUserAccount`: Activates a user account (after correct password confirmation)  
- 🔴 `deactivateUserAccount`: Disables user activity and logs them out completely  
- 🖥️ `getMyActiveDevices`: Lists current active devices with timestamps and types  

### 🧠 `internal-api.controllers.js`
- 🔄 `updateUserProfile`: Validates and updates name, email, phone fields  
- 🍪 `setRefreshCookieForAdmin`: Sets JWT cookie internally without external API  
- 📊 `getTotalRegisteredUsers`: Returns count of customers and admins  

### 👨‍💼 `admin.controllers.js`
- 🚫 `blockUserAccount`: Validates and blocks non-admin users with reasons  
- 🔓 `unblockUserAccount`: Reverses block with authorized reasons  
- 📁 `getUserAuthLogs`: Fetches event-wise auth logs of specific user  
- 🧾 `checkUserAccountStatus`: Returns complete profile and activity metadata  
- 🧭 `getUserActiveDevicesForAdmin`: Returns device-level activity for a target user  

---

## 🧠 **Design Principles & Patterns**

| 🧱 Principle / Pattern             | ✅ Where Applied                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------ |
| **SRP** (Single Responsibility)   | Each controller handles exactly **one category** of behavior                   |
| **DRY** (Don’t Repeat Yourself)  | Validations, error handling, logging reused via shared configs/utilities       |
| **Template Method Pattern**       | `signUp` performs fixed steps: input → ID → password → DB → login              |
| **Factory Design Pattern**        | `makeUserID()` is responsible for encapsulated user ID creation logic          |
| **Singleton Pattern**             | User login session treated as a single instance via MongoDB persistence        |
| **Enum-Based Design**             | All block/unblock reasons use enums to prevent mismatch and ensure consistency |
| **Open/Closed Principle**         | New admin/user actions added without modifying old logic                       |
| **Trust Boundaries**              | Admins can't tamper with each other; user routes respect session+cookie auth   |

---

## 🛡️ **Admin Power Handling**

The `admin.controllers.js` file encapsulates:

- ✅ **Validation** of target user via userID/email/phone  
- 🧾 **Structured access control** using enums like `BLOCK_REASONS`, `UNBLOCK_REASONS`  
- 🔐 **Protected access** to other admin data — denied by design  
- 📈 **Action logging** in every admin operation (`logAuthEvent`)  

This builds accountability, auditability, and role-level segregation of access — the marks of a well-designed system.

---

## 🎯 **Final Takeaway**

Your `controllers/` directory is the **backbone of logic and decision-making** in the system.

> It defines the rules, applies the intelligence, and ensures **consistency**, **security**, and **scalability**.

🧠 * Note: We have created not just functions — but policies with precision.*

— Auth Engine Commanded by **Yatharth Kumar Saxena** 🎮
