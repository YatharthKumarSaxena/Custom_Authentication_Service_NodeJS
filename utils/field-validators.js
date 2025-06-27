function validateLength(str, min, max) {
  return str.length >= min && str.length <= max;
}
function isValidRegex(str, regex) {
  return regex.test(str);
}

module.exports = {
    validateLength: validateLength,
    isValidRegex: isValidRegex
}