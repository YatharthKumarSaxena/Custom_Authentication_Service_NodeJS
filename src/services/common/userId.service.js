const { CounterModel } = require("@models/id-generator.model");
const { userRegistrationCapacity } = require("@configs/app-limits.config");
const { IP_Address_Code } = require("@configs/ip-address.config");
const { userIdPrefix } = require("@configs/id-prefixes.config");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Generate user ID with custom prefix
 * @param {string} prefix - "ADM" for admin or "USR" for user
 * @returns {Promise<string>} Generated user ID or empty string on failure
 */
const makeUserIdWithPrefix = async (prefix = userIdPrefix) => {
    try {
        const counter = await CounterModel.findOneAndUpdate(
            { _id: prefix },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!counter) {
            logWithTime(`🛑 Critical: Failed to generate or retrieve counter for prefix ${prefix}.`);
            return "";
        }

        const currentSeq = counter.seq;

        // Check capacity
        if (currentSeq > userRegistrationCapacity) {
            logWithTime(`⚠️ Machine Capacity is full for prefix ${prefix}.`);
            return "0";
        }

        // ID Construction
        const numericId = userRegistrationCapacity + currentSeq;
        const identityCode = `${prefix}${IP_Address_Code}`;
        const userId = `${identityCode}${numericId}`;

        return userId;
    } catch (err) {
        logWithTime(`🛑 Error in makeUserIdWithPrefix for ${prefix}`);
        errorMessage(err);
        return "";
    }
};

module.exports = {
    makeUserIdWithPrefix
};