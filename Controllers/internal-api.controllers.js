// controllers/internal-api.controllers.js

const { logWithTime } = require("../utils/time-stamps.utils");
const { setRefreshTokenCookie } = require("../utils/cookie-manager.utils");
const { throwInternalServerError, errorMessage, throwInvalidResourceError, throwResourceNotFoundError, getLogIdentifiers } =  require("../configs/error-handler.configs");
const { emailRegex, nameRegex, countryCodeRegex, numberRegex} = require("../configs/regex.config");
const { logAuthEvent } = require("../utils/auth-log-utils");
const { OK } = require("../configs/http-status.config");
const { validateLength, isValidRegex } = require("../utils/field-validators");
const { createFullPhoneNumber,  checkAndAbortIfUserExists } = require("../utils/auth.utils");
const { nameLength, emailLength, countryCodeLength, phoneNumberLength} = require("../configs/fields-length.config");
const UserModel = require("../models/user.model");

const updateUserProfile = async(req,res) => {
    try{
        let updatedFields = [];
        const user = req.user;
        if(req.body.name && req.body.name !== user.name){
            const name = req.body.name.trim();
            if(!validateLength(name,nameLength.min,nameLength.max)){
              logWithTime(`Invalid Name Length provided by ${req.user.userID} to update name`);
              return throwInvalidResourceError(res,`Name. Name must be between ${nameLength.min} and ${nameLength.max} characters.`);
            }
            if(!isValidRegex(name,nameRegex)){
              logWithTime(`Invalid Name Format provided by ${req.user.userID} to update name`);
              return throwInvalidResourceError(res,"Name. Name can only include letters, spaces, apostrophes ('), periods (.), and hyphens (-).");
            }
            updatedFields.push("Name");
            user.name = name;
        }
        if(req.body.emailID && req.body.emailID.trim().toLowerCase() !== user.emailID.trim().toLowerCase()){
            const emailID = req.body.emailID.trim().toLowerCase();
            if (!validateLength(emailID,emailLength.min,emailLength.max)) {
              logWithTime(`Invalid Email ID Length provided by ${req.user.userID} to update email ID`);
              return throwInvalidResourceError(res, `Email ID, Email ID must be at least ${emailLength.min} characters long and not more than ${emailLength.max} characters`);
            }
            if(!isValidRegex(emailID,emailRegex)){
              logWithTime(`Invalid Email ID Format provided by ${req.user.userID} to update email ID`);
              return throwInvalidResourceError(res, "Email ID format. Email ID should have:- 🔹 Have no spaces,🔹 Contain exactly one @,🔹 Include a valid domain like .com, .in, etc.");
            }      
            // Checking User already exists or not 
            const userExist = await checkAndAbortIfUserExists(emailID,user.fullPhoneNumber,res);
            if(userExist)return;
            updatedFields.push("Email ID");
            user.emailID = emailID;
        }
        const phoneNumber = req.body.phoneNumber;
        if(phoneNumber && phoneNumber !== user.phoneNumber){
          let { countryCode,number } = phoneNumber;
          if(countryCode && countryCode.trim() !== user.phoneNumber.countryCode){
            countryCode = countryCode.trim();
            if(!validateLength(countryCode,countryCodeLength.min,countryCodeLength.max)){
              logWithTime(`Invalid Country Code Length provided by ${req.user.userID} to update number in phone number`);
              return throwInvalidResourceError(res, `Country Code length, Country Code length must be at least ${countryCodeLength.min} digits long and not more than ${countryCodeLength.max} digits`);
            }
            if(!isValidRegex(countryCode,countryCodeRegex)){
              logWithTime(`Invalid Country Code Format provided by ${req.user.userID} to update Country Code in phone number`);
              return throwInvalidResourceError(
                res,
                `Country Code Format, Please enter a valid international country code number not starting from 0 and consist only numeric digits (e.g., 1 || 91 || 78)`,
              );
            }
            updatedFields.push("Country Code in Phone Number");
            user.phoneNumber.countryCode = countryCode;
          }
          if(number && number.trim() !== user.phoneNumber.number){ 
            number = number.trim();
            if(!validateLength(number,phoneNumberLength.min,phoneNumberLength.max)){
              logWithTime(`Invalid Number Length provided by ${req.user.userID} to update number in phone number`);
              return throwInvalidResourceError(res, `Number, Number must be at least ${phoneNumberLength.min} digits long and not more than ${phoneNumberLength.max} digits`);
            }
            if(!isValidRegex(number,numberRegex)){
              logWithTime(`Invalid Number Format provided by ${req.user.userID} to update number in Phone Number`);
              return throwInvalidResourceError(
                res,
                "Phone Number Format, Please enter a valid phone number that consist of only numeric digits .",
              );
            }
            updatedFields.push("Number in Phone Number");
            user.phoneNumber.number = number;
          }
          if(!(!number || !countryCode)){
            if(!number)number = user.phoneNumber.number;
            if(!countryCode)countryCode = user.phoneNumber.countryCode;
            const newNumber = createFullPhoneNumber(req,res);
            if(!newNumber)return;
            // Checking User already exists or not 
            const userExist = await checkAndAbortIfUserExists(user.emailID,newNumber,res);
            if(userExist)return;
            user.fullPhoneNumber = newNumber;
          }
        }
        if(updatedFields.length === 0){
            logWithTime(`❌ User Account Details with User ID: (${user.userID}) is not modified from device ID: (${req.deviceID}) in Updation Request`);
            return res.status(OK).json({
                message: "No changes detected. Your profile remains the same."
            });
        }
        await user.save();
        // Update data into auth.logs
        await logAuthEvent(req, "UPDATE_ACCOUNT_DETAILS", null);
        logWithTime(`✅ User (${user.userID}) updated fields: [${updatedFields.join(", ")}] from device: (${req.deviceID})`);
        return res.status(OK).json({
            success: true,
            message: "Profile updated successfully.",
            updatedFields
        });
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while updating the User Profile ${getIdentifiers}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const setRefreshCookieForAdmin = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;
    if (!refreshToken) {
      return throwResourceNotFoundError(res,"Refresh Token");
    }

    const isCookieSet = setRefreshTokenCookie(res, refreshToken);
    if(!isCookieSet){
      logWithTime(`❌ An Internal Error Occurred in setting refresh token for user (${user.userID}) at the time of set up admin cookie internal api. Request is made from device ID: (${req.deviceID})`);
      return;
    }

    // Update data into auth.logs
    await logAuthEvent(req, "SET_REFRESH_TOKEN_FOR_ADMIN", null);

    return res.status(OK).json({
      success: true,
      message: "✅ Admin refresh token set in cookie successfully."
    });
  } catch (err) {
    logWithTime("💥 Error while setting admin refresh cookie");
    errorMessage(err);
    return throwInternalServerError(res);
  }
};

// 📦 Controller to Get Total Registered Users (Admins + Customers)
const getTotalRegisteredUsers = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments({});
    const totalAdmins = await UserModel.countDocuments({ userType: "ADMIN" });
    const totalCustomers = totalUsers - totalAdmins;

    logWithTime(`📊 Total Users: ${totalUsers}, Admins: ${totalAdmins}, Customers: ${totalCustomers}`);
        
    // Update data into auth.logs
    await logAuthEvent(req, "GET_TOTAL_REGISTERED_USERS", null);

    return res.status(OK).json({
      success: true,
      message: "Total registered users fetched successfully.",
      totalUsers: totalUsers,
      totalAdmins: totalAdmins,
      totalCustomers: totalCustomers
    });

  } catch (err) {
    const getIdentifiers = getLogIdentifiers(req);
    logWithTime(`❌ An Internal Error Occurred while fetching the Total Registered Users ${getIdentifiers}`);
    errorMessage(err);
    return throwInternalServerError(res);
  }
};

module.exports = {
    updateUserProfile: updateUserProfile,
    getTotalRegisteredUsers: getTotalRegisteredUsers,
    setRefreshCookieForAdmin: setRefreshCookieForAdmin
}