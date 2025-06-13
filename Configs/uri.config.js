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
const USER_BASE = `${API_PREFIX}/users`;                        // /ecomm/api/v1/users
const ADMIN_BASE = `${API_PREFIX}/admin`;                       // /ecomm/api/v1/admin
const ADMIN_CATEGORY_BASE = `${ADMIN_BASE}/categories`;         // /ecomm/api/v1/admin/categories
const PUBLIC_CATEGORY_BASE = `${API_PREFIX}/categories`;        // /ecomm/api/v1/categories

// 🔁 Exporting all route constants, grouped by modules (Auth, User, Admin, Category)
module.exports = {
    // 🧾 Routes related to user authentication & account management
    AUTH_ROUTES: {
        SIGNUP: `${AUTH_BASE}/signup`,                          // POST /ecomm/api/v1/auth/signup
        SIGNIN: `${AUTH_BASE}/signin`,                          // POST /ecomm/api/v1/auth/signin
        SIGNOUT: `${AUTH_BASE}/signout`,                        // POST /ecomm/api/v1/auth/signout
        DEACTIVATE_USER: `${AUTH_BASE}/deactivate`,             // PATCH /ecomm/api/v1/auth/deactivate
        ACTIVATE_USER: `${AUTH_BASE}/activate`,                 // PATCH /ecomm/api/v1/auth/activate
    },

    // 👤 Routes accessible by the logged-in user (like updating their profile)
    USER_ROUTES: {
        UPDATE_PROFILE: `${USER_BASE}/updateProfile`,                  // PATCH /ecomm/api/v1/users/updateProfile
        FETCH_MY_PROFILE: `${USER_BASE}/fetch`                  // GET   /ecomm/api/v1/users/fetch
    },

    // 🛠️ Admin-specific routes (e.g. category creation, update, delete)
    ADMIN_ROUTES: {
        USERS: {
            BLOCK_USER: `${ADMIN_BASE}/blockUser`,              // PATCH /ecomm/api/v1/admin/blockUser
            UNBLOCK_USER: `${ADMIN_BASE}/unblockUser`,          // PATCH /ecomm/api/v1/admin/unblockUser
            FETCH_USER_DETAILS: `${ADMIN_BASE}/users/fetch`     // GET /ecomm/api/v1/admin/users/fetch       
        },
        CATEGORY: {
            CREATE: `${ADMIN_CATEGORY_BASE}`,                   // POST   /ecomm/api/v1/admin/categories
            DELETE: `${ADMIN_CATEGORY_BASE}/:categoryId`,       // DELETE /ecomm/api/v1/admin/categories/123
            UPDATE: `${ADMIN_CATEGORY_BASE}/:categoryId`        // PATCH  /ecomm/api/v1/admin/categories/123
        }
    },

    // 🌐 Public category routes (fetching by any user or guest)
    CATEGORY_ROUTES: {
        FETCH_ALL: `${PUBLIC_CATEGORY_BASE}`,                  // GET /ecomm/api/v1/categories
        FETCH_BY_ID: `${PUBLIC_CATEGORY_BASE}/:categoryId`,    // GET /ecomm/api/v1/categories/123
        FETCH_BY_SLUG: `${PUBLIC_CATEGORY_BASE}/slug/:slug`    // GET /ecomm/api/v1/categories/slug/mobile-phones
    }
}
