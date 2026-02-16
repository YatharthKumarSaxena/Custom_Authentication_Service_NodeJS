const { throwFeatureDisabledError, logMiddlewareError } = require("@/responses/common/error-handler.response");

/**
 * Generic Feature Enabled Middleware Factory
 * 
 * Blocks API endpoints based on feature configuration.
 * Supports both enum-based (array) and boolean-based checks.
 * 
 * @param {string} featureName - Display name of the feature (e.g., "Two-Factor Authentication", "Email Verification")
 * @param {Function} getCurrentValue - Function that returns current config value
 * @param {Array<string>|boolean|Function} expectedValue - Expected value(s) or boolean check
 *   - Array: Current value must be in this array (enum-based)
 *   - Boolean: If false, feature is disabled
 *   - Function: Custom validation function returning boolean
 * @param {string} blockMessage - Custom message when feature is blocked
 * 
 * @example
 * // Enum-based check (array of allowed values)
 * const check2FAEnabled = checkFeatureEnabled(
 *   "Two-Factor Authentication",
 *   () => security.config.TWO_FA_MODE,
 *   [TwoFAMode.ENABLED, TwoFAMode.OPTIONAL],
 *   "2FA is currently disabled on this system."
 * );
 * 
 * @example
 * // Boolean-based check (simple enabled/disabled)
 * const checkEmailVerificationEnabled = checkFeatureEnabled(
 *   "Email Verification",
 *   () => security.config.IS_EMAIL_VERIFICATION_ENABLED,
 *   true, // Expected to be true
 *   "Email verification is currently disabled."
 * );
 * 
 * @example
 * // Direct boolean value (shorthand)
 * const checkSMSEnabled = checkFeatureEnabled(
 *   "SMS Notifications",
 *   () => security.config.SMS_ENABLED,
 *   null, // Will check if value is truthy
 *   "SMS notifications are disabled."
 * );
 */
const checkFeatureEnabled = (featureName, getCurrentValue, expectedValue = null, blockMessage = null) => {
    return async (req, res, next) => {
        try {
            // Get current configuration value
            const currentValue = typeof getCurrentValue === 'function' 
                ? getCurrentValue() 
                : getCurrentValue;

            let isEnabled = false;

            // TYPE 1: Array-based check (enum validation)
            if (Array.isArray(expectedValue)) {
                isEnabled = expectedValue.includes(currentValue);
                
                if (!isEnabled) {
                    logMiddlewareError(
                        "checkFeatureEnabled",
                        `${featureName} blocked: Current value is "${currentValue}", expected one of: [${expectedValue.join(", ")}]`,
                        req
                    );
                }
            }
            
            // TYPE 2: Boolean-based check
            else if (typeof expectedValue === 'boolean') {
                isEnabled = currentValue === expectedValue;
                
                if (!isEnabled) {
                    logMiddlewareError(
                        "checkFeatureEnabled",
                        `${featureName} blocked: Feature is ${currentValue ? 'enabled' : 'disabled'}, expected: ${expectedValue}`,
                        req
                    );
                }
            }
            
            // TYPE 3: Function-based check (custom validation)
            else if (typeof expectedValue === 'function') {
                isEnabled = expectedValue(currentValue);
                
                if (!isEnabled) {
                    logMiddlewareError(
                        "checkFeatureEnabled",
                        `${featureName} blocked: Custom validation failed for value: "${currentValue}"`,
                        req
                    );
                }
            }
            
            // TYPE 4: Null/undefined expectedValue - check if current value is truthy
            else if (expectedValue === null || expectedValue === undefined) {
                isEnabled = !!currentValue;
                
                if (!isEnabled) {
                    logMiddlewareError(
                        "checkFeatureEnabled",
                        `${featureName} blocked: Feature value is falsy (${currentValue})`,
                        req
                    );
                }
            }
            
            // TYPE 5: Direct value comparison
            else {
                isEnabled = currentValue === expectedValue;
                
                if (!isEnabled) {
                    logMiddlewareError(
                        "checkFeatureEnabled",
                        `${featureName} blocked: Current value is "${currentValue}", expected: "${expectedValue}"`,
                        req
                    );
                }
            }

            // If feature is not enabled, throw error
            if (!isEnabled) {
                const defaultMessage = `${featureName} is currently disabled or not available.`;
                
                return throwFeatureDisabledError(
                    res,
                    featureName,
                    blockMessage || defaultMessage
                );
            }

            // Feature is enabled - proceed
            next();

        } catch (error) {
            logMiddlewareError(
                "checkFeatureEnabled",
                `Error in feature enabled middleware for "${featureName}": ${error.message}`,
                req
            );
            return throwFeatureDisabledError(
                res,
                featureName,
                `Unable to verify ${featureName} configuration.`
            );
        }
    };
};

/**
 * Simplified boolean check factory
 * Shorthand for checking if a boolean config is true
 * 
 * @example
 * const check2FAEnabled = checkBooleanFeature(
 *   "Two-Factor Authentication",
 *   () => security.IS_TWO_FA_FEATURE_ENABLED,
 *   "2FA is not enabled on this system."
 * );
 */
const checkBooleanFeature = (featureName, getCurrentValue, blockMessage = null) => {
    return checkFeatureEnabled(
        featureName,
        getCurrentValue,
        true, // Must be true
        blockMessage
    );
};

/**
 * Simplified enum check factory
 * Shorthand for checking if current value is in allowed enum values
 * 
 * @example
 * const checkValidAuthMode = checkEnumFeature(
 *   "Authentication Mode",
 *   () => security.AUTH_MODE,
 *   [AuthModes.EMAIL, AuthModes.BOTH],
 *   "Current authentication mode is not supported for this operation."
 * );
 */
const checkEnumFeature = (featureName, getCurrentValue, allowedValues = [], blockMessage = null) => {
    return checkFeatureEnabled(
        featureName,
        getCurrentValue,
        allowedValues,
        blockMessage
    );
};

module.exports = {
    checkFeatureEnabled,
    checkBooleanFeature,
    checkEnumFeature
};