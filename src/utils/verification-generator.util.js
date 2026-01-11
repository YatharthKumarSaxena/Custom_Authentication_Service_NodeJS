const { VerifyMode } = require("@configs/enums.config");
const { verificationMode } = require("@configs/security.config");
const { generateLinkToken, hashLinkToken } = require("./link.util");
const { generateOTP, hashOTP } = require("./otp.util");
const { logWithTime } = require("./time-stamps.util")
const { VerificationLinkModel } = require("@models/link.model");
const { OTPModel } = require("@models/otp.model");

const generateVerificationForUser = async (user, deviceId, purpose, contactMode, maxAttempts) => {
  try {
    let verify;
    if (verificationMode === VerifyMode.LINK) {
      verify = generateLinkToken();
      verifyHash = hashLinkToken(verify);
      // Create Link Model
      await VerificationLinkModel.create({
        userId: user._id, // Assuming user object is a Mongoose doc
        deviceId: deviceId,
        contact: contactMode,
        purpose: purpose,
        tokenHash: tokenHash,
        salt: salt,
        isUsed: false
      });
      return generateVerificationLink(user, deviceId, purpose);
    } else if (verificationMode === VerifyMode.OTP) {
      // Generate OTP
      verify = generateOTP();
      verifyHash = hashOTP(verify);
      // Create OTP Model
      await OTPModel.create({
        userId: user._id, // Assuming user object is a Mongoose doc
        deviceId: deviceId,
        contact: contactMode,
        purpose: purpose,
        otpHash: otpHash,
        salt: salt,
        maxAttempts: maxAttempts,
        isUsed: false
      });
      return generateOTP(user, deviceId, purpose);
    } else {
      throw new Error("Invalid verification mode configured.");
    }
  } catch (err) {
    logWithTime(`❌ Error generating verification for user: ${user.userId}`);
    errorMessage(err);
    return null;
  }
};

module.exports = {
  generateVerificationForUser
};