module.exports = {
  expiryTimeOfAccessToken: Number(process.env.ACCESS_TOKEN_EXPIRY),
  expiryTimeOfRefreshToken: Number(process.env.REFRESH_TOKEN_EXPIRY),
  secretCodeOfAccessToken: process.env.ACCESS_TOKEN_SECRET_CODE,
  secretCodeOfRefreshToken: process.env.REFRESH_TOKEN_SECRET_CODE,
  expiryTimeOfResetToken: Number(process.env.RESET_TOKEN_EXPIRY),
  expiryTimeOfVerificationToken: Number(process.env.VERIFICATION_TOKEN_EXPIRY)
};
