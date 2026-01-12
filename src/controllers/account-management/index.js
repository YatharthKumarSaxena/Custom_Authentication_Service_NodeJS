const { activateMyAccount } = require("./activate-my-account.controller");
const { deactivateMyAccount } = require("./deactivate-my-account.controller");
const { updateMyAccount } = require("./update-my-account.controller");

const accountManagementControllers = {
    activateMyAccount,
    deactivateMyAccount,
    updateMyAccount
};

module.exports = { 
    accountManagementControllers 
};