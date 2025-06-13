/*  
  ✅ This file handles the logic for User Activities in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const { errorMessage, throwInternalServerError, throwResourceNotFoundError } = require("../Configs/message.configs");
const { fetchUser } = require("../Middlewares/helperMiddlewares");
const { logWithTime } = require("../Utils/timeStamps.utils");
const { adminID } = require("../Configs/userID.config");

exports.provideUserDetails = async(req,res) => {
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
        // 🟨 Optional Fields Handling
        if(user.gender) {
            User_Account_Details["Gender"] = user.gender;
        }
        if(user.dateOfBirth) {
            const dob = new Date(user.dateOfBirth).toLocaleDateString("en-IN"); // DD/MM/YYYY format
            User_Account_Details["Date of Birth"] = dob;
        }
        if(user.profilePicUrl){
            User_Account_Details["ProfilePicUrl"] = user.profilePicUrl;
        }
        logWithTime(`✅ User Account Details with User ID: (${user.userID}) is provided Successfully to User`)
        return res.status(200).json({
            message: "Here is User Account Details",
            User_Account_Details
        });
    }catch(err){
        logWithTime("⚠️ An Error Occurred while providing the User Details");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

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
        if(req.body.dateOfBirth && !user.dateOfBirth || new Date(req.body.dateOfBirth).toISOString().slice(0, 10) !== user.dateOfBirth.toISOString().slice(0, 10)){
            updatedFields.push("Date of Birth");
            user.dateOfBirth = req.body.dateOfBirth;
        }
        if(req.body.gender && req.body.gender !== user.gender){
            updatedFields.push("Gender");
            user.gender = req.body.gender;
        }
        if(req.body.profilePicUrl && req.body.profilePicUrl !== user.profilePicUrl){
            updatedFields.push("Profile Picture");
            user.profilePicUrl = req.body.profilePicUrl;
        }
        if(req.body.address){
            if(req.body.address.localAddress && req.body.address.localAddress !== user.address.localAddress){
                updatedFields.push("Local Address in Address field");
                user.address.localAddress = req.body.address.localAddress;
            }
            if(req.body.address.city && req.body.address.city !== user.address.city){
                updatedFields.push("City in Address field");
                user.address.city = req.body.address.city;
            }
            if(req.body.address.pincode && req.body.address.pincode !== user.address.pincode){
                updatedFields.push("Pincode in Address field");
                user.address.pincode = req.body.address.pincode;
            }
            if(req.body.address.state && req.body.address.state !== user.address.state){
                updatedFields.push("State in Address field");
                user.address.state = req.body.address.state;
            }
            if(req.body.address.country && req.body.address.country !== user.address.country){
                updatedFields.push("Country in Address field");
                user.address.country = req.body.address.country;
            }
        }
        if(updatedFields.length === 0){
            return res.status(200).json({
                message: "No changes detected. Your profile remains the same."
            });
        }
        await user.save();
        return res.status(200).json({
            message: "Profile updated successfully.",
            updatedFields
        });
    }catch(err){
        logWithTime("⚠️ An Error Occurred while updating the User Profile");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}