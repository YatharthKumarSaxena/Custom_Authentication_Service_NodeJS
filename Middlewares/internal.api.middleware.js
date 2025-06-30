const { errorMessage, throwInternalServerError, throwAccessDeniedError, throwResourceNotFoundError, getLogIdentifiers, logMiddlewareError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { AdminActionReasons } = require("../configs/user-id.config");
const { immutableFields } = require("../configs/user-enums.config");
const { validateSingleIdentifier } = require("../utils/auth.utils");
const { OK, FORBIDDEN } = require("../configs/http-status.config");
const { fetchUser } = require("./helper.middleware");

const checkUpdateMyProfileRequest = (req,res,next) => {
    try{
        const user = req.user;
        if(user.userType === "ADMIN"){
            logWithTime(`⚠️ Access Denied: Admin (${user.userID}) cannot update their profile details via API Request. Request made from device id: (${req.deviceID})`);
            return throwAccessDeniedError(res,"Access Denied: Admin cannot update their profile details via API Request");
        }
        if(!req.body || Object.keys(req.body).length === 0){
            logWithTime(` No Changes by (${user.userID}) is requested to update their profile from device id: (${req.deviceID})`);
            return res.status(OK).json({
                success: true,
                message: "No changes detected. Your profile remains the same."
            })
        }
        // 🚫 Fields Not Allowed to Be Modified
        let attemptedFields = [];
        for (let field of immutableFields) {
            if (field in req.body) {
                attemptedFields.push(field);
            }
        }
        if (attemptedFields.length > 0) {
            const userID = req.user?.userID || "UNKNOWN_USER";
            logWithTime(`[SECURITY] 🚨 Attempt to modify ${attemptedFields.length} restricted fields by ${userID} [${req.deviceID}]`, "warn");
            return res.status(FORBIDDEN).json({
                success: false,
                message: `⚠️ You are not allowed to update some profile fields.`,
                restrictedFields: attemptedFields,
                warning: "This attempt has been logged. Please contact support if you believe this is a mistake."
            });
        }
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error occurred while validating the User Profile Updation Request ${getIdentifiers} `);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyAdminUserViewRequest = async(req,res,next) => {
    try{
        // Means Admin has not provided userID for which he/she want to check User Account Details
        const validateRequestBody = validateSingleIdentifier(req,res,"query");
        if(!validateRequestBody)return;
        if(!req.query.reason.trim() || req.query.reason.trim() === ""){ // Checking that Reason is Provided by Admin or not
            logMiddlewareError("Verify Admin User View Request, Reason Field Missing",req);
            return throwResourceNotFoundError(res,"Reason to fetch user account details");
        }
        // Check that Provided Reason is Valid or not
        const reason = req.query.reason.trim();
        // 🔒 Validate whether the reason is one of the valid enums
        if (!Object.values(AdminActionReasons).includes(reason)) {
            logMiddlewareError("Verify Admin User View Request, Invalid Admin Action Reason Provided",req);
            return throwAccessDeniedError(res,"Reason provided. Allowed reasons are: " + Object.values(AdminActionReasons).join(", "))
        }
        const verifyWith = await fetchUser(req,res);
        if(verifyWith === "")return;
        logWithTime(`🔍 Admin with id: (${req.user.userID})tried to check User Details of User having UserID: (${req.foundUser.userID}) with reason: (${req.query.reason}) from device having device ID: (${req.deviceID})`);
        if(!res.headersSent)return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        const checkVia = req.query.userID || req.query.phoneNumber || req.query.emailID || "Unauthorized User"
        logWithTime(`❌ Internal Error occurred while verifying the Admin Body Request ${getIdentifiers} to check User Profile with ${checkVia}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    checkUpdateMyProfileRequest: checkUpdateMyProfileRequest,
    verifyAdminUserViewRequest: verifyAdminUserViewRequest
}