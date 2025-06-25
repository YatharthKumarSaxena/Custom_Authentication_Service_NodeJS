// controllers/internal-api.controllers.js

const { logWithTime } = require("../utils/time-stamps.utils");
const { setRefreshTokenCookie } = require("../utils/cookie-manager.utils");
const { throwInternalServerError, errorMessage, throwInvalidResourceError, throwResourceNotFoundError } =  require("../configs/error-handler.configs");
const { nameMinLength, nameMaxLength } = require("../configs/user-enums.config");
const { emailRegex, phoneRegex, nameRegex } = require("../configs/regex.config");
const { logAuthEvent } = require("../utils/auth-log-utils");

const updateUserProfile = async(req,res) => {
    try{
        let updatedFields = [];
        const user = req.user;
        if(req.body.name && req.body.name !== user.name){
            const name = req.body.name.trim();
            if(name.length < nameMinLength || name.length > nameMaxLength){
              return throwInvalidResourceError(res,`Name. Name must be between ${nameMinLength} and ${nameMaxLength} characters.`);
            }
            if(!nameRegex.test(name)){
              return throwInvalidResourceError(res,"Name. Name can only include letters, spaces, apostrophes ('), periods (.), and hyphens (-).");
            }
            updatedFields.push("Name");
            user.name = name;
        }
        if(req.body.emailID && req.body.emailID.trim().toLowerCase() !== user.emailID.trim().toLowerCase()){
            if (!emailRegex.test(req.body.emailID)) {
                return throwInvalidResourceError(res,"Email format. Please provide a valid email address. Provide Email Address that has no spaces ,must have alphabets, must have single @ and include valid . i.e .com , .in etc");
            }
            updatedFields.push("Email ID");
            user.emailID = req.body.emailID.trim().toLowerCase();
        }
        if(req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber){
            if(typeof req.body.phoneNumber.trim() !== "string" || !phoneRegex.test(req.body.phoneNumber.trim())) {
                return throwInvalidResourceError(res,"Phone number format. Provide a 10 digit number whose starting digit must be from 6 to 9")
            }
            updatedFields.push("Phone Number");
            user.phoneNumber = req.body.phoneNumber.trim();
        }
        if(updatedFields.length === 0){
            logWithTime(`❌ User Account Details with User ID: (${user.userID}) is not modified from device ID: (${req.deviceID}) in Updation Request`);
            return res.status(200).json({
                message: "No changes detected. Your profile remains the same."
            });
        }
        await user.save();
        // Update data into auth.logs
        await logAuthEvent(req, "UPDATE_ACCOUNT_DETAILS", { performedOn: user });
        logWithTime(`✅ User (${user.userID}) updated fields: [${updatedFields.join(", ")}] from device: (${req.deviceID})`);
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            updatedFields
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while updating the User Profile with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const setRefreshCookieForAdmin = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;
    if (!refreshToken) {
      return throwResourceNotFoundError(res,"Refresh Token");
    }

    const isCookieSet  = setRefreshTokenCookie(res, refreshToken);
    if(!isCookieSet){
      logWithTime(`❌ An Internal Error Occurred in setting refresh token for user (${user.userID}) at the time of set up admin cookie internal api. Request is made from device ID: (${req.deviceID})`);
      return;
    }

    return res.status(200).json({
      success: true,
      message: "✅ Admin refresh token set in cookie successfully."
    });
  } catch (err) {
    logWithTime("💥 Error while setting admin refresh cookie");
    errorMessage(err);
    return throwInternalServerError(res);
  }
};

module.exports = {
    updateUserProfile: updateUserProfile,
    setRefreshCookieForAdmin: setRefreshCookieForAdmin
}