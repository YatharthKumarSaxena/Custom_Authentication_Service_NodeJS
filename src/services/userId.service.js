const { CounterModel } = require("@models/id-generator.model");
const { userRegistrationCapacity } = require("@configs/app-limits.config");
const { IP_Address_Code } = require("@configs/ip-address.config");
const { customerIdPrefix } = require("@configs/id-prefixes.config");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { logWithTime } = require("@utils/time-stamps.util");

const makeUserId = async () => {
    try {
        // Step 1: Atomic Update (Find & Increment OR Create & Set 1)
        // Upsert ensures document exists, new:true returns updated val
        const counter = await CounterModel.findOneAndUpdate(
            { _id: customerIdPrefix },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!counter) {
            logWithTime("🛑 Critical: Failed to generate or retrieve user counter.");
            return ""; 
        }

        const currentSeq = counter.seq;

        // Step 2: Check Capacity
        if (currentSeq > userRegistrationCapacity) {
            logWithTime("⚠️ Machine Capacity to Store User Data is full.");
            return "0"; 
        }

        // Step 3: ID Construction
        // Logic: Offset ID by Adding Capacity (e.g., 10000 + 1 = 10001) for fixed length
        const numericId = userRegistrationCapacity + currentSeq; 
        
        const identityCode = `${customerIdPrefix}${IP_Address_Code}`;
        const userId = `${identityCode}${numericId}`;

        return userId;

    } catch (err) {
        logWithTime("🛑 Error in makeUserId process");
        errorMessage(err);    
        return ""; 
    }
};

module.exports = {
    makeUserId
};