/**
 * Centralized validation utility for all admin forms
 * Single source of truth for validation rules and error messages
 */

export interface ValidationError {
  field: string;
  message: string;
  isValid: boolean;
}

// ============================================
// VALIDATION MESSAGES (Single Source of Truth)
// ============================================

export const VALIDATION_MESSAGES = {
  // Required fields
  required: (fieldName: string) => `${fieldName} is required.`,
  
  // Length validations
  minLength: (fieldName: string, min: number) => 
    `${fieldName} must be at least ${min} characters.`,
  maxLength: (fieldName: string, max: number) => 
    `${fieldName} must not exceed ${max} characters.`,
  
  // Format validations
  invalidEmail: "Please enter a valid email address.",
  invalidPhone: "Please enter a valid phone number.",
  invalidUrl: "Please enter a valid URL.",
  invalidHexColor: "Please enter a valid hex color (e.g., #FF5733).",
  
  // Numeric validations
  invalidNumber: (fieldName: string) => `${fieldName} must be a number.`,
  minValue: (fieldName: string, min: number) => 
    `${fieldName} must be at least ${min}.`,
  maxValue: (fieldName: string, max: number) => 
    `${fieldName} must not exceed ${max}.`,
  
  // Custom validations
  atLeastOne: (fieldName: string) => 
    `Please select at least one ${fieldName}.`,
  categoryRequired: "Please select a category.",
  colorRequired: "Please select at least a primary color.",
};

// ============================================
// VALIDATION RULES
// ============================================

/**
 * Check if a string field is empty or only whitespace
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Check minimum length
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Check maximum length
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic - at least 10 digits)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\d{10,}$/;
  const digitsOnly = phone.replace(/\D/g, "");
  return phoneRegex.test(digitsOnly);
};

/**
 * Validate hex color format
 */
export const validateHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate number
 */
export const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim().length > 0;
};

/**
 * Validate array/selection has at least one item
 */
export const validateAtLeastOne = (items: any[]): boolean => {
  return Array.isArray(items) && items.length > 0;
};

// ============================================
// COMPOSITE VALIDATORS (Combinations of rules)
// ============================================

/**
 * Validate category name (required, min 2 chars, max 50 chars)
 */
export const validateCategoryName = (value: string): ValidationError => {
  if (!validateRequired(value)) {
    return {
      field: "categoryName",
      message: VALIDATION_MESSAGES.required("Category name"),
      isValid: false,
    };
  }
  if (!validateMinLength(value, 2)) {
    return {
      field: "categoryName",
      message: VALIDATION_MESSAGES.minLength("Category name", 2),
      isValid: false,
    };
  }
  if (!validateMaxLength(value, 50)) {
    return {
      field: "categoryName",
      message: VALIDATION_MESSAGES.maxLength("Category name", 50),
      isValid: false,
    };
  }
  return {
    field: "categoryName",
    message: "",
    isValid: true,
  };
};

/**
 * Validate theme name (required, min 2 chars, max 100 chars)
 */
export const validateThemeName = (value: string): ValidationError => {
  if (!validateRequired(value)) {
    return {
      field: "themeName",
      message: VALIDATION_MESSAGES.required("Theme name"),
      isValid: false,
    };
  }
  if (!validateMinLength(value, 2)) {
    return {
      field: "themeName",
      message: VALIDATION_MESSAGES.minLength("Theme name", 2),
      isValid: false,
    };
  }
  if (!validateMaxLength(value, 100)) {
    return {
      field: "themeName",
      message: VALIDATION_MESSAGES.maxLength("Theme name", 100),
      isValid: false,
    };
  }
  return {
    field: "themeName",
    message: "",
    isValid: true,
  };
};

/**
 * Validate venue name (required, min 3 chars, max 150 chars)
 */
export const validateVenueName = (value: string): ValidationError => {
  if (!validateRequired(value)) {
    return {
      field: "venueName",
      message: VALIDATION_MESSAGES.required("Venue name"),
      isValid: false,
    };
  }
  if (!validateMinLength(value, 3)) {
    return {
      field: "venueName",
      message: VALIDATION_MESSAGES.minLength("Venue name", 3),
      isValid: false,
    };
  }
  if (!validateMaxLength(value, 150)) {
    return {
      field: "venueName",
      message: VALIDATION_MESSAGES.maxLength("Venue name", 150),
      isValid: false,
    };
  }
  return {
    field: "venueName",
    message: "",
    isValid: true,
  };
};

/**
 * Validate colors array (at least one color selected)
 */
export const validateColors = (colors: string[]): ValidationError => {
  if (!validateAtLeastOne(colors) || !colors[0]) {
    return {
      field: "colors",
      message: VALIDATION_MESSAGES.colorRequired,
      isValid: false,
    };
  }
  return {
    field: "colors",
    message: "",
    isValid: true,
  };
};

/**
 * Validate email field
 */
export const validateEmailField = (value: string): ValidationError => {
  if (!validateRequired(value)) {
    return {
      field: "email",
      message: VALIDATION_MESSAGES.required("Email"),
      isValid: false,
    };
  }
  if (!validateEmail(value)) {
    return {
      field: "email",
      message: VALIDATION_MESSAGES.invalidEmail,
      isValid: false,
    };
  }
  return {
    field: "email",
    message: "",
    isValid: true,
  };
};

/**
 * Validate phone field
 */
export const validatePhoneField = (value: string): ValidationError => {
  if (!validateRequired(value)) {
    return {
      field: "phone",
      message: VALIDATION_MESSAGES.required("Phone number"),
      isValid: false,
    };
  }
  if (!validatePhone(value)) {
    return {
      field: "phone",
      message: VALIDATION_MESSAGES.invalidPhone,
      isValid: false,
    };
  }
  return {
    field: "phone",
    message: "",
    isValid: true,
  };
};
