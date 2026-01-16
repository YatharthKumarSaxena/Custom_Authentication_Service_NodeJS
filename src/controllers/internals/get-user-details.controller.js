const { OK } = require("@configs/http-status.config");
const { getUserFullDetailsService } = require("@services/internals/get-user-details.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { 
    throwInternalServerError, 
    throwDBResourceNotFoundError, 
    getLogIdentifiers
} = require("@utils/error-handler.util");
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
        logWithTime(`🔍 Admin (${admin.adminId}) viewed profile of User (${targetUserId})`);

        return res.status(OK).json({
            success: true,
            message: "User details fetched successfully.",
            data: data
        });

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