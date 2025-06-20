// This file will include the controller logic for all powers of Admin

// Extract the Required Modules
const { throwInvalidResourceError, throwInternalServerError, errorMessage } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");
const {adminID,BLOCK_REASONS,UNBLOCK_REASONS} = require("../configs/user-id.config");
const AuthLogModel = require("../models/auth-logs.model");

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
        user.blockedAt = Date.now();
        user.isBlocked = true;
        user.blockReason = blockReason;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) blocked user (${user.userID}) from device ID: (${req.deviceID})`);
        // Update data into auth.logs
        const authLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "BLOCKED",
            deviceID: req.deviceID,
            performedBy: "ADMIN"
        });
        if(req.deviceName)authLog["deviceName"] = req.deviceName;
        await authLog.save();
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
        user.unblockedAt = Date.now();
        user.isBlocked = false;
        user.blockReason = null;
        await user.save();
        logWithTime(`✅ Admin (${req.user.userID}) unblocked user (${user.userID}) from device ID: (${req.deviceID})`);
        // Update data into auth.logs
        const authLog = await AuthLogModel.create({
            userID: user.userID,
            eventType: "UNBLOCKED",
            deviceID: req.deviceID,
            performedBy: "ADMIN"
        });
        if(req.deviceName)authLog["deviceName"] = req.deviceName;
        await authLog.save();  
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

exports.getUserAuthLogs = async (req, res) => {
  try {
    const { userID, eventType, startDate, endDate } = req.body;

    const query = {};

    if (userID) query.userID = userID;
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
    const authLog = await AuthLogModel.create({
        userID: userID,
        eventType: "CHECK_AUTH_LOGS",
        deviceID: req.deviceID,
        performedBy: "ADMIN",
        checkAuthLogDetails: {
            adminID: req.user.userID,
            filter: eventType
        }
    });
    if(req.deviceName)authLog["deviceName"] = req.deviceName;
    await authLog.save();  

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

// Controller to Fetch All Active Devices of a User
exports.getActiveDevices = async (req, res) => {
  try {
    const user = req.user || req.foundUser; // depending on middleware flow
    if (!user) {
      return throwInvalidResourceError(res, "UserID");
    }

    if (!Array.isArray(user.devices) || user.devices.length === 0) {
      logWithTime(`📭 No active devices found for User (${user.userID})`);
      return res.status(200).json({
        success: true,
        message: "No active devices found for the user.",
        total: 0,
        devices: []
      });
    }

    // Sort devices by lastUsedAt descending
    const sortedDevices = user.devices.sort(
      (a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
    );

    logWithTime(`📲 Fetched ${sortedDevices.length} active devices for User (${user.userID})`);
    return res.status(200).json({
      success: true,
      message: "Active devices fetched successfully.",
      total: sortedDevices.length,
      devices: sortedDevices
    });
  } catch (err) {
    const userID = req?.user?.userID || "UNKNOWN_USER";
    logWithTime(`❌ Internal Error occurred while fetching active devices for userID: (${userID})`);
    return throwInternalServerError(res);
  }
};
