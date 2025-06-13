/*  
  ✅ This file handles the logic for User Activities in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const {errorMessage,throwInternalServerError} = require("../Configs/message.configs");
const { fetchUser } = require("../Middlewares/helperMiddlewares");
const { logWithTime } = require("../Utils/timeStamps.utils");

exports.provideUserDetails = async(req,res) => {
    try{
        // If Get Request has a User then We have to Extract its Details and give to the Admin
        let user = fetchUser(req,res);
        // This Will Execute if It is Normal Request Made By User to View their Account Details
        if(!user)user = req.user; 
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
        return res.status(200).send({
            message: "Here is User Account Details",
            User_Account_Details
        });
    }catch(err){
        logWithTime("⚠️ An Error Occurred while providing the User Details");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}