const {expiryTimeOfJWTtoken} = require("../Configs/userID.config");

// DRY Principle followed by this Code
const checkUserIsNotVerified = async(user) => {
    const tokenIssueTime = new Date(user.jwtTokenIssuedAt).getTime(); // In milli second current time is return
    const currentTime = Date.now(); // In milli second current time is return
    if(currentTime > tokenIssueTime + expiryTimeOfJWTtoken*1000){ // expiryTimeOfJWTtoken is in second multiplying by 1000 convert it in milliseconds
        user.isVerified = false;
        await user.save(); // 👈 Add this line
        return true; // 🧠 session expired, response already sent
    }
    return false; // ✅ token valid, continue execution
}

module.exports = {
    checkUserIsNotVerified: checkUserIsNotVerified
}