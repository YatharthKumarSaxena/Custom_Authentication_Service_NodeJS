// Base path of all APIs (can be changed in one place if needed)
const BASE_PATH = "/custom-auth-service";

// API versioning (helps us move from /v1 to /v2 easily)
const API_VERSION = "/api/v1";

// API Prefix that is Base Path + API Version
const API_PREFIX = `${BASE_PATH}${API_VERSION}`;

/* 
  ⚙️ What is `${}` and `` ?
  - These are part of JavaScript's Template Literals (introduced in ES6).
  - Backticks (``) allow multi-line strings and variable interpolation.
  - `${}` is used to insert variables inside strings dynamically.
*/

// 👇 Defining major base segments once to avoid repetition (DRY Principle)
const AUTH_BASE = `${API_PREFIX}/auth`;                         // /custom-auth-service/api/v1/auth
const ACCOUNT_BASE = `${API_PREFIX}/account`;
const VERIFICATION_BASE = `${API_PREFIX}/verification`;
const PASSWORD_BASE = `${API_PREFIX}/password`;
const INTERNAL_BASE = `${API_PREFIX}/internal`                  // /custom-auth-service/api/v1/internal

// 🔁 Exporting all route constants, grouped by modules (Auth, User, Admin, Category)
module.exports = {
    AUTH_BASE: AUTH_BASE,
    ACCOUNT_BASE: ACCOUNT_BASE,
    VERIFICATION_BASE: VERIFICATION_BASE,
    PASSWORD_BASE: PASSWORD_BASE,
    INTERNAL_BASE: INTERNAL_BASE,

    // 🧾 Routes related to user authentication & account management
    AUTH_ROUTES: {
        SIGNUP: `/signup`,                          // POST /custom-auth-service/api/v1/auth/signup
        SIGNIN: `/signin`,                          // POST /custom-auth-service/api/v1/auth/signin
        SIGNOUT: `/signout`,                        // POST /custom-auth-service/api/v1/auth/signout
        SIGNOUT_FROM_SPECIFIC_DEVICE: `/signout-device`, // POST /custom-auth-service/api/v1/auth/signout-device
        GET_ACTIVE_SESSIONS: `/active-sessions`,   // GET  /custom-auth-service/api/v1/auth/active-sessions
        GET_MY_ACCOUNT_DETAILS: `/me`,                     // GET  /custom-auth-service/api/v1/auth/me
        GET_MY_AUTH_LOGS: `/auth-logs`                      // GET  /custom-auth-service/api/v1/auth/auth-logs
    },
    ACCOUNT_MANAGEMENT_ROUTES: {
        ACTIVATE_ACCOUNT: `/activate`,
        DEACTIVATE_ACCOUNT: `/deactivate`,
        ENABLE_2FA: `/enable-2fa`,
        DISABLE_2FA: `/disable-2fa`,
        UPDATE_ACCOUNT_DETAILS: `/update-details`,
        CHANGE_PASSWORD: `/change-password`
    },
    ACCOUNT_VERIFICATION_ROUTES: {
        RESEND_VERIFICATION: `/resend-verification`,
        VERIFY_DEVICE: `/verify-device`,
        VERIFY_EMAIL: `/verify-email`,
        VERIFY_PHONE: `/verify-phone`
    },
    PASSWORD_MANAGEMENT_ROUTES: {
        FORGOT_PASSWORD: `/forgot-password`,
        RESET_PASSWORD: `/reset-password`
    },
    // 🛠️ Admin-specific routes (e.g. category creation, update, delete)

}
