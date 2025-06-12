/*  
  ✅ This file handles the logic for User Activities in the backend.
  It follows key principles of SOLID and DRY along with usage of important Design Patterns like:
  - Factory Pattern
  - Template Method Pattern
  - Singleton Pattern (via Mongo Document logic)
*/

// Extracting the required modules
const {errorMessage,throwInternalServerError} = require("../Configs/message.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");

exports.provideUserDetails = async(req,res) => {
    try{
        const user = req.user;
        const displayUserDetails = {
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
        logWithTime(`✅ User Account Details with User ID: (${user.userID}) is provided Successfully to User`)
        return res.status(200).send({
            message: "Here is your User Account Details",
            displayUserDetails
        });
    }catch(err){
        logWithTime("⚠️ An Error Occurred while providing the User Details");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}