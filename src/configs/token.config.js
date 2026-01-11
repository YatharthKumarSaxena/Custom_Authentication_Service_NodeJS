module.exports = {
  refreshThresholdInMs: Number(process.env.REFRESH_THRESHOLD_IN_MS) || 2 * 24 * 60 * 60 * 1000,
  expiryTimeOfAccessToken: Number(process.env.ACCESS_TOKEN_EXPIRY),
  expiryTimeOfRefreshToken: Number(process.env.REFRESH_TOKEN_EXPIRY),
  secretCodeOfAccessToken: process.env.ACCESS_TOKEN_SECRET_CODE,
  secretCodeOfRefreshToken: process.env.REFRESH_TOKEN_SECRET_CODE,
  expiryTimeOfResetToken: Number(process.env.RESET_TOKEN_EXPIRY),
  expiryTimeOfVerificationToken: Number(process.env.VERIFICATION_TOKEN_EXPIRY)
};
