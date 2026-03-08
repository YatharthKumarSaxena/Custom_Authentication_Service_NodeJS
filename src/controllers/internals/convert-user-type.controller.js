const { convertUserTypeService } = require("@services/internals/convert-user-type.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const {
    throwInternalServerError,
    throwDBResourceNotFoundError,
    throwConflictError,
    throwBadRequestError,
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");
const { convertUserTypeSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Controller: Convert User Type
 * @route PATCH /internal/convert-user-type/:userId
 */
const convertUserType = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { userType } = req.body;

        // Validate request body
        if (!userType) {
            return throwBadRequestError(res, "userType is required in request body");
        }

        // Log the request
        logWithTime(`🔄 Request to convert user (${userId}) to type: ${userType}`);

        // Call service
        const result = await convertUserTypeService(userId, userType);

        // Check if no change occurred
        if (result.success === false) {
            logWithTime(`⚠️ Conversion skipped: ${result.message}`);
            return throwConflictError(res, result.message);
        }

        return convertUserTypeSuccessResponse(res, userId, result);

    } catch (err) {
        if (err.type === AuthErrorTypes.RESOURCE_NOT_FOUND) {
            return throwDBResourceNotFoundError(res, err.message);
        }
        
        if (err.type === AuthErrorTypes.VALIDATION_ERROR) {
            return throwBadRequestError(res, err.message);
        }

        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Convert User Type Failed ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = {
    convertUserType
};
