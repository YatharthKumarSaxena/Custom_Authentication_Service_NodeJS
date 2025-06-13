// This file will include the controller logic for all powers of Admin

// Extract the Required Modules
const { throwInvalidResourceError, throwInternalServerError, errorMessage } = require("../Configs/message.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");
const UserModel = require("../Models/User.model");
const {adminID} = require("../Configs/userID.config");

exports.blockUserAccount = async(req,res) => {
    try{
        if(req.body.requestedUserID === adminID){
            logWithTime("🛡️👨‍💼 Admin cannot be blocked");
            return res.status(403).json({ success: false, message: "Admin cannot be blocked." });
        }
        const user = await UserModel.findOne({
            $or:[
                {userID: req.body.requestedUserID},
                {phoneNumber: req.body.phoneNumber},
                {emailID: req.body.emailID}
            ]
        })
        if(!user){
            logWithTime(`⚠️ Invalid block request. Admin tried blocking non-existent user: ${req.body?.requestedUserID || req.body?.phoneNumber || req.body?.emailID}`);
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        if(user.isBlocked){
            logWithTime(`⚠️ User (${user.userID}) is already blocked`);
            return res.status(400).json({
                success: false,
                message: `User (${user.userID}) is already blocked.`
            });
        }
        // Block the user by setting isBlocked = true
        user.isBlocked = true;
        await user.save();
        logWithTime(`✅ User (${user.userID}) has been successfully blocked`);
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully blocked.`
        });
    }catch(err){
        logWithTime("An Error occurrred while blocking the user account");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

exports.unblockUserAccount = async(req,res) => {
    try{
        if(req.body.requestedUserID === adminID){
            logWithTime("🛡️👨‍💼 Admin cannot be unblocked");
            return res.status(403).json({ success: false, message: "Admin cannot be unblocked." });
        }
        const user = await UserModel.findOne({
            $or:[
                {userID: req.body.requestedUserID},
                {phoneNumber: req.body.phoneNumber},
                {emailID: req.body.emailID}
            ]
        })
        if(!user){
            logWithTime(`⚠️ Invalid unblock request. Admin tried unblocking non-existent user: ${req.body?.requestedUserID || req.body?.phoneNumber || req.body?.emailID}`);
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        if(!user.isBlocked){
            logWithTime(`⚠️ User (${user.userID}) is already unblocked`);
            return res.status(400).json({
                success: false,
                message: `User (${user.userID}) is already unblocked.`
            });
        }
        // Unblock the user by setting isBlocked = false
        user.isBlocked = false;
        await user.save();
        logWithTime(`✅ User (${user.userID}) has been successfully unblocked`);
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully unblocked.`
        });
    }catch(err){
        logWithTime("An Error occurrred while unblocking the user account");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}