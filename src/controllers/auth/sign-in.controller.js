// Extracting the required modules
const { expiryTimeOfAccessToken } = require("@configs/token.config");
const { UserModel } = require("@models/user.model");
const { throwInvalidResourceError, errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { makeTokenWithMongoID } = require("@utils/issue-token.util");
const { checkPasswordIsValid } = require("@utils/auth.util");
const { signInWithToken } = require("@services/token.service");
const { createDeviceField, getDeviceByID, checkDeviceThreshold, checkUserDeviceLimit } = require("@utils/device.util");
const { setAccessTokenHeaders } = require("@utils/token-headers.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { setRefreshTokenCookie } = require("@utils/cookie-manager.util");
const { BAD_REQUEST, OK } = require("@configs/http-status.config");

/* Logic to Login the Registered User */
const signIn = async (req,res) => {
    try{
        let user = req.foundUser;
        if(!user){
            const userID =  req?.foundUserID || req?.user?.userID || req?.body?.userID;
            user = await UserModel.findOne({userID: userID});
            if(!user){
                return throwInvalidResourceError(res,"UserID");
            }
            req.foundUser = user;
        }
        user = req.foundUser;
        // ✅ Now Check if User is Already Logged In
        await checkUserIsNotVerified(req,res);
        let device = await getDeviceByID(user,req.deviceID);
        req.foundUser = user;
        if(device){
            device.lastUsedAt = Date.now();
            await user.save();
            logWithTime(`⚠️ Access Denied: User with userID: ${user.userID} attempted to login on same device id ${req.deviceID}`);
            return res.status(BAD_REQUEST).json({
                success: false,
                message: "User is already logged in.",
                suggestion: "Please logout first before trying to login again."
            });
        };
        const isThresholdCrossed = (await checkDeviceThreshold(req.deviceID,res) || checkUserDeviceLimit(req,res));
        if(isThresholdCrossed)return;
        device = createDeviceField(req,res);
        if(!device){
            logWithTime(`❌ Device creation failed for User ${user.userID} for device id: ${req.deviceID} at the time of Sign In Request`);
            return throwInternalServerError(res);
        }
        // Check Password is Correct or Not
        let isPasswordValid = await checkPasswordIsValid(req,user);
        if(isPasswordValid){ // Login the User
            // Sign with JWT Token
            const refreshToken = await signInWithToken(req,res);
            if (refreshToken === "") {
                logWithTime(`❌ Refresh token generation failed during login of User with userID: ${user.userID} from device id: ${req.deviceID}`);
                return throwInternalServerError(res);
            }
            const isCookieSet = setRefreshTokenCookie(res,refreshToken);
            if(!isCookieSet){
                logWithTime(`❌ An Internal Error Occurred in setting refresh token for user ${user.userID} at the time of Login. Request is made from device ID: ${req.deviceID}`);
                return;
            }
            user.jwtTokenIssuedAt = Date.now();
            const isUserLoggedIn = await loginTheUser(user,refreshToken,device,res);
            if(!isUserLoggedIn){
                logWithTime(`❌ An Internal Error Occurred in logging in the user ${user.userID} at the time of login request. Request is made from device ID: ${req.deviceID}`);
                return;
            }
            // Update data into auth.logs
            logAuthEvent(req, "LOGIN", null);
            const accessToken = await makeTokenWithMongoID(req,res,expiryTimeOfAccessToken);
            if(!accessToken){
                logWithTime(`❌ Access token creation failed for User ${user.userID} at the time of sign up request. Request is made from device id: ${req.deviceID}`);
                return throwInternalServerError(res);
            }
            const isAccessTokenSet = setAccessTokenHeaders(res,accessToken);
            if(!isAccessTokenSet){
                logWithTime(`❌ Access token set in header failed for User ${user.userID} at the time of sign in request. Request is made from device id: ${req.deviceID}`);
                return throwInternalServerError(res);
            }
            logWithTime(`🔐 User with ${user.userID} is Successfully logged in from device id: ${req.deviceID}`);
            const praiseBy = user.name || user.userID;
            return res.status(OK).json({
                success: true,
                message: "Welcome "+praiseBy+", You are successfully logged in",
            })
        }
        else{
            logWithTime(`❌ Incorrect Password provided by User with userID: ${user.userID} for Login Purpose from device id: ${req.deviceID}`);
            return throwInvalidResourceError(res,"Password");
        }
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while logging in the User ${getIdentifiers}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }  
}

module.exports = { 
    signIn
}