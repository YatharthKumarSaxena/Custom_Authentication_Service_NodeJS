module.exports = {
    UUID_V4_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    strongPasswordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^ ]{8,}$/,
    countryCodeRegex: /^[1-9]\d{0,2}$/,
    numberRegex: /^\d{9,12}$/,
    fullPhoneNumberRegex: /^\+([1-9]\d{0,2})(\d{9,12})$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    nameRegex: /^[a-zA-Z\s.'-]{2,50}$/
}