const { AuthModes, ContactModes } = require("@configs/enums.config");
const { createPhoneNumber } = require("./auth.util");
const { authMode } = require("@configs/security.config");

/**
 * Determine which contact methods to use based on auth mode and user data.
 * @param {Object} user - User object from DB
 * @param {string} authMode - Auth mode from config
 * @returns {Object} - { email: string|null, phone: string|null, mode: string }
 */

const getUserContacts = (user) => {
    let finalContactMode;
    let email = null;
    let phone = null;
    const userEmail = user.email;
    const userCountryCode = user.countryCode;
    const userLocalNumber = user.localNumber;

    if (authMode === AuthModes.EITHER) {
        if (userEmail) {
            finalContactMode = ContactModes.EMAIL;
            email = userEmail;
        } else if (userCountryCode && userLocalNumber) {
            finalContactMode = ContactModes.PHONE;
            phone = createPhoneNumber(userCountryCode, userLocalNumber);
        }
    } else if (authMode === AuthModes.BOTH) {
        finalContactMode = ContactModes.BOTH;
        email = userEmail;
        phone = createPhoneNumber(userCountryCode, userLocalNumber);
    } else if (authMode === AuthModes.EMAIL) {
        finalContactMode = ContactModes.EMAIL;
        email = userEmail;
    } else if (authMode === AuthModes.PHONE) {
        finalContactMode = ContactModes.PHONE;
        phone = createPhoneNumber(userCountryCode, userLocalNumber);
    }

    return {
        email,
        phone,
        contactMode: finalContactMode
    };
};

module.exports = {
    getUserContacts
};
