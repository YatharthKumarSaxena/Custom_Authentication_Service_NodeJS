// This file will include the controller logic for all powers of Admin

// Extract the Required Modules
const { throwInvalidResourceError, throwInternalServerError, errorMessage } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { BLOCK_REASONS, UNBLOCK_REASONS, adminID } = require("../configs/user-id.config");
const AuthLogModel = require("../models/auth-logs.model");
const { fetchUser } = require("../middlewares/helper.middleware");
const { isAdminID } = require("../utils/auth.utils");

const blockUserAccount = async(req,res) => {
    try{
        const blockReason = req.body.reason;
        const verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`⚠️ Invalid block request. Admin (${req.user.userID}) tried blocking non-existent user: ${req.body?.userID || req.body?.phoneNumber || req.body?.emailID} from device ID: (${req.deviceID}) with (${blockReason}) reason`);
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        const user = req.foundUser;
        // Check Requested User to be Blocked is Admin 
        if(user.userType === "ADMIN"){
            logWithTime(`🛡️👨‍💼 Admin (${req.user.userID}) cannot be blocked, admin tried to itself block from device id: (${req.deviceID}) . Provided Reason to block: (${blockReason}) `);
            return res.status(403).json({ success: false, message: "Admin cannot be blocked." });
        }
        // Checking Provided Reasons for Blocking are Invalid
        if (!Object.values(BLOCK_REASONS).includes(blockReason)) {
            logWithTime(`✅ Admin (${req.user.userID}) tried to block user (${req.body.userID }) with invalid reason (${blockReason}) from device id: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: `❌ Invalid block reason. Accepted reasons: ${Object.values(BLOCK_REASONS).join(", ")}`
            });
        }
        if(user.isBlocked){
            logWithTime(`⚠️ User (${user.userID}) is already blocked, admin (${req.user.userID}) tried to block it from device ID: (${req.deviceID}) with (${user.blockReason}) reason. Reason provided by admin to block this user at current: (${blockReason})`);
            return res.status(400).json({
                success: false,
                message: `User (${user.userID}) is already blocked.`
            });
        }
        // Block the user by setting isBlocked = true
        user.blockedAt = Date.now();
        user.isBlocked = true;
        user.blockedBy = req.user.userID;
        user.blockedVia = verifyWith;
        user.blockCount += 1;
        user.blockReason = blockReason;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) blocked user (${user.userID}) from device ID: (${req.deviceID}) with (${blockReason}) reason via (${verifyWith})`);
        // Update data into auth.logs
        await logAuthEvent(req, "BLOCKED", { performedOn: user });
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully blocked.`,
            resolvedBy: verifyWith
        });
    }catch(err){
        logWithTime(`❌ Internal Error: Admin (${req.user.userID}) tried to block User (${req.body.userID || req.body.emailID || req.body.phoneNumber}) from device ID: (${req.deviceID}).Provided Reason to block: (${req.body.reason}) reason`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const unblockUserAccount = async(req,res) => {
    try{
        const unblockReason = req.body.reason;
        const verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`⚠️ Invalid unblock request. Admin (${req.user.userID}) tried blocking non-existent user: ${req.body?.userID || req.body?.phoneNumber || req.body?.emailID} from device ID: (${req.deviceID}) with (${unblockReason}) reason`);
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        const user = req.foundUser;
        // Check Requested User to be Unblocked is Admin 
        if(user.userType === "ADMIN"){
            logWithTime(`🛡️👨‍💼 Admin (${req.user.userID}) cannot be unblocked, tried to unblock from device ID: (${req.deviceID}). Provided Reason to unblock: (${unblockReason}) reason`);
            return res.status(403).json({ success: false, message: "Admin cannot be unblocked." });
        }
        // Checking Provided Reasons for Unblocking are Invalid
        if (!Object.values(UNBLOCK_REASONS).includes(unblockReason)) {
            logWithTime(`✅ Admin (${req.user.userID}) tried to unblock user (${req.body.userID }) with invalid reason (${unblockReason}) from device ID: (${req.deviceID})`);
            return res.status(400).json({
                success: false,
                message: `❌ Invalid unblock reason. Accepted reasons: ${Object.values(UNBLOCK_REASONS).join(", ")}`
            });
        }
        if(!user.isBlocked){
            logWithTime(`⚠️ User (${user.userID}) is already unblocked, admin (${req.user.userID}) tried to unblock it from device ID: (${req.deviceID}) with (${unblockReason}) reason`);
            return res.status(400).json({
                success: false,
                message: `User (${user.userID}) is already unblocked.`
            });
        }
        // Unblock the user by setting isBlocked = false
        user.unblockedAt = Date.now();
        user.isBlocked = false;
        user.unblockedBy = req.user.userID;
        user.unblockedVia = verifyWith;
        user.unblockCount += 1;
        user.unblockReason = unblockReason;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) unblocked user (${user.userID}) from device ID: (${req.deviceID}) with (${unblockReason}) reason via (${verifyWith})`);
        // Update data into auth.logs
        await logAuthEvent(req, "UNBLOCKED", { performedOn: user });  
        return res.status(200).json({
            success: true,
            message: `User (${user.userID}) has been successfully unblocked.`,
            resolvedBy: verifyWith
        });
    }catch(err){
        logWithTime(`❌ Internal Error: Admin (${req.user.userID}) tried to unblock User (${req.body.userID || req.body.emailID || req.body.phoneNumber}) from device ID: (${req.deviceID}). Provided Reason to unblock: (${req.body.reason}) reason`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const getUserAuthLogs = async (req, res) => {
  try {
    const { userID, eventType, startDate, endDate } = req.body;

    const query = {};

    if (userID){
        const isUserCheckedAdmin = isAdminID(userID);
        if(isUserCheckedAdmin && userID !== adminID){
            logWithTime(`❌ Admin (${req.user.userID}) attempted to access logs of another admin (${userID})`);
            return res.status(403).json({
                success: false,
                message: "Access denied. You cannot access another admin's authentication logs.",
            });
        }
        query.userID = userID;
    } 
    
    if (eventType && Array.isArray(eventType) && eventType.length > 0) {
      query.eventType = { $in: eventType };
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await AuthLogModel.find(query).sort({ timestamp: -1 });

    // Update data into auth.logs
    await logAuthEvent(req, "CHECK_AUTH_LOGS", {
        performedOn: { userID: userID },
        filter: eventType
    });

    return res.status(200).json({
      message: "User authentication logs fetched successfully.",
      total: logs.length,
      logs: logs
    });

  } catch (error) {
    console.error(`[❌ LOG FETCH ERROR]`, error);
    return res.status(500).json({ message: "Internal Server Error while fetching logs." });
  }
};

// For Admin Panel Service (Internal API Controller)
const checkUserAccountStatus = async(req,res) => {
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
        const isUserCheckedAdmin = isAdminID(user.userID);
        if(isUserCheckedAdmin && user.userID !== adminID){
            logWithTime(`❌ Admin (${req.user.userID}) attempted to access logs of another admin (${userID})`);
            return res.status(403).json({
                success: false,
                message: "Access denied. You cannot access another admin's authentication logs.",
            });
        }
        const User_Account_Details = {
            "Name": user.name,
            "Customer ID": user.userID,
            "Phone Number": user.phoneNumber,
            "Email ID": user.emailID,
            "Verified": user.isVerified,
            "Login Count": user.loginCount,
            "Account Status": user.isActive ? "Activated" : "Deactivated",
            "Blocked Account": user.isBlocked ? "Yes" : "No",
            "Block Count": user.blockCount,
            "Unblock Count": user.unblockCount
        }
        if(user.passwordChangedAt)User_Account_Details["Password Changed At"] = user.passwordChangedAt;
        if(user.lastLogin)User_Account_Details["Last Login Time"] = user.lastLogin;
        if(user.lastActivatedAt)User_Account_Details["Activated Account At"] = user.lastActivatedAt;
        if(user.lastDeactivatedAt)User_Account_Details["Deactivated Account At"] = user.lastDeactivatedAt;
        if(user.lastLogout)User_Account_Details["Last Logout At"] = user.lastLogout;
        if(user.blockedAt){
            User_Account_Details["Blocked At"] = user.blockedAt;
            User_Account_Details["Blocked By"] = user.blockedBy;
            User_Account_Details["Block Reason"] = user.blockReason;
            User_Account_Details["Blocked Via"] = user.blockedVia;
        }
        if(user.unblockedAt){
            User_Account_Details["Unblocked At"] = user.unblockedAt;
            User_Account_Details["Unblocked By"] = user.unblockedBy;
            User_Account_Details["Unblock Reason"] = user.unblockReason;
            User_Account_Details["Unblocked Via"] = user.unblockedVia;
        }
        // Update data into auth.logs
        await logAuthEvent(req, "PROVIDE_ACCOUNT_DETAILS", {
            performedOn: req.foundUser
        });

        logWithTime(`✅ User Account Details with User ID: (${user.userID}) is provided Successfully to User from device ID: (${req.deviceID}) via (${verifyWith})`);
        return res.status(200).json({
            message: "Here is User Account Details",
            User_Account_Details,
            resolvedBy: verifyWith
        });
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while fetching the User Profile with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    getUserAuthLogs: getUserAuthLogs,
    blockUserAccount: blockUserAccount,
    unblockUserAccount: unblockUserAccount,
    checkUserAccountStatus: checkUserAccountStatus
}