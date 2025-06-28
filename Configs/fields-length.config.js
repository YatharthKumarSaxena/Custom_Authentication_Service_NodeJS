// 📁 configs/field-lengths.config.js

module.exports = {
  nameLength: {
    min: 2,
    max: 50
  },
  passwordLength: {
    min: 8,
    max: 64
  },
  countryCodeLength: {
    min: 1,
    max: 3
  },
  phoneNumberLength: {
    min: 9,
    max: 12
  },
  fullPhoneNumberLength: {
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
  }
};
