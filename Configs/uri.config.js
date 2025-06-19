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
        SIGNOUT_FROM_SPECIFIC_DEVICE: `${AUTH_BASE}/signout/device`, // POST /ecomm/api/v1/auth/signout/device
        DEACTIVATE_USER: `${AUTH_BASE}/deactivate`,             // PATCH /ecomm/api/v1/auth/deactivate
        ACTIVATE_USER: `${AUTH_BASE}/activate`,                 // PATCH /ecomm/api/v1/auth/activate
        CHANGE_PASSWORD: `${AUTH_BASE}/password`                // PATCH /ecomm/api/v1/auth/password
    },

    // 🛠️ Admin-specific routes (e.g. category creation, update, delete)
    ADMIN_ROUTES: {
        USERS: {
            BLOCK_USER: `${ADMIN_BASE}/blockUser`,              // PATCH /ecomm/api/v1/admin/blockUser
            UNBLOCK_USER: `${ADMIN_BASE}/unblockUser`,          // PATCH /ecomm/api/v1/admin/unblockUser
        },
    }
}
