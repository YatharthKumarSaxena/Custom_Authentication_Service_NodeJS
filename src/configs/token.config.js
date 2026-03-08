const { getMyEnvAsNumber, getMyEnv } = require("@/utils/env.util");

module.exports = {
  expiryTimeOfAccessToken: getMyEnvAsNumber("ACCESS_TOKEN_EXPIRY", 3600),
  expiryTimeOfRefreshToken: getMyEnvAsNumber("REFRESH_TOKEN_EXPIRY", 86400),
  secretCodeOfAccessToken: getMyEnv("ACCESS_TOKEN_SECRET_CODE"),
  secretCodeOfRefreshToken: getMyEnv("REFRESH_TOKEN_SECRET_CODE"),
  expiryTimeOfResetToken: getMyEnvAsNumber("RESET_TOKEN_EXPIRY", 3600),
  expiryTimeOfVerificationToken: getMyEnvAsNumber("VERIFICATION_TOKEN_EXPIRY", 3600),
  
  // JWT Payload Structure - Required fields for token validation
  // Supports both old (uid, did) and new (id, adminId, deviceId) naming
  tokenPayloads: ["uid", "did", "exp", "iat"]
};
