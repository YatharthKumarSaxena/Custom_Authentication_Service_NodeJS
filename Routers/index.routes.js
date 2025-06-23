const { AUTH_BASE, ADMIN_BASE, USER_BASE, INTERNAL_BASE } = require("../configs/uri.config");
const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const userRoutes = require("./user.routes"); 
const internalRoutes = require("./internal.routes");

module.exports = (app) => {
  app.use(AUTH_BASE, authRoutes);
  app.use(ADMIN_BASE, adminRoutes);
  app.use(USER_BASE, userRoutes);
  app.use(INTERNAL_BASE, internalRoutes); 
};
