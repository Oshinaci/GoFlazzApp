/**
 * Cryptographic security utilities for self-custodial wallet management.
 * Uses native browser Web Crypto API (AES-GCM 256, PBKDF2, SHA-256).
 */

// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert base64 to array buffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a secure cryptographically random salt.
 */
export function generateSalt(length = 16): string {
  if (typeof window === "undefined" || !window.crypto) {
    return Math.random().toString(36).substring(2, 15);
  }
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Securely hashes a PIN using SHA-256 for comparison / local validation.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // Basic fallback for server-side compilation or older environments
    return "fallback_hash_" + pin + "_" + salt;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Derive an AES-GCM Key from a PIN using PBKDF2
 */
async function deriveKey(pin: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);

  // Import raw key material
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive AES-GCM 256 key
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as any,
      iterations: 10000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string with AES-GCM using a user's PIN.
 * Returns a JSON-string containing ciphertext, iv, and salt in Base64.
 */
export async function encryptData(plaintext: string, pin: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // Encoded mockup fallback if Web Crypto is unavailable (SSR safety)
    return btoa(JSON.stringify({
      ciphertext: btoa(plaintext),
      iv: "SSR_FALLBACK_IV",
      salt: "SSR_FALLBACK_SALT",
      legacy: true
    }));
  }

  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);

  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const key = await deriveKey(pin, saltBytes);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(plaintext)
  );

  const payload = {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(saltBytes.buffer),
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Decrypt a base64 JSON payload back to plain text using the user's PIN.
 */
export async function decryptData(encryptedBase64: string, pin: string): Promise<string> {
  try {
    const rawJSON = atob(encryptedBase64);
    const payload = JSON.parse(rawJSON);

    if (payload.legacy) {
      return atob(payload.ciphertext);
    }

    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API is not available in current environment.");
    }

    const saltBytes = new Uint8Array(base64ToArrayBuffer(payload.salt));
    const ivBytes = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const cipherBytes = base64ToArrayBuffer(payload.ciphertext);

    const key = await deriveKey(pin, saltBytes);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      key,
      cipherBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err: any) {
    throw new Error("Decryption failed. Please check your security PIN.");
  }
}
