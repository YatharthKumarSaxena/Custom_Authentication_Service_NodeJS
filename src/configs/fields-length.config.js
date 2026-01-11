// 📁 configs/field-lengths.config.js

module.exports = {
  passwordLength: {
    min: 8,
    max: 64
  },
  countryCodeLength: {
    min: 1,
    max: 3
  },
  localNumberLength: {
    min: 9,
    max: 12
  },
  phoneNumberLength: {
    min: 11,
    max: 16 // E.164 max with '+' sign
  },
  emailLength: {
    min: 5,
    max: 254
  },
  deviceNameLength: {
    min: 3,
    max: 100
  },
  otpLength: {
    min: 6,
    max: 6
  },
  nameLength: {
    min: 2,
    max: 50
  }
};
