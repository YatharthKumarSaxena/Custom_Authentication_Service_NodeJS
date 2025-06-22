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
const USER_BASE = `${API_PREFIX}/users`;                        // /ecomm/api/v1/users

// 🔁 Exporting all route constants, grouped by modules (Auth, User, Admin, Category)
module.exports = {
    AUTH_BASE: AUTH_BASE,
    ADMIN_BASE: ADMIN_BASE,
    USER_BASE: USER_BASE,
    // 🧾 Routes related to user authentication & account management
    AUTH_ROUTES: {
        SIGNUP: `/signup`,                          // POST /ecomm/api/v1/auth/signup
        SIGNIN: `/signin`,                          // POST /ecomm/api/v1/auth/signin
        SIGNOUT: `/signout`,                        // POST /ecomm/api/v1/auth/signout
        SIGNOUT_FROM_SPECIFIC_DEVICE: `/signout-device`, // POST /ecomm/api/v1/auth/signout-device
        DEACTIVATE_USER: `/deactivate`,             // PATCH /ecomm/api/v1/auth/deactivate
        ACTIVATE_USER: `/activate`,                 // PATCH /ecomm/api/v1/auth/activate
        CHANGE_PASSWORD: `/change-password`,        // PATCH /ecomm/api/v1/auth/change-password
        CHECK_ACTIVE_SESSIONS: `/active-sessions`   // GET /ecomm/api/v1/auth/active-sessions
    },
    // 👤 Routes accessible by the logged-in user (like updating their profile)
    USER_ROUTES: {
        UPDATE_PROFILE: `/update-profile`,          // PATCH /ecomm/api/v1/users/update-profile
        FETCH_MY_PROFILE: `/fetch`                  // GET   /ecomm/api/v1/users/fetch
    },
    // 🛠️ Admin-specific routes (e.g. category creation, update, delete)
    ADMIN_ROUTES: {
        USERS: {
            BLOCK_USER: `/block-user`,              // PATCH /ecomm/api/v1/admin/block-user
            UNBLOCK_USER: `/unblock-user`,          // PATCH /ecomm/api/v1/admin/unblock-user
            GET_USER_AUTH_LOGS: `/auth-logs`,       // POST / /ecomm/api/v1/admin/auth-logs
            GET_USER_ACTIVE_SESSIONS: `/active-sessions`,   // GET /ecomm/api/v1/admin/active-sessions
            FETCH_USER_DETAILS: `/fetch-user-details`     // GET /ecomm/api/v1/admin/users/fetch-user-details  
        },
    }
}
