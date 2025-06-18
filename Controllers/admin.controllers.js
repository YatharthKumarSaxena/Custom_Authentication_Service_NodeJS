// This file will include the controller logic for all powers of Admin

// Extract the Required Modules
const { throwInvalidResourceError, throwInternalServerError, errorMessage } = require("../Configs/errorHandler.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");
const UserModel = require("../Models/User.model");
const {adminID,BLOCK_REASONS,UNBLOCK_REASONS} = require("../Configs/userID.config");

exports.blockUserAccount = async(req,res) => {
    try{
        // Check Requested User to be Blocked is Admin 
        if(req.user.userID === adminID){
            logWithTime(`🛡️👨‍💼 Admin (${req.user.userID}) cannot be blocked`);
            return res.status(403).json({ success: false, message: "Admin cannot be blocked." });
        }
        // Checking Provided Reasons for Blocking are Invalid
        const blockReason = req.body.reason;
        if (!Object.values(BLOCK_REASONS).includes(blockReason)) {
            logWithTime(`✅ Admin (${req.user.userID}) tried to block user having userID: (${req.body.userID }) with invalid reason (${blockReason})`);
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
        user.blockReason = blockReason;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) blocked user having userID: (${user.userID})`);
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully blocked.`
        });
    }catch(err){
        logWithTime(`❌ Internal Error: Admin (${req.user.userID}) tried to block User (${req.body.userID || req.body.emailID || req.body.phoneNumber})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

exports.unblockUserAccount = async(req,res) => {
    try{
        // Check Requested User to be Unblocked is Admin 
        if(req.body.userID === adminID){
            logWithTime(`🛡️👨‍💼 Admin (${req.user.userID}) cannot be unblocked`);
            return res.status(403).json({ success: false, message: "Admin cannot be unblocked." });
        }
        // Checking Provided Reasons for Unblocking are Invalid
        const unblockReason = req.body.reason;
        if (!Object.values(UNBLOCK_REASONS).includes(unblockReason)) {
            logWithTime(`✅ Admin (${req.user.userID}) tried to unblock user having userID: (${req.body.userID }) with invalid reason (${unblockReason})`);
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
            logWithTime(`⚠️ Invalid unblock request. Admin tried unblocking non-existent user: ${req.body?.userID || req.body?.phoneNumber || req.body?.emailID}`);
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
        user.blockReason = null;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) unblocked user having userID: (${user.userID})`);
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully unblocked.`
        });
    }catch(err){
        logWithTime(`❌ Internal Error: Admin (${req.user.userID}) tried to unblock User (${req.body.userID || req.body.emailID || req.body.phoneNumber})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}