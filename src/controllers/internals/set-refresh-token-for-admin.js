

const setRefreshCookieForAdmin = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;
    if (!refreshToken) {
      return throwResourceNotFoundError(res,"Refresh Token");
    }

    const isCookieSet = setRefreshTokenCookie(res, refreshToken);
    if(!isCookieSet){
      logWithTime(`❌ An Internal Error Occurred in setting refresh token for user (${user.userID}) at the time of set up admin cookie internal api. Request is made from device ID: (${req.deviceID})`);
      return;
    }

    // Update data into auth.logs
    logAuthEvent(req, "SET_REFRESH_TOKEN_FOR_ADMIN", null);

    return res.status(OK).json({
      success: true,
      message: "✅ Admin refresh token set in cookie successfully."
    });
  } catch (err) {
    logWithTime("💥 Error while setting admin refresh cookie");
    errorMessage(err);
    return throwInternalServerError(res);
  }
};
