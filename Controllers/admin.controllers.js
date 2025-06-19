// This file will include the controller logic for all powers of Admin

// Extract the Required Modules
const { throwInvalidResourceError, throwInternalServerError, errorMessage } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");
const {adminID,BLOCK_REASONS,UNBLOCK_REASONS} = require("../configs/user-id.config");

exports.blockUserAccount = async(req,res) => {
    try{
        // Check Requested User to be Blocked is Admin 
        if(req.user.userID === adminID){
            logWithTime(`🛡️👨‍💼 Admin (${req.user.userID}) cannot be blocked, admin tried to itself block from device id: (${req.deviceID})`);
            return res.status(403).json({ success: false, message: "Admin cannot be blocked." });
        }
        // Checking Provided Reasons for Blocking are Invalid
        const blockReason = req.body.reason;
        if (!Object.values(BLOCK_REASONS).includes(blockReason)) {
            logWithTime(`✅ Admin (${req.user.userID}) tried to block user (${req.body.userID }) with invalid reason (${blockReason}) from device id: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: `❌ Invalid block reason. Accepted reasons: ${Object.values(BLOCK_REASONS).join(", ")}`
            });
        }
        const user = await UserModel.findOne({
            $or:[
                {userID: req.body.userID},
                {phoneNumber: req.body.phoneNumber},
                {emailID: req.body.emailID}
            ]
        });
        if(!user){
            logWithTime(`⚠️ Invalid block request. Admin (${req.user.userID}) tried blocking non-existent user: ${req.body?.requestedUserID || req.body?.phoneNumber || req.body?.emailID} from device ID: (${req.deviceID})`);
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        if(user.isBlocked){
            logWithTime(`⚠️ User (${user.userID}) is already blocked, admin (${req.user.userID}) tried to block it from device ID: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: `User (${user.userID}) is already blocked.`
            });
        }
        // Block the user by setting isBlocked = true
        user.isBlocked = true;
        user.blockReason = blockReason;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) blocked user (${user.userID}) from device ID: (${req.deviceID})`);
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully blocked.`
        });
    }catch(err){
        logWithTime(`❌ Internal Error: Admin (${req.user.userID}) tried to block User (${req.body.userID || req.body.emailID || req.body.phoneNumber}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

exports.unblockUserAccount = async(req,res) => {
    try{
        // Check Requested User to be Unblocked is Admin 
        if(req.body.userID === adminID){
            logWithTime(`🛡️👨‍💼 Admin (${req.user.userID}) cannot be unblocked, tried to unblock from device ID: (${req.deviceID})`);
            return res.status(403).json({ success: false, message: "Admin cannot be unblocked." });
        }
        // Checking Provided Reasons for Unblocking are Invalid
        const unblockReason = req.body.reason;
        if (!Object.values(UNBLOCK_REASONS).includes(unblockReason)) {
            logWithTime(`✅ Admin (${req.user.userID}) tried to unblock user (${req.body.userID }) with invalid reason (${unblockReason}) from device ID: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: `❌ Invalid unblock reason. Accepted reasons: ${Object.values(UNBLOCK_REASONS).join(", ")}`
            });
        }
        const user = await UserModel.findOne({
            $or:[
                {userID: req.body.userID},
                {phoneNumber: req.body.phoneNumber},
                {emailID: req.body.emailID}
            ]
        })
        if(!user){
            logWithTime(`⚠️ Invalid unblock request. Admin (${req.user.userID}) tried unblocking non-existent user: ${req.body?.userID || req.body?.phoneNumber || req.body?.emailID} from device ID: (${req.deviceID})`);
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        if(!user.isBlocked){
            logWithTime(`⚠️ User (${user.userID}) is already unblocked, admin (${req.user.userID}) tried to unblock it from device ID: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: `User (${user.userID}) is already unblocked.`
            });
        }
        // Unblock the user by setting isBlocked = false
        user.isBlocked = false;
        user.blockReason = null;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) unblocked user (${user.userID}) from device ID: (${req.deviceID})`);
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully unblocked.`
        });
    }catch(err){
        logWithTime(`❌ Internal Error: Admin (${req.user.userID}) tried to unblock User (${req.body.userID || req.body.emailID || req.body.phoneNumber}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}