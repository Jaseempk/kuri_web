// Generate a secure random token
export const generateCsrfToken = (): string => {
  return crypto.randomUUID();
};

// Store the token in a secure httpOnly cookie
export const setCsrfToken = (): string => {
  const token = generateCsrfToken();
  document.cookie = `csrf-token=${token}; path=/; secure; samesite=strict`;
  return token;
};

// Get the stored CSRF token
export const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
};

// Validate that the token matches
export const validateCsrfToken = (token: string): boolean => {
  const storedToken = getCsrfToken();
  return storedToken === token;
};
