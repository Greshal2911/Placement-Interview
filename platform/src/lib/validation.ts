// Simple form validation utilities
export interface ValidationError {
  [key: string]: string;
}

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  return null;
};

export const validateLoginForm = (
  email: string,
  password: string,
): ValidationError => {
  const errors: ValidationError = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return errors;
};

export const validateRegisterForm = (
  email: string,
  name: string,
  password: string,
  confirmPassword: string,
): ValidationError => {
  const errors: ValidationError = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};
