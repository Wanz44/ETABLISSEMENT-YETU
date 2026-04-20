/**
 * Utility for basic encryption/decryption of sensitive data in local storage.
 * In a real production environment, this should use Web Crypto API with persistent keys,
 * but for this local-first application, it provides a layer of obfuscation for PII.
 */

const SECRET_KEY = 'yetu-admin-security-layer';

export const cryptoUtils = {
  /**
   * Simple XOR encryption with base64 encoding
   */
  encrypt: (text: string): string => {
    if (!text) return '';
    const textChars = text.split('');
    const keyChars = SECRET_KEY.split('');
    const encrypted = textChars.map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ keyChars[i % keyChars.length].charCodeAt(0));
    });
    return btoa(encrypted.join(''));
  },

  /**
   * Simple XOR decryption with base64 decoding
   */
  decrypt: (encoded: string): string => {
    if (!encoded) return '';
    try {
      const text = atob(encoded);
      const textChars = text.split('');
      const keyChars = SECRET_KEY.split('');
      const decrypted = textChars.map((c, i) => {
        return String.fromCharCode(c.charCodeAt(0) ^ keyChars[i % keyChars.length].charCodeAt(0));
      });
      return decrypted.join('');
    } catch (e) {
      return encoded; // Fallback to raw if not valid base64
    }
  }
};
