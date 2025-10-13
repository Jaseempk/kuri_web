/**
 * UPI Payment utility functions for generating deeplinks
 */

export interface UPIDeeplinkParams {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
}

/**
 * Generate UPI deeplink for payment
 * @param params UPI payment parameters
 * @returns UPI deeplink string
 */
export const generateUPIDeeplink = (params: UPIDeeplinkParams): string => {
  const { upiId, payeeName, amount, transactionNote } = params;

  // Construct UPI URL with proper encoding
  const upiUrl = new URL('upi://pay');
  upiUrl.searchParams.set('pa', upiId); // Payee address
  upiUrl.searchParams.set('pn', payeeName); // Payee name
  upiUrl.searchParams.set('am', amount.toString()); // Amount
  upiUrl.searchParams.set('cu', 'INR'); // Currency
  upiUrl.searchParams.set('tn', transactionNote); // Transaction note

  return upiUrl.toString();
};

/**
 * Open UPI app with payment details
 * @param upiLink UPI deeplink
 */
export const openUPIApp = (upiLink: string): void => {
  try {
    // For mobile web
    window.location.href = upiLink;
  } catch (error) {
    console.error('Failed to open UPI app:', error);
    throw new Error('Failed to open UPI app. Please ensure you have a UPI app installed.');
  }
};

/**
 * Generate transaction note with user identifier for reconciliation
 * @param username User's username
 * @param timestamp Optional timestamp
 * @returns Transaction note string
 */
export const generateTransactionNote = (username: string, timestamp?: number): string => {
  const ts = timestamp || Date.now();
  return `Kuri deposit by @${username} - ${ts}`;
};

/**
 * Validate UPI amount (must be positive and not exceed limits)
 * @param amount Amount in INR
 * @returns boolean
 */
export const validateUPIAmount = (amount: number): { valid: boolean; error?: string } => {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (amount < 10) {
    return { valid: false, error: 'Minimum amount is ₹10' };
  }

  if (amount > 100000) {
    return { valid: false, error: 'Maximum amount is ₹1,00,000 per transaction' };
  }

  return { valid: true };
};
