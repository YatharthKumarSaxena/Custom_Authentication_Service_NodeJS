const { OK } = require("@configs/http-status.config");
const { getAccountDetailsService } = require("@services/auth/account-details.service");
const {
    throwInternalServerError,
    throwSpecificInternalServerError,
    getLogIdentifiers
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const getMyAccount = async (req, res) => {
    try {
        const user = req.user;

        // 1. Service Call
        const userAccountDetails = await getAccountDetailsService(user);

        if (!userAccountDetails) {
            logWithTime(`❌ Failed to fetch account details for User ${user.userId} from device ${device.deviceUUID}`);
            throwSpecificInternalServerError(res, "Failed to fetch account details. Please try again later.");
        }

        // 2. Response
        return res.status(OK).json({
            success: true,
            message: "Account details fetched successfully.",
            data: userAccountDetails
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error fetching account details for ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { getMyAccount };
