// utils/field-definition.util.js

const getRequiredFields = (definition) => {
  return Object.values(definition)
    .filter(fieldMeta => fieldMeta.required)
    .map(fieldMeta => fieldMeta.field);
};

const getValidationSet = (definition) => {
  return Object.values(definition).reduce((acc, fieldMeta) => {
    if (fieldMeta.validation) {
      acc[fieldMeta.field] = fieldMeta.validation;
    }
    return acc;
  }, {});
};

module.exports = {
  getRequiredFields,
  getValidationSet
};