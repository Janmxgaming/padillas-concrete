/**
 * Validation utilities for form inputs
 * Provides sanitization and validation functions
 */

/**
 * Sanitize text input by removing potential XSS vectors
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  // Remove all special characters that could be used for XSS
  // This is a comprehensive approach that removes all potential HTML injection vectors
  return text
    .replace(/[<>'"&]/g, '') // Remove HTML special characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate US phone number (various formats)
 * Accepts: (123) 456-7890, 123-456-7890, 1234567890, +1 123-456-7890
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's 10 or 11 digits (with country code)
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
};

/**
 * Validate name (must be at least 2 characters, only letters, spaces, hyphens)
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid
 */
export const isValidName = (name) => {
  if (!name) return false;
  const trimmed = name.trim();
  // At least 2 characters, only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,}$/;
  return nameRegex.test(trimmed);
};

/**
 * Validate message (must be at least 10 characters)
 * @param {string} message - Message to validate
 * @returns {boolean} True if valid
 */
export const isValidMessage = (message) => {
  if (!message) return false;
  return message.trim().length >= 10;
};

/**
 * Validate service selection
 * @param {string} service - Service to validate
 * @returns {boolean} True if valid
 */
export const isValidService = (service) => {
  if (!service) return false;
  const validServices = [
    'Patios',
    'Driveways',
    'Walkways',
    'Sidewalks',
    'Concrete Reinforced',
    'Stamped Concrete',
    'Other'
  ];
  return validServices.includes(service);
};

/**
 * Validate US ZIP code
 * @param {string} zip
 * @returns {boolean}
 */
export const isValidZip = (zip) => {
  if (!zip) return false;
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
};

/**
 * Validate all form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Object with isValid boolean and errors object
 */
export const validateFormData = (formData) => {
  const errors = {};

  if (!isValidName(formData.name)) {
    errors.name = 'validation.nameError';
  }

  if (!isValidEmail(formData.email)) {
    errors.email = 'validation.emailError';
  }

  if (!isValidPhone(formData.phone)) {
    errors.phone = 'validation.phoneError';
  }

  if (!isValidService(formData.service)) {
    errors.service = 'validation.serviceError';
  }

  if (!isValidMessage(formData.message)) {
    errors.message = 'validation.messageError';
  }

  if (!formData.street || formData.street.trim().length < 3) {
    errors.street = 'validation.streetError';
  }

  if (!formData.city || formData.city.trim().length < 2) {
    errors.city = 'validation.cityError';
  }

  if (!formData.state) {
    errors.state = 'validation.stateError';
  }

  if (!isValidZip(formData.zip)) {
    errors.zip = 'validation.zipError';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize all form data
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  return {
    name: sanitizeText(formData.name),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.trim(),
    service: formData.service,
    message: sanitizeText(formData.message),
    street: sanitizeText(formData.street),
    apt: sanitizeText(formData.apt || ''),
    city: sanitizeText(formData.city),
    state: (formData.state || '').trim(),
    zip: (formData.zip || '').trim(),
  };
};
