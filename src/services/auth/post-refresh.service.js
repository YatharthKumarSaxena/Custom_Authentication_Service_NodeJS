/**
 * Post-Refresh Service
 * * Business logic for distributed token refresh using Atomic Transactions.
 * Follows the architecture of auth-session.service
 */

const mongoose = require("mongoose");
const { verifyToken } = require("@utils/verify-token.util");
const { Token, AuthErrorTypes } = require("@configs/enums.config");
const { UserDeviceModel } = require("@models/index"); 
const { logWithTime } = require("@utils/time-stamps.util");

// Audit & Logging
const { SYSTEM_LOG_EVENTS, STATUS_TYPES } = require("@configs/system-log-events.config");

// Integration Helpers (Redis/Microservice)
const { rotateAuthSession } = require("@services/integration/session-integration.helper"); 
const { createToken } = require("@/utils/issue-token.util");
const { expiryTimeOfRefreshToken, expiryTimeOfAccessToken } = require("@/configs/token.config");
const { logSystemEvent } = require("../system/system-log.service");

/**
 * Perform post-refresh token operation
 * * Flow:
 * 1. Verify Token Signature (Stateless)
 * 2. Start DB Transaction
 * 3. Verify Session in DB
 * 4. Update DB (Rotate Token)
 * 5. Commit Transaction
 * 6. Update Redis & Fire Audit Logs (Async)
 * * @param {string} refreshToken - Current refresh token
 * @param {Object} device - Device information
 * @returns {Promise<Object>} Result object
 */
const performPostRefresh = async (refreshToken, device) => {
    let session = null;

    try {
        
        // 1. VERIFY REFRESH TOKEN (Stateless Check)
        
        let decoded;
        try {
            decoded = verifyToken(refreshToken, Token.REFRESH);
        } catch (error) {
            // Log token verification failure
            logSystemEvent({
                eventType: SYSTEM_LOG_EVENTS.TOKEN_VERIFICATION_FAILED,
                action: 'TOKEN_VERIFY_FAILED',
                description: `Refresh token verification failed: ${error.message}`,
                status: STATUS_TYPES.WARNING,
                metadata: {
                    reason: error.message,
                    deviceUUID: device?.deviceUUID || 'unknown'
                }
            });
            
            return {
                success: false,
                type: AuthErrorTypes.INVALID_TOKEN,
                message: "Invalid or expired refresh token."
            };
        }

        const { uid: userId, did: deviceUUID } = decoded;

        if (!userId || !deviceUUID || device.deviceUUID !== deviceUUID) {
            // Log device mismatch
            logSystemEvent({
                eventType: SYSTEM_LOG_EVENTS.DEVICE_MISMATCH,
                action: 'DEVICE_MISMATCH_DETECTED',
                description: `Device UUID mismatch detected during post-refresh`,
                status: STATUS_TYPES.WARNING,
                targetId: userId || 'unknown',
                metadata: {
                    tokenDeviceUUID: deviceUUID,
                    requestDeviceUUID: device.deviceUUID
                }
            });
            
            return {
                success: false,
                type: AuthErrorTypes.INVALID_TOKEN,
                message: "Invalid token payload or device mismatch."
            };
        }
        
        // 2. START TRANSACTION
        
        session = await mongoose.startSession();
        session.startTransaction();
        
        // 3. VERIFY & RETRIEVE SESSION (With Lock)
        
        const userDevice = await UserDeviceModel.findOne({
            userId,
            deviceUUID: device.deviceUUID
        }).session(session);

        if (!userDevice) {
            await session.abortTransaction();
            
            // Log session not found
            logSystemEvent({
                eventType: SYSTEM_LOG_EVENTS.SESSION_NOT_FOUND,
                action: 'SESSION_NOT_FOUND',
                description: `User session not found for userId: ${userId}`,
                status: STATUS_TYPES.WARNING,
                targetId: userId,
                metadata: {
                    deviceUUID: device.deviceUUID
                }
            });
            
            return {
                success: false,
                type: AuthErrorTypes.SESSION_NOT_FOUND,
                message: "Session not found. Please login again."
            };
        }

        // Security Check: Token Mismatch (Reuse Attack)
        if (userDevice.refreshToken !== refreshToken) {
            await session.abortTransaction();
            
            // Log potential token reuse attack (CRITICAL SECURITY EVENT)
            logSystemEvent({
                eventType: SYSTEM_LOG_EVENTS.TOKEN_REUSE_DETECTED,
                action: 'TOKEN_REUSE_ATTACK',
                description: `🚨 SECURITY ALERT: Token reuse detected for userId: ${userId}`,
                status: STATUS_TYPES.ERROR,
                targetId: userId,
                metadata: {
                    deviceUUID: device.deviceUUID,
                    securityAlert: 'Potential token reuse attack detected'
                }
            });

            return {
                success: false,
                type: AuthErrorTypes.INVALID_TOKEN,
                message: "Refresh token mismatch (Security Alert)."
            };
        }
        
        // 4. GENERATE NEW TOKENS
        
        const newRefreshToken = createToken(userId, expiryTimeOfRefreshToken, device.deviceUUID);

        if (!refreshToken) {
            await session.abortTransaction();
            return {
                success: false,
                type: AuthErrorTypes.SERVER_ERROR,
                message: "Token generation failed."
            };
        }
        
        // 5. UPDATE DATABASE
        
        userDevice.refreshToken = newRefreshToken;
        userDevice.lastRefreshedAt = new Date();
        
        // Optional: Update token version if you use it for invalidation
        userDevice.tokenVersion = (userDevice.tokenVersion || 0) + 1;
        
        await userDevice.save({ session });

        // --------------------------------------------------
        // ✅ ACCESS TOKEN
        // --------------------------------------------------
        const accessToken = createToken(
            userId,
            expiryTimeOfAccessToken,
            device.deviceUUID
        );
        
        // 6. COMMIT TRANSACTION
        
        await session.commitTransaction();
        session.endSession(); // End session immediately after commit
        
        // 7. EXTERNAL SYSTEMS (Redis & Audit) - Post Commit
             
        // A. Rotate Session in Redis (Microservice Mode)
        // We use the helper similar to 'storeAuthSession'
        try {
            await rotateAuthSession(
                userId, 
                device.deviceUUID, 
                newRefreshToken
            );
        } catch (redisError) {
            logWithTime(`⚠️ Redis rotation failed but DB succeeded: ${redisError.message}`);
            // We do NOT fail the request here because DB is already updated.
        }

        // B. Log System Event
        logSystemEvent({
            eventType: SYSTEM_LOG_EVENTS.TOKEN_REFRESH,
            action: 'TOKEN_REFRESH_SUCCESS',
            description: `Successfully refreshed tokens for user`,
            status: STATUS_TYPES.SUCCESS,
            targetId: userId,
            metadata: {
                deviceUUID: device.deviceUUID,
                tokenVersion: userDevice.tokenVersion
            }
        });

        logWithTime(`✅ Tokens refreshed for User (${userId}) on Device (${device.deviceUUID})`);
 
        // 8. RETURN SUCCESS
        
        return {
            success: true,
            userId: userId,
            accessToken: accessToken
        };

    } catch (error) {
        // Catch-all for transaction errors
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }

        logWithTime(`❌ Post-refresh fatal error: ${error.message}`);
        
        // Log system error
        logSystemEvent({
            eventType: SYSTEM_LOG_EVENTS.SYSTEM_ERROR,
            action: 'POST_REFRESH_ERROR',
            description: `Fatal error during token refresh: ${error.message}`,
            status: STATUS_TYPES.ERROR,
            metadata: {
                error: error.message,
                stack: error.stack
            }
        });
        
        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "Internal server error during token refresh."
        };
    }
};

module.exports = { performPostRefresh };