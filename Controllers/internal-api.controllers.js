// controllers/internal-api.controllers.js

const { logWithTime } = require("../utils/time-stamps.utils");
const { setRefreshTokenCookie } = require("../utils/cookie-manager.utils");
const { throwInternalServerError, errorMessage } =  require("../configs/error-handler.configs");

const updateUserProfile = async(req,res) => {
    try{
        let updatedFields = [];
        const user = req.user;
        if(req.body.name && req.body.name !== user.name){
            const name = req.body.name.trim();
            updatedFields.push("Name");
            user.name = name;
        }
        if(req.body.emailID && req.body.emailID.trim().toLowerCase() !== user.emailID.trim().toLowerCase()){
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(req.body.emailID)) {
                return res.status(400).json({
                    success: false,
                    message: "❌ Invalid email format. Please provide a valid email address."
                });
            }
            updatedFields.push("Email ID");
            user.emailID = req.body.emailID
        }
        if(req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber){
            if(typeof req.body.phoneNumber !== "string" || !/^\d{10}$/.test(req.body.phoneNumber)) {
                return res.status(400).json({ message: "Invalid phone number format." });
            }
            updatedFields.push("Phone Number");
            user.phoneNumber = req.body.phoneNumber;
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
      return res.status(400).json({
        message: "🔑 Refresh token missing in request body."
      });
    }

    const isCookieSet  = setRefreshTokenCookie(res, refreshToken);
    if(!isCookieSet){
      logWithTime(`❌ An Internal Error Occurred in setting refresh token for user (${user.userID}) at the time of set up admin cookie internal api. Request is made from device ID: (${req.deviceID})`);
      return;
    }

    return res.status(200).json({
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