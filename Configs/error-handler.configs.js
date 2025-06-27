// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

// Extracts file that include timeStamp function
const {logWithTime} = require("../utils/time-stamps.utils");
const { BAD_REQUEST, INTERNAL_ERROR, UNAUTHORIZED, FORBIDDEN } = require("./http-status.config");

exports.errorMessage = (err) => {
    logWithTime("🛑 Error occurred:");
    logWithTime("File Name and Line Number where this error occurred is displayed below:- ");
    console.log(err.stack)
    logWithTime("Error Message is displayed below:- ")
    console.error(err.message);
    return;
}

/*
  ✅ SRP + DRY: 
  Handles cases where required fields are missing in the request.
*/

exports.throwResourceNotFoundError = (res,resource) =>{
    logWithTime("⚠️ Missing required fields in the request:");
    console.log(resource);
    if (res.headersSent) return; // 🔐 Prevent duplicate send
    return res.status(BAD_REQUEST).json({
        success: false,
        warning: "The following required field(s) are missing:",
        fields: resource,
        message: "Please provide the required fields to proceed."
    });
}

/*
  ✅ SRP + DRY: 
  Handles all internal server failure responses.
*/

exports.throwInternalServerError = (res) => {
    logWithTime("💥 Internal Server Error occurred.");
    if (res.headersSent) return; // 🔐 Prevent duplicate send
    return res.status(INTERNAL_ERROR).json({
        success: false,
        response: "An internal server error occurred while processing your request.",
        message: "We apologize for the inconvenience. Please try again later."
    });
}

/*
  ✅ SRP + DRY: 
  Handles all credentials failure responses.
*/

exports.throwInvalidResourceError = (res,resource) => {
    logWithTime("⚠️ Invalid "+resource);
    logWithTime("❌ Invalid Credentials! Please try again.");
    if (res.headersSent) return; // 🔐 Prevent duplicate send
    return res.status(UNAUTHORIZED).json({
        success: false,
        type: "InvalidResource",
        resource: resource,
        warning: "Invalid "+ resource + " Entered",
        message: "Please enter a Valid "+ resource
    })
}

/*
  ✅ SRP + DRY: 
  Handles Access Denied or Blocked Account responses.
*/

exports.throwAccessDeniedError = (res, reason = "Access Denied") => {
    logWithTime("⛔️ Access Denied: " + reason);
    if (res.headersSent) return; // 🔐 Prevent duplicate send
    return res.status(FORBIDDEN).json({
        success: false,
        type: "AccessDenied",
        warning: reason,
        message: "You do not have the necessary permissions to perform this action."
    });
}

/*
  ✅ SRP + DRY:
  Handles Blocked Account responses.
*/

exports.throwBlockedAccountError = (req,res) => {
    const reason = req.user.blockReason;
    logWithTime("⛔️ Blocked Account: " + reason);
    if (res.headersSent) return; // 🔐 Prevent duplicate send
    return res.status(FORBIDDEN).json({
        success: false,
        type: "BlockedAccount",
        warning: reason,
        message: "Please contact support if you believe this is an error."
    });
}

exports.globalErrorHandler = (err, req, res, next) => {
    logWithTime("💥 Uncaught Server Error:", err.message);
    return res.status(INTERNAL_ERROR).json({ success: false, message: "🔧 Internal Server Error!" });
};

exports.logMiddlewareError = (context, req) => {
    const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
    logWithTime(`❌ Middleware Error: [${context}] | User: (${userID}) | Device: (${req.deviceID})`);
};
