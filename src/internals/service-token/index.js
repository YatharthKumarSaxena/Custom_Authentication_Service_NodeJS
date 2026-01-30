/**
 * 📦 Service Token Module Exports
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

module.exports = {
    ...require('./token.generator'),
    ...require('./token.store'),
    ...require('./token.rotator')
};
