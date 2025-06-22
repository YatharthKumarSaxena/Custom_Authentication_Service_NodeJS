const { AUTH_BASE, ADMIN_BASE, USER_BASE } = require("../configs/uri.config");
const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const userRoutes = require("./user.routes"); 

module.exports = (app) => {
  app.use(AUTH_BASE, authRoutes);
  app.use(ADMIN_BASE, adminRoutes);
  app.use(USER_BASE, userRoutes);
};
