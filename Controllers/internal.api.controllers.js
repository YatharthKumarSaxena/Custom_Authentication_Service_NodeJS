const { logWithTime } = require("../utils/time-stamps.utils");
const { throwInternalServerError, errorMessage } =  require("../configs/error-handler.configs");
const AuthLogModel = require("../models/auth-logs.model");

exports.updateUserProfile = async(req,res) => {
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
        const updateAccountLog = await AuthLogModel.create({
            userID: req.user.userID,
            eventType: "UPDATE_ACCOUNT_DETAILS",
            deviceID: req.deviceID,
            performedBy: req.user.userType,
        });       
        if(req.deviceName)updateAccountLog["deviceName"] = req.deviceName; 
        if (req.deviceType) updateAccountLog["deviceType"] = req.deviceType; 
        await updateAccountLog.save();
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

