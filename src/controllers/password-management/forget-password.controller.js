const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError } = require("@/utils/error-handler.util");
const { getUserContacts } = require("@utils/get-user-contacts.util");
const { generateVerificationForUser } = require("@utils/generate-verification.util");

/** 🔐 Handle Forget Password Request */
const handleForgetPassword = async (req, res) => {
    try {
        const foundUser = req.foundUser;

        // 1️⃣ Decide which contact methods to use
        const contacts = getUserContacts(foundUser);

        // 2️⃣ Generate verification (OTP / Link) for the purpose
        const verificationResult = await generateVerificationForUser(foundUser, "FORGOT_PASSWORD", req.deviceId);

        // 3️⃣ Collect response messages
        const responses = [];
        if (contacts.email && verificationResult.email) responses.push("Email sent");
        if (contacts.phone && verificationResult.phone) responses.push("Phone OTP sent");

        // 4️⃣ Final Response
        return res.status(200).json({
            success: true,
            message: `Password reset initiated. ${responses.join(" & ")} if applicable.`
        });

    } catch (err) {
        logWithTime(`❌ Internal Error occurred while processing forget password for User deviceId: (${req.deviceId})`);
        return throwInternalServerError(res, err);
    }
};

module.exports = {
    handleForgetPassword
};
