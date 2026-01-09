module.exports = {
  SALT: Number(process.env.SALT),
  usersPerDevice: 5,
  deviceThreshold: {
    ADMIN: 2,
    CUSTOMERS: 5
  }
};
