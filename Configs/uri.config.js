// Base path of all APIs (can be changed in one place if needed)
const BASE_PATH = "/ecomm";  

// API versioning (helps us move from /v1 to /v2 easily)
const API_VERSION = "/api/v1"; 

// API Prefix that is Base Path + API Version
const API_PREFIX = `${BASE_PATH}${API_VERSION}`

/* 
  ⚙️ What is `${}` and `` ?
  - These are part of JavaScript's Template Literals (introduced in ES6).
  - Backticks (``) allow multi-line strings and variable interpolation.
  - `${}` is used to insert variables inside strings dynamically.
*/

// 👇 Defining major base segments once to avoid repetition (DRY Principle)
const AUTH_BASE = `${API_PREFIX}/auth`;                         // /ecomm/api/v1/auth
const ADMIN_BASE = `${API_PREFIX}/admin`;                       // /ecomm/api/v1/admin

// 🔁 Exporting all route constants, grouped by modules (Auth, User, Admin, Category)
module.exports = {
    // 🧾 Routes related to user authentication & account management
    AUTH_ROUTES: {
        SIGNUP: `${AUTH_BASE}/signup`,                          // POST /ecomm/api/v1/auth/signup
        SIGNIN: `${AUTH_BASE}/signin`,                          // POST /ecomm/api/v1/auth/signin
        SIGNOUT: `${AUTH_BASE}/signout`,                        // POST /ecomm/api/v1/auth/signout
        SIGNOUT_FROM_SPECIFIC_DEVICE: `${AUTH_BASE}/signout-device`, // POST /ecomm/api/v1/auth/signout-device
        DEACTIVATE_USER: `${AUTH_BASE}/deactivate`,             // PATCH /ecomm/api/v1/auth/deactivate
        ACTIVATE_USER: `${AUTH_BASE}/activate`,                 // PATCH /ecomm/api/v1/auth/activate
        CHANGE_PASSWORD: `${AUTH_BASE}/change-password`,        // PATCH /ecomm/api/v1/auth/change-password
        CHECK_ACTIVE_SESSIONS: `${AUTH_BASE}/active-sessions`   // GET /ecomm/api/v1/auth/active-sessions
    },

    // 🛠️ Admin-specific routes (e.g. category creation, update, delete)
    ADMIN_ROUTES: {
        USERS: {
            BLOCK_USER: `${ADMIN_BASE}/block-user`,              // PATCH /ecomm/api/v1/admin/block-user
            UNBLOCK_USER: `${ADMIN_BASE}/unblock-user`,          // PATCH /ecomm/api/v1/admin/unblock-user
            GET_USER_AUTH_LOGS: `${ADMIN_BASE}/auth-logs`,       // POST / /ecomm/api/v1/admin/auth-logs
            GET_USER_ACTIVE_SESSIONS: `${ADMIN_BASE}/active-sessions`   // GET /ecomm/api/v1/admin/active-sessions
        },
    }
}
