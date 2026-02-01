const { accountVerificationSuccessResponses } = require("@/responses/success/account-verification.response");
const { authSuccessResponses } = require("@/responses/success/auth.response");
const { accountManagementSuccessResponses } = require("@/responses/success/account-management.response");
const { passwordManagementSuccessResponses } = require("./password-management.response");
const { internalsSuccessResponses } = require("./internals.response");

const successResponses = {
    ...accountVerificationSuccessResponses,
    ...authSuccessResponses,
    ...accountManagementSuccessResponses,
    ...passwordManagementSuccessResponses,
    ...internalsSuccessResponses
};

module.exports = {
    ...successResponses
};