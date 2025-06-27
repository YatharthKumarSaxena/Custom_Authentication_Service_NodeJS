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
    min: 2, // '+1' or '+91'
    max: 4
  },
  phoneNumberLength: {
    min: 9,
    max: 12
  },
  fullPhoneNumberLength: {
    min: 11,
    max: 16 // E.164 max with '+' sign
  }
};
