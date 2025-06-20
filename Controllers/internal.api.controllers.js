const { logWithTime } = require("../utils/time-stamps.utils");
const { throwInternalServerError,errorMessage,throwResourceNotFoundError } =  require("../configs/error-handler.configs");
const { fetchUser } = require("../middlewares/helper.middleware");
const AuthLogModel = require("../models/auth-logs.model");

exports.updateUserProfile = async(req,res) => {
    try{
        let updatedFields = [];
        const user = req.user;
        if(req.body.name && req.body.name !== user.name){
            updatedFields.push("Name");
            user.name = req.body.name;
        }
        if(req.body.emailID && req.body.emailID.trim().toLowerCase() !== user.emailID.trim().toLowerCase()){
            updatedFields.push("Email ID");
            user.emailID = req.body.emailID
        }
        if(req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber){
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

exports.provideUserAccountDetails = async(req,res) => {
    try{
        // If Get Request has a User then We have to Extract its Details and give to the Admin
        let user;
        let verifyWith = await fetchUser(req,res);
        if (res.headersSent) return; // If response is returned by fetchUser
        if(verifyWith !== "")user = req.foundUser;
        // This Will Execute if It is Normal Request Made By User to View their Account Details
        if(!user)user = req.user; 
        if(!user){
            return throwResourceNotFoundError(res,"User");
        }
        const User_Account_Details = {
            "Name": user.name,
            "Customer ID": user.userID,
            "Phone Number": user.phoneNumber,
            "Email ID": user.emailID,
            "Address": user.address,
            "Verified": user.isVerified,
            "Last Login Time": user.lastLogin,
            "Account Status": user.isActive ? "Activated" : "Deactivated",
            "Blocked Account": user.isBlocked ? "Yes" : "No"
        }
        // Update data into auth.logs
        const provideAccountDetailsLog = await AuthLogModel.create({
            userID: req.user.userID,
            eventType: "PROVIDE_ACCOUNT_DETAILS",
            deviceID: req.deviceID,
            performedBy: req.user.userType,
        });        
        await provideAccountDetailsLog.save();
        logWithTime(`✅ User Account Details with User ID: (${user.userID}) is provided Successfully to User from device ID: (${req.deviceID})`);
        return res.status(200).json({
            message: "Here is User Account Details",
            User_Account_Details
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while fetching the User Profile with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}