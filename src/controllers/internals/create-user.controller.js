/**
 * Internal Create User Controller
 * 
 * Handles user/admin creation requests from Admin Panel Service.
 * Creates users with appropriate ID prefixes based on type.
 * Uses signUpService for consistency with regular user registration.
 * 
 * @author Custom Auth Service Team
 * @date 2026-03-06
 */

const { signUpService } = require("@services/auth/sign-up.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { adminIdPrefix, userIdPrefix } = require("@configs/id-prefixes.config");
const { logWithTime } = require("@utils/time-stamps.util");
const {
    throwInternalServerError,
    throwConflictError,
    throwBadRequestError,
    throwSpecificInternalServerError
} = require("@/responses/common/error-handler.response");
const { sendCreateUserSuccessResponse } = require("@/responses/internals/common.response");

/**
 * Create User/Admin from Admin Panel
 */
const createUser = async (req, res) => {
    try {
        const { type, email, countryCode, localNumber, phone, password, firstName } = req.body;
        const deviceInput = req.device;
        const requestId = req.requestId;

        // 1. VALIDATE TYPE
        if (!type || !["admin", "user"].includes(type.toLowerCase())) {
            return throwBadRequestError(res, "Invalid type. Must be 'admin' or 'user'");
        }

        // 2. VALIDATE REQUIRED FIELDS
        const missing = [];
        if (!password) missing.push("password");
        if (!firstName) missing.push("firstName");
        if (!email && !phone && (!countryCode || !localNumber)) {
            missing.push("email OR (countryCode + localNumber)");
        }

        if (missing.length > 0) {
            return throwBadRequestError(res, `Missing required fields: ${missing.join(", ")}`);
        }

        // 3. DETERMINE PREFIX BASED ON TYPE
        const userType = type.toLowerCase();
        const idPrefix = userType === "admin" ? adminIdPrefix : userIdPrefix;

        // 4. PREPARE USER PAYLOAD
        const userPayload = {
            firstName,
            password,
            email,
            countryCode,
            localNumber,
            phone
        };

        // 5. CALL SIGNUP SERVICE WITH CUSTOM PREFIX
        const result = await signUpService(deviceInput, userPayload, requestId, idPrefix);

        // 6. HANDLE SERVICE FAILURES
        if (!result.success) {
            if (result.type === AuthErrorTypes.RESOURCE_EXISTS) {
                return throwConflictError(res, result.message, "Use different email or phone");
            }

            if (result.type === AuthErrorTypes.SERVER_LIMIT_REACHED) {
                return throwSpecificInternalServerError(res, result.message);
            }

            if (result.type === AuthErrorTypes.SERVER_ERROR) {
                return throwSpecificInternalServerError(res, result.message);
            }

            return throwBadRequestError(res, result.message);
        }

        // 7. SUCCESS RESPONSE
        return sendCreateUserSuccessResponse(res, result, userType);

    } catch (err) {
        logWithTime(`❌ Fatal Error in createUser: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { createUser };
