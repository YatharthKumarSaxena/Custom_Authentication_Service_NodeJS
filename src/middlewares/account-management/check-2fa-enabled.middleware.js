/**
 * Check if Two-Factor Authentication (2FA) feature is enabled
 * Blocks requests if IS_2FA_FEATURE_ENABLED is false
 */

const { factoryMiddlewares } = require("../factory/index");
const { IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");

const { checkBooleanFeature } = factoryMiddlewares;

/**
 * Middleware to check if 2FA feature is enabled
 * Returns 403 if IS_2FA_FEATURE_ENABLED is set to false
 */
const check2FAEnabled = checkBooleanFeature(
    "Two-Factor Authentication",
    () => IS_TWO_FA_FEATURE_ENABLED,
    "Two-Factor Authentication (2FA) is currently disabled on this system. Please contact the administrator to enable 2FA functionality."
);

module.exports = {
    check2FAEnabled
};
