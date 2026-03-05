/**
 * Internal Client Exports
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const adminPanelClient = require('./admin-panel.client');
const softwareManagementClient = require('./software-management.client');

module.exports = {
    adminPanelClient,
    softwareManagementClient
};