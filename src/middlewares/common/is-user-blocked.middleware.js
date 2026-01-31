const { UserTypes } = require("@/configs/enums.config");
const { throwInternalServerError, logMiddlewareError, throwAccessDeniedError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

// Checking if user Account is Blocked
const isUserAccountBlocked = async (req, res, next) => {
    try {
        const user = req.user || req.foundUser;
        if(user.userType === UserTypes.ADMIN){
            logWithTime(`✅ User (${user.userId}) is Admin, skipping blocked check`);
            return next();
        }
        if (user.isBlocked === true) {
            logMiddlewareError("isUserAccountBlocked", "User account is blocked", req);
            return throwAccessDeniedError(res, "Your account has been blocked. Please contact support for assistance.");
        }
        // Active user – Allow to proceed
        logWithTime(`✅ User (${user.userId}) account is not blocked`);
        return next();
    } catch (err) {
        logMiddlewareError("isUserAccountBlocked", "Internal error during user blocked check", req);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    isUserAccountBlocked
}