// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

// Extracts file that include timeStamp function
const {logWithTime} = require("./time-stamps.util");
const { BAD_REQUEST, INTERNAL_ERROR, UNAUTHORIZED, FORBIDDEN, CONFLICT, UNPROCESSABLE_ENTITY, NOT_FOUND } = require("@configs/http-status.config");

const errorMessage = (err) => {
    logWithTime("🛑 Error occurred:");
    logWithTime("File Name and Line Number where this error occurred is displayed below:- ");
    console.log(err.stack);
    logWithTime("Error Message is displayed below:- ");
    console.error(err.message);
}

/*
  ✅ SRP + DRY: 
  Handles cases where required fields are missing in the request.
*/

const throwMissingFieldsError = (res,resource) =>{
    logWithTime("⚠️ Missing required fields in the request:");
    console.log(resource);
    return res.status(BAD_REQUEST).json({
        success: false,
        warning: "The following required field(s) are missing:",
        fields: resource,
        message: "Please provide the required fields to proceed."
    });
}

/*
  ✅ SRP + DRY: 
  Handles all credentials failure responses.
*/

const throwInvalidResourceError = (res,resource,reason) => {
    logWithTime("⚠️ Invalid "+resource);
    logWithTime("❌ Invalid Credentials! Please try again.");
    return res.status(UNAUTHORIZED).json({
        success: false,
        type: "InvalidResource",
        resource: resource,
        reason: reason,
        warning: "Invalid "+ resource + " Entered",
        message: "Please enter a Valid "+ resource
    })
}

/*
  ✅ SRP + DRY: 
  Handles Access Denied or Blocked Account responses.
*/

const throwAccessDeniedError = (res, reason = "Access Denied") => {
    logWithTime("⛔️ Access Denied: " + reason);
    return res.status(FORBIDDEN).json({
        success: false,
        type: "AccessDenied",
        warning: reason,
        message: "You do not have the necessary permissions to perform this action."
    });
}

/*
  ✅ SRP + DRY:
  Handles generic bad request responses (invalid/malformed request payloads).
*/

const throwBadRequestError = (res, reason = "Bad Request", details = null) => {
    logWithTime("⚠️ Bad Request: " + reason);
    return res.status(BAD_REQUEST).json({
        success: false,
        type: "BadRequest",
        warning: reason,
        details,
        message: "The request could not be processed due to invalid or missing data."
    });
};

const logMiddlewareError = (middlewareName, reason, req) => {
  const adminId = req?.admin?.adminId || req?.admin?.userId || "UNKNOWN_admin";
  const deviceId = req?.deviceId || "UNKNOWN_device";
  logWithTime(`❌ [${middlewareName}Middleware] Error: ${reason} | admin: (${adminId}) | device: (${deviceId})`);
};


const throwConflictError = (res, message, suggestion) => {
    logWithTime("⚔️ Conflict Detected: " + message);
    return res.status(CONFLICT).json({
        success: false,
        message,
        suggestion
    });
};

const getLogIdentifiers = (req) => {
    const adminId = req?.foundAdmin?.adminId || req?.admin?.adminId || req?.admin?.userId || "UNKNOWN_admin";
    return `with admin ID: (${adminId}). Request is made from device ID: (${req.deviceId})`;
};

const throwDBResourceNotFoundError = (res, resource) => {
    logWithTime("⚠️ Resource Not Found in Database: " + resource);
    return res.status(NOT_FOUND).json({
        success: false,
        type: "ResourceNotFound",
        resource,
        warning: `${resource} not found.`,
        message: `The specified ${resource} does not exist. Please verify and try again.`
    });
}

const throwSessionExpiredError = (res, reason = "Session expired") => {
    logWithTime("⏳ Session Expired: " + reason);
    return res.status(UNAUTHORIZED).json({
        success: false,
        type: "SessionExpired",
        warning: reason,
        message: "Your session has expired. Please login again to continue."
    });
};

const throwValidationError = (res, errors) => {
    logWithTime("⚠️ Validation Error: " + JSON.stringify(errors));
    return res.status(UNPROCESSABLE_ENTITY).json({
        success: false,
        type: "ValidationError",
        errors,
        message: "The request contains invalid data. Please review the errors and try again."
    });
};

/*
  ✅ SRP + DRY: 
  Handles all internal server failure responses.
*/

const throwInternalServerError = (res,error) => {
    if (error.name === 'ValidationError') {
      logWithTime(`⚠️ Validation Error: ${error.message}`);
      return throwBadRequestError(res, error.message);
    }
    errorMessage(error);
    logWithTime("💥 Internal Server Error occurred.");
    return res.status(INTERNAL_ERROR).json({
        success: false,
        response: "An internal server error occurred while processing your request.",
        message: "We apologize for the inconvenience. Please try again later."
    });
}

module.exports = {
    errorMessage,
    throwMissingFieldsError,
    throwInternalServerError,
    throwInvalidResourceError,
    throwAccessDeniedError,
    logMiddlewareError,
    throwConflictError,
    getLogIdentifiers,
    throwDBResourceNotFoundError,
    throwSessionExpiredError,
    throwBadRequestError,
    throwValidationError
}