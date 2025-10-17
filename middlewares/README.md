# 🧱 Middlewares Folder - Custom Authentication Service

This folder serves as the **guardian layer** between the **Router** and **Controller** layers. It ensures that every incoming request is **validated**, **authorized**, and **sanitized** before hitting the core logic. If any rule is violated, the middleware short-circuits the request with a precise error response, preventing security loopholes and unstable behavior.

---

## 📖 **Introduction**

Throughout my custom authentication service, I followed a **middleware-first architecture** inspired by large-scale backend systems. These middlewares control all aspects of:

- 🔐 Session Management  
- 🛡️ Authorization Checks  
- 🔍 Request Body Validation  
- 🧠 Device Identity Verification  
- ⚙️ Admin & Internal API Routing

> 🧰 This approach gave me deeper understanding of how **Express**, **JWT**, and custom token/session lifecycles come together to build secure and reliable APIs.

---

## 🧠 **Applied Design Principles & Patterns**

### ✅ SOLID Principles:
- **Single Responsibility**: Each middleware does one thing—nothing more.
- **Open/Closed**: New checks can be added without rewriting core logic.
- **Liskov Substitution**: Each function can replace another in chain without breaking behavior.
- **Interface Segregation**: Functions are decoupled and minimal.
- **Dependency Inversion**: Common tools (e.g., `throwError`, `logWithTime`) are used via utilities.

### ✅ DRY & KISS
- Shared logic (like error handling, device checks) is abstracted into utility files.
- Code avoids over-engineering by focusing only on required validation.

### ✅ Design Patterns:
- **Singleton Pattern** – All config/constants are centralized and reused.
- **Factory Pattern** – Errors are thrown using factory-style custom handlers.
- **Template Pattern** – All middlewares follow the same try-catch-validate-next format.

---

## 🗂️ Folder Structure (Total Files: 5)

| 📄 File Name                    | 🧩 Purpose                                                                 |
|--------------------------------|---------------------------------------------------------------------------|
| `auth.middleware.js`           | Validates user inputs for auth-related operations (sign up, login, etc.) |
| `commonUsed.middleware.js`     | Core middlewares for token verification, session check, and account state |
| `helper.middleware.js`         | Shared logic utilities to fetch user from DB and sanitize responses       |
| `admin.middleware.js`          | Restricts access to admin-only routes and cookie setup                    |
| `internal-api.middleware.js`   | Secures internal APIs used for system-level services                      |

---

## 📂 File-by-File Breakdown

---

### 📁 1. `auth.middleware.js`

#### 📌 Purpose:
Handles validation of request bodies for:
- `Sign Up`
- `Sign In`
- `Sign Out`
- `Activate / Deactivate Account`
- `Change Password`

#### ✅ Core Features:
- Verifies field lengths using config constants.
- Uses regex for strict pattern checks (`emailRegex`, `numberRegex`, etc).
- Ensures required fields (like password, device ID) are present.
- Differentiates between active vs inactive accounts.
- Ensures passwords are strong (min length, special chars, etc).
- Handles identity conflicts (e.g., user trying to deactivate someone else's account).

#### 🛡️ Security Implication:
Prevents malformed or malicious inputs from reaching database queries or business logic.

---

### 📁 2. `commonUsed.middleware.js`

#### 📌 Purpose:
This is the **backbone middleware** file containing logic for:
- Token validation
- Admin user checks
- Refresh token rotation
- Blocked/Deactivated account restrictions
- Device ID and name validations
- Ownership check for token pairing

#### ✅ Core Functions:
- `verifyToken()`: Checks access token validity or rotates it using refresh token.
- `checkUserIsVerified()`: Ensures user session hasn't expired.
- `isUserBlocked()`: Prevents access for blocked users.
- `isUserAccountActive()`: Prevents actions from deactivated accounts.
- `verifyDeviceField()`: Ensures `x-device-uuid`, `x-device-name`, and `x-device-type` are valid.
- `verifyTokenOwnership()`: Confirms access and refresh token belong to same user.

#### 🧠 Design Notes:
- All token operations use `jsonwebtoken`.
- Device tracking and token timestamps are stored and verified from DB (`user.devices`).
- Middleware heavily logs each event for traceability.

---

### 📁 3. `helper.middleware.js`

#### 📌 Purpose:
Utility middlewares to be reused across routes:
- `fetchUser()`: Finds user based on provided email, phone, or userID.
- `filterSensitiveFields()`: Removes `password`, `refreshToken`, and sensitive fields before sending user object in response.

#### 🧰 Reusability:
This file was created to avoid repeated DB queries and sanitization logic across middlewares and controllers.

#### 🛡️ Security Impact:
Ensures no sensitive fields ever leak to frontend or unauthorized consumers.

---

### 📁 4. `admin.middleware.js`

#### 📌 Purpose:
Strictly protects routes that should only be used by **system admins**. Primarily used for:
- Setting cookies manually via admin panel
- Verifying if user is truly admin before giving route access

#### ✅ Middleware:
- `verifySetAdminCookieBody()`: Validates that a valid access token and refresh token are present and synced. Verifies the refresh token belongs to an admin and both tokens are tied to the same user.

#### 🔒 Security Guarantee:
Only users with `userType === "ADMIN"` can perform cookie manipulation or system overrides.

---

### 📁 5. `internal-api.middleware.js`

#### 📌 Purpose:
Secures internal routes that are not meant for public clients. These APIs are typically:
- Called by cron jobs
- Used for internal monitoring / refresh
- System-to-system communication

#### ✅ Middleware:
- `verifyInternalAPIKey()`: Verifies special headers or tokens required for internal APIs to ensure no public access.

#### 🧠 Implementation Note:
Internal APIs will only work if request contains valid internal keys (like `X-Internal-Secret`). This keeps monitoring systems isolated from public endpoints.

---

## 🔄 Middleware Request Flow

- Client ⬅️➡️ Router ➡️ Middleware ➡️ Controller ➡️ DB/Service ➡️ Response
- ⬆️ if error ⬅️


- If any validation, token, or session check fails, the middleware layer throws a structured error.
- Controllers **never run** if middleware conditions are not met.

---

## 🛡️ Responsibilities of Middleware Layer

✅ Validate all fields (lengths, regex, presence)  
✅ Authenticate using both `accessToken` and `refreshToken`  
✅ Track device-level login session (`lastUsedAt`, `requestCount`)  
✅ Check user account states (`isBlocked`, `isActive`, `jwtTokenIssuedAt`)  
✅ Differentiate **admin** vs **normal** user privileges  
✅ Block suspicious/stale requests before controller logic  
✅ Rotate refresh tokens securely with trace logging  
✅ Handle errors with exact log context (userID, deviceID, action)

---

## 🎯 **Final Takeaway**

Building this middleware layer was a deep dive into how real-world systems:
- Enforce security at every route entry
- Track user activity per device
- Rotate tokens securely
- Separate admin/internal traffic from general users

I now understand why large systems **modularize middleware logic** instead of cluttering controllers. It enforces **consistency**, improves **readability**, and creates a **single source of truth** for validation and access control logic.

These 5 files form the **defensive wall** of the entire Custom Auth Service backend.

---

