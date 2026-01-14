const { activateMyAccount } = require("./activate-my-account.controller");
const { deactivateMyAccount } = require("./deactivate-my-account.controller");
const { updateMyAccount } = require("./update-my-account.controller");
const { enable2FA , disable2FA } = require("./two-factor.controller");

const accountManagementControllers = {
    activateMyAccount,
    deactivateMyAccount,
    updateMyAccount,
    enable2FA,
    disable2FA
};

module.exports = { 
    accountManagementControllers 
};