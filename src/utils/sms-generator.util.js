const { logWithTime } = require("./time-stamps.util");

/**
 * Generates Final SMS Message
 * @param {object} templateConfig - The specific SMS template object (e.g. userSmsTemplate.verification)
 * @param {string|null} otp - OTP to inject
 */

const generateSmsMessage = (templateConfig, otp = null) => {
    
    // 1. Validation: Agar config hi nahi di, to error
    if (!templateConfig) {
        // Log mat karo yahan, kyunki ho sakta hai service ne jaan-boojh kar null bheja ho
        return null;
    }

    let message = templateConfig.message;

    // 2. Logic: OTP Replacement
    if (otp) {
        message = message.replace("{{otp}}", otp);
    } 
    else if (message.includes("{{otp}}")) {
        logWithTime("WARNING", `SMS expects OTP but null provided.`);
        return null; 
    }

    // 3. App Name Replacement
    const appName = process.env.APP_NAME || "MyApp"; 
    message = message.replace("[App Name]", appName);

    return message;
};

module.exports = { generateSmsMessage };