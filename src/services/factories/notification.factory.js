// src/services/factories/notification.factory.js

const { getFrontendUrl } = require("@utils/url.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { VerifyMode } = require("@configs/enums.config");
const { errorMessage } = require("@utils/error-handler.util"); // Path fix kar lena

const SendNotificationFactory = async(user, contactMode, token, type, emailTemplate, smsTemplate, middleUri) => {
    try {
        let frontendUrl = null;
        let data = { name: user.firstName || "User" };
        
        if (!token) token = null;

        // --- PREPARE DATA FOR TEMPLATE ---
        if (token) {
            if (type === VerifyMode.LINK) {
                frontendUrl = getFrontendUrl(middleUri, { token });
                data.link = frontendUrl;
                data.frontendUrl = frontendUrl;
            }
            data.otp = token; // OTP or Link token
        }

        // --- GET USER CONTACTS ---
        const contactInfo = {
            email: user.email || null,
            phone: user.phone || null,
            contactMode: contactMode
        };

        // --- DISPATCH (Await for confirmation) ---
        const result = await sendNotification({
            contactInfo,
            emailTemplate,
            smsTemplate,
            data
        });
        
        return result.success; // Return true/false based on actual send status

    } catch (err) {
        logWithTime("ERROR", `Notification Factory Failed: ${err.message}`);
        errorMessage(err); 
        return false;
    }
};

module.exports = { SendNotificationFactory };