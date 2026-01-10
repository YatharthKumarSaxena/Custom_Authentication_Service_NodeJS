const { throwInternalServerError, logMiddlewareError, throwAccessDeniedError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

// ✅ Checking if user Account is Active
const isUserAccountActive = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.isActive === false) {
            logMiddlewareError("isUserAccountActive", "User account is deactivated", req);
            return throwAccessDeniedError(res, "Your account has been deactivated. Please activate your account before continuing.");
        }
        logWithTime(`✅ User (${user.userId}) account is active`);
        // ✅ Active user – Allow to proceed
        return next();
    } catch (err) {
        logMiddlewareError("isUserAccountActive", "Internal error during user active check", req);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    isUserAccountActive
}