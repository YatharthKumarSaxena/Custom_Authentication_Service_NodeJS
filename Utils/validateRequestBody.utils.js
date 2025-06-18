const validateSingleIdentifier = (req,res) => {
    const identifiers = [req.body.phoneNumber, req.body.emailID, req.body.userID].filter(Boolean);
    if (identifiers.length !== 1) {
        logWithTime(`🧷 Invalid input: More than one or no identifier provided for UserID: (${req.user.userID}) from device id: (${req.deviceID}).`);
        res.status(400).send({
            success: false,
            message: "❌ Provide exactly one identifier: userID, phoneNumber, or emailID."
        }) 
        return false;
    }
    logWithTime(`🧩 Valid identifier input detected for UserID: (${req.user.userID}) from device id: (${req.deviceID}).`);
    return true;
};

// ✅ SRP: This function only checks for existing users via phoneNumber or emailID
async function checkUserExists(emailID,phoneNumber){
    try{
        let count = 0;
        let user1 = await UserModel.findOne({phoneNumber: phoneNumber})
        let reason = "";
        if(user1){
            logWithTime("⚠️ User Already Exists with Phone Number: "+phoneNumber);
            reason = "Phone Number: "+phoneNumber;
            count++;
        }
        user1 = await UserModel.findOne({emailID: emailID});
        if(user1){
            logWithTime("⚠️ User Already Exists with Email ID: "+emailID);
            if(count)reason= "Phone Number: "+phoneNumber+" and Email ID: "+emailID;
            else reason = "Email ID: "+emailID;
            count++;
        }
        if(count!==0)logWithTime("⚠️ Invalid Registration");
        return reason;
    }catch(err){
        logWithTime(`❌ An Internal Error occurred reseting refresh token for phone number: (${phoneNumber}) and emailID: (${emailID}).`);
        errorMessage(err);
        throwInternalServerError(res);
        return "";
    }
}

// 📦 Utility to get a device from user's devices array by deviceID
const getDeviceByID = (user, deviceID) => {
    if (!user?.devices?.length) return null;
    return user.devices.find(d => d.deviceID === deviceID) || null;
};

module.exports = {
  validateSingleIdentifier: validateSingleIdentifier,
  checkUserExists: checkUserExists,
  getDeviceByID: getDeviceByID
}