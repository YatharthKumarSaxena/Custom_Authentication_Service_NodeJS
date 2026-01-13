const { activateMyAccount } = require("./activate-my-account.controller");
const { deactivateMyAccount } = require("./deactivate-my-account.controller");
const { updateMyAccount } = require("./update-my-account.controller");
const { enable2FA } = require("./enable-2fa.controller");
const { disable2FA } = require("./disable-2fa.controller");

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