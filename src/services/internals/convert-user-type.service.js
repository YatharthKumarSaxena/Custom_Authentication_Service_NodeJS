const { UserModel } = require("@models/user.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { AuthErrorTypes, UserTypes } = require("@configs/enums.config");

/**
 * Service to convert/update user type
 * @param {String} userId - The ID of the user whose type needs to be updated
 * @param {String} userType - The new user type (USER, CLIENT, ADMIN)
 */
const convertUserTypeService = async (userId, userType) => {
    
    // 1. Validate userType
    if (!Object.values(UserTypes).includes(userType)) {
        return { 
            success: false,
            type: AuthErrorTypes.VALIDATION_ERROR, 
            message: `Invalid user type. Allowed values: ${Object.values(UserTypes).join(', ')}` 
        };
    }

    // 2. Find the User
    const user = await UserModel.findOne({ userId }).lean();

    if (!user) {
        return {
            success: false, 
            type: AuthErrorTypes.RESOURCE_NOT_FOUND, 
            message: `User with ID ${userId} not found.` 
        };
    }

    // 3. Check if user already has the same type
    if (user.userType === userType) {
        return {
            success: false,
            message: `User already has type: ${userType}`
        };
    }

    const oldUserType = user.userType;

    // 4. Update User Type (Atomic Operation)
    await UserModel.updateOne(
        { _id: user._id },
        { $set: { userType } }
    );

    logWithTime(`✅ User (${userId}) type converted from ${oldUserType} to ${userType}`);

    return {
        success: true,
        message: `User type successfully updated from ${oldUserType} to ${userType}`,
        oldUserType,
        newUserType: userType
    };
};

module.exports = { convertUserTypeService };
