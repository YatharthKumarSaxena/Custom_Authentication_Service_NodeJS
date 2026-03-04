const { validateServiceName, verifyServiceToken } = require("@utils/service-token-verifier.util");
const { SERVICE_HEADERS } = require("@configs/headers.config");
const { UNAUTHORIZED, FORBIDDEN } = require("@configs/http-status.config");
const {
  logMiddlewareError,
  errorMessage,
  throwSpecificInternalServerError,
  throwUnauthorizedError,
  throwAccessDeniedError
} = require("@/responses/common/error-handler.response");

/**
 * Factory function to create service verification middleware
 * 
 * Follows rate limiter pattern - returns configured middleware
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.middlewareName - Name of middleware (for logging)
 * @param {string} config.expectedServiceName - Expected service name (strict comparison, no trimming/lowercase)
 * @param {string} [config.expectedToken] - Optional expected token value (strict comparison)
 * @returns {Function} Express middleware (req, res, next)
 * 
 * @example
 * const authServiceMiddleware = createVerifyServiceMiddleware({
 *   middlewareName: "AuthService",
 *   expectedServiceName: "auth-service"
 * });
 * 
 * router.post("/internal/sync", authServiceMiddleware, controller);
 */
const createVerifyServiceMiddleware = ({
  middlewareName,
  expectedServiceName,
  expectedTokenSecret
}) => {

  // Return the actual middleware function
  return (req, res, next) => {
    // Validate factory parameters
    if (!middlewareName || typeof middlewareName !== "string") {
      return throwSpecificInternalServerError(res, "createVerifyServiceMiddleware: middlewareName is required and must be a string");
    }

    if (!expectedTokenSecret) {
      logMiddlewareError(
        middlewareName,
        "Expected token secret not configured for middleware",
        req
      );
      return throwSpecificInternalServerError(res, "Expected token secret is required for this middleware");
    }

    if (!expectedServiceName || typeof expectedServiceName !== "string") {
      logMiddlewareError(
        middlewareName,
        "Expected service name missing or invalid in middleware configuration",
        req
      );
      return throwSpecificInternalServerError(res, "Expected service name is required and must be a string for this middleware");
    }

    const validation = validateServiceName(expectedServiceName);

    if (!validation.isValid) {
      logMiddlewareError(
        middlewareName,
        validation.error,
        req
      );
      return throwAccessDeniedError(res, validation.error);
    }

    try {

      // Step 1: Extract token from header
      const authHeader = req.headers.authorization;
      let token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
      if (!token) {
        token = req.headers[SERVICE_HEADERS.SERVICE_TOKEN];
      }

      console.log(`\n🔍 [${middlewareName}] Token Extraction:`, {
        hasAuthHeader: !!authHeader,
        hasToken: !!token
      });

      if (!token) {
        logMiddlewareError(
          middlewareName,
          "Service token missing in request header",
          req
        );
        return throwUnauthorizedError(res, "Service token", "Service token is required for this endpoint");
      }

      // Step 2: Verify JWT token signature and structure
      const result = verifyServiceToken(token, expectedTokenSecret);

      console.log(`\n🔐 [${middlewareName}] Token Verification Result:`, {
        success: result.success,
        error: result.error || 'N/A',
        hasDecoded: !!result.decoded
      });

      if (!result.success) {
        logMiddlewareError(
          middlewareName,
          `Token verification failed: ${result.error}`,
          req
        );

        const statusCode = result.error?.includes("expired")
          ? UNAUTHORIZED
          : FORBIDDEN;

        return res.status(statusCode).json({
          success: false,
          message: result.error,
          error: result.error?.includes("expired")
            ? "TOKEN_EXPIRED"
            : "INVALID_SERVICE_TOKEN"
        });
      }

      // Step 3: Strict service name comparison (no trimming, no lowercase)
      const actualServiceName = result.decoded.serviceName;

      console.log(`\n📋 [${middlewareName}] Decoded Token:`, {
        serviceName: result.decoded.serviceName,
        type: result.decoded.type
      });

      console.log(`\n🔄 [${middlewareName}] Service Name Comparison:`, {
        expected: expectedServiceName,
        actual: actualServiceName,
        match: actualServiceName === expectedServiceName,
        expectedLength: expectedServiceName?.length,
        actualLength: actualServiceName?.length
      });

      if (actualServiceName !== expectedServiceName) {
        logMiddlewareError(
          middlewareName,
          `Service name mismatch. Expected: '${expectedServiceName}', Got: '${actualServiceName}'`,
          req
        );
        return throwAccessDeniedError(
          res,
          `This endpoint is restricted to '${expectedServiceName}' service only`
        );
      }

      // Step 3.5: Validate service is in allowed services list
      const serviceValidation = validateServiceName(actualServiceName);
      
      console.log(`\n✅ [${middlewareName}] Service Name Validation:`, {
        serviceName: actualServiceName,
        isValid: serviceValidation.isValid,
        error: serviceValidation.error || 'N/A'
      });

      if (!serviceValidation.isValid) {
        logMiddlewareError(
          middlewareName,
          serviceValidation.error,
          req
        );
        return throwAccessDeniedError(res, serviceValidation.error);
      }

      // Step 4: Attach service auth to request
      req.serviceAuth = {
        serviceName: result.decoded.serviceName,
        serviceInstanceId: result.decoded.serviceInstanceId,
        type: result.decoded.type,
        issuedAt: result.decoded.iat,
        expiresAt: result.decoded.exp
      };

      console.log(`\n✅ [${middlewareName}] Service Authentication SUCCESS - Proceeding to next middleware\n`);

      // Success - proceed to next middleware
      return next();

    } catch (err) {
      logMiddlewareError(
        middlewareName,
        `Unexpected error: ${err.message}`,
        req
      );
      errorMessage(err);

      return res.status(UNAUTHORIZED).json({
        success: false,
        message: "Service authentication failed",
        error: "AUTHENTICATION_ERROR"
      });
    }
  };
};

module.exports = {
  createVerifyServiceMiddleware
};