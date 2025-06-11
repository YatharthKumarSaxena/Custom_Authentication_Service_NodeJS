// Base path of all APIs (can be changed in one place if needed)
const BASE_PATH = "/ecomm";  

// API versioning (helps us move from /v1 to /v2 easily)
const API_VERSION = "/api/v1"; 

/* 
  ⚙️ What is `${}` and `` ?
  - These are part of JavaScript's Template Literals (introduced in ES6).
  - Backticks (``) allow multi-line strings and variable interpolation.
  - `${}` is used to insert variables inside strings dynamically.
*/

// 👇 Defining major base segments once to avoid repetition (DRY Principle)
const AUTH_BASE = `${BASE_PATH}${API_VERSION}/auth`;               // /ecomm/api/v1/auth
const USER_BASE = `${BASE_PATH}${API_VERSION}/users`;             // /ecomm/api/v1/users
const ADMIN_CATEGORY_BASE = `${BASE_PATH}${API_VERSION}/admin/categories`; // /ecomm/api/v1/admin/categories
const PUBLIC_CATEGORY_BASE = `${BASE_PATH}${API_VERSION}/categories`;      // /ecomm/api/v1/categories

// 🔁 Exporting all route constants, grouped by modules (Auth, User, Admin, Category)
module.exports = {
    // 🧾 Routes related to user authentication & account management
    AUTH_ROUTES: {
        SIGNUP: `${AUTH_BASE}/signup`,                  // POST /ecomm/api/v1/auth/signup
        SIGNIN: `${AUTH_BASE}/signin`,                  // POST /ecomm/api/v1/auth/signin
        SIGNOUT: `${AUTH_BASE}/signout`,                // POST /ecomm/api/v1/auth/signout
        BLOCK_USER: `${AUTH_BASE}/block`,               // PATCH /ecomm/api/v1/auth/block
        UNBLOCK_USER: `${AUTH_BASE}/unblock`,           // PATCH /ecomm/api/v1/auth/unblock
        DEACTIVATE_USER: `${AUTH_BASE}/deactivate`,     // PATCH /ecomm/api/v1/auth/deactivate
        ACTIVATE_USER: `${AUTH_BASE}/activate`,         // PATCH /ecomm/api/v1/auth/activate
        FETCH_USER_DETAILS: `${AUTH_BASE}/fetch`        // GET   /ecomm/api/v1/auth/fetch
    },

    // 👤 Routes accessible by the logged-in user (like updating their profile)
    USER_ROUTES: {
        UPDATE_PROFILE: `${USER_BASE}/update`           // PATCH /ecomm/api/v1/users/update
    },

    // 🛠️ Admin-specific routes (e.g. category creation, update, delete)
    ADMIN_ROUTES: {
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
