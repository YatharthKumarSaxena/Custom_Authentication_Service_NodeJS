// routers/internal.routes.js

const express = require("express");
const router = express.Router();
const URIS = require("../configs/uri.config");
const { setRefreshCookieForAdmin } = require("../controllers/internal-api.controllers");
const commonUsedMiddleware = require("../middlewares/common-used.middleware");

const { SET_REFRESH_COOKIE } = URIS.INTERNAL_ROUTES;

// 🔐 Admin Internal API: Set Refresh Token in Cookie
router.post(SET_REFRESH_COOKIE, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyToken,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified
], setRefreshCookieForAdmin);

module.exports = router;
