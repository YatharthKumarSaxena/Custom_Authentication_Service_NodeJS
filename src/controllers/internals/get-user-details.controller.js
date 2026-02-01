const { getUserFullDetailsService } = require("@services/internals/get-user-details.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { 
    throwInternalServerError, 
    throwDBResourceNotFoundError, 
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");
const { getUserDetailsAdminSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Controller: Get Single User Details (Admin View)
 */
const getUserDetailsAdmin = async (req, res) => {
    try {
        const admin = req.admin; // Admin requesting data
        
        // Target User ID (Params preferred for GET requests, Body for POST)
        const targetUserId = req.params.userId || req.query.userId || req.body.userId;

        // 1. Service Call
        const data = await getUserFullDetailsService(targetUserId);

        // 2. Log Action
        return getUserDetailsAdminSuccessResponse(res, admin, targetUserId, data);

    } catch (err) {
        if (err.type === AuthErrorTypes.RESOURCE_NOT_FOUND) {
            return throwDBResourceNotFoundError(res, err.message);
        }

        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error fetching user details for admin ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { getUserDetailsAdmin };