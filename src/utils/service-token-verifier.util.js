const jwt = require("jsonwebtoken");
const { service } = require("@configs/security.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { ALLOWED_SERVICE_NAMES, algorithms } = service;

/**
 * Verifies a service token's JWT signature and structure
 * @param {string} token - The JWT token to verify
 * @param {string} SERVICE_TOKEN_SECRET - The secret used to verify the token
 * @returns {Object} { success: boolean, decoded: Object|null, error: string|null }
 */

const verifyServiceToken = (token, SERVICE_TOKEN_SECRET) => {
  try {
    if (!token || token.trim() === "") {
      return {
        success: false,
        decoded: null,
        error: "Service token is missing or empty"
      };
    }

    // Verify JWT signature and decode
    const decoded = jwt.verify(token, SERVICE_TOKEN_SECRET, {
      algorithms: algorithms
    });

    // Validate token type
    if (decoded.type !== "service-token") {
      return {
        success: false,
        decoded: null,
        error: "Invalid token type. Expected 'service-token'"
      };
    }

    // Validate required fields
    if (!decoded.serviceName || !decoded.serviceInstanceId) {
      return {
        success: false,
        decoded: null,
        error: "Token missing required fields (serviceName, serviceInstanceId)"
      };
    }

    logWithTime(`✅ Service token verified: ${decoded.serviceName}`);

    return {
      success: true,
      decoded: decoded,
      error: null
    };

  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return {
        success: false,
        decoded: null,
        error: "Service token has expired"
      };
    }

    if (err.name === "JsonWebTokenError") {
      return {
        success: false,
        decoded: null,
        error: "Invalid service token signature or format"
      };
    }

    logWithTime(`❌ Service token verification error: ${err.message}`);
    return {
      success: false,
      decoded: null,
      error: "Service token verification failed"
    };
  }
};

/**
 * Validates if the service name is in the allowed list
 * @param {string} serviceName - The service name from token
 * @param {Array<string>} allowedServices - Optional list of allowed services (overrides global config)
 * @returns {Object} { isValid: boolean, error: string|null }
 */
const validateServiceName = (serviceName) => {
  const serviceList = ALLOWED_SERVICE_NAMES;

  // If no allowed services configured, allow all
  if (!serviceList || serviceList.length === 0) {
    return { isValid: true, error: null };
  }

  if (!serviceList.includes(serviceName)) {
    return {
      isValid: false,
      error: `Service '${serviceName}' is not in the allowed services list`
    };
  }
  
  return { isValid: true, error: null };
};

module.exports = {
  verifyServiceToken,
  validateServiceName
};