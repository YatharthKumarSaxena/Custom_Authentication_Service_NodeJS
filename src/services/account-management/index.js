const { activateAccountService } = require("./account-activation.service");
const { deactivateAccountService } = require("./account-deactivation.service");
const { hardDeleteAccountService } = require("./account-deletion.service");
const { updatePassword } = require("./change-password.service");
const { toggleTwoFactorService } = require("./two-factor.service");
const { updateAccountService } = require("./update-account.service");

module.exports = {
    activateAccountService,
    deactivateAccountService,
    hardDeleteAccountService,
    updatePassword,
    toggleTwoFactorService,
    updateAccountService
};
