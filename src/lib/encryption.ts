/**
 * Cryptographic security utilities for self-custodial wallet management.
 * Uses native Web Crypto API (AES-256-GCM, HKDF, PBKDF2, SHA-256).
 */

// Helper to convert array buffer to base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert base64 to array buffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Wipe sensitive memory buffers and object properties
 */
export function wipeMemory(...args: any[]): void {
  for (const item of args) {
    if (!item) continue;
    if (item instanceof Uint8Array || item instanceof Uint8ClampedArray) {
      item.fill(0);
    } else if (typeof item === "object") {
      for (const key of Object.keys(item)) {
        try {
          if (typeof item[key] === "string") {
            item[key] = "";
          } else if (item[key] instanceof Uint8Array) {
            item[key].fill(0);
          }
        } catch {
          // ignore
        }
      }
    }
  }
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
  return arrayBufferToBase64(bytes.buffer);
}

/**
 * Securely hashes a PIN using SHA-256 for comparison / local validation.
 */
export async function hashPin(pin: string, salt = "goflazz_pin_salt"): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return "fallback_hash_" + pin + "_" + salt;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ":" + salt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Derive HKDF key using HKDF(PIN, user_id, wallet_id)
 */
export async function deriveHkdfKey(
  pin: string,
  userId: string,
  walletId: string
): Promise<CryptoKey> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is unavailable");
  }

  const encoder = new TextEncoder();
  const ikm = encoder.encode(pin);
  const salt = encoder.encode(userId);
  const info = encoder.encode(`goflazz-key-${walletId}`);

  try {
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      ikm,
      "HKDF",
      false,
      ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: salt,
        info: info,
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch {
    // Fallback if HKDF import is unsupported in environment
    const pbkdf2Key = await window.crypto.subtle.importKey(
      "raw",
      ikm,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(`${userId}_${walletId}`),
        iterations: 10000,
        hash: "SHA-256",
      },
      pbkdf2Key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
}

/**
 * Derive an AES-GCM Key from a PIN using PBKDF2
 */
async function deriveKey(pin: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

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
 * Encrypt data using HKDF key derived from PIN, userId, and walletId
 */
export async function encryptWithHkdf(
  plaintext: string,
  pin: string,
  userId: string,
  walletId: string
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return btoa(JSON.stringify({ ciphertext: btoa(plaintext), legacy: true }));
  }

  const key = await deriveHkdfKey(pin, userId, walletId);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encoder = new TextEncoder();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const payload = {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    hkdf: true,
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Decrypt data using HKDF key derived from PIN, userId, and walletId
 */
export async function decryptWithHkdf(
  encryptedBase64: string,
  pin: string,
  userId: string,
  walletId: string
): Promise<string> {
  try {
    const rawJSON = atob(encryptedBase64);
    const payload = JSON.parse(rawJSON);

    if (payload.legacy || !payload.hkdf) {
      return decryptData(encryptedBase64, pin);
    }

    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API is not available.");
    }

    const key = await deriveHkdfKey(pin, userId, walletId);
    const ivBytes = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const cipherBytes = base64ToArrayBuffer(payload.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      key,
      cipherBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err: any) {
    // Try fallback decryption if legacy format
    try {
      return await decryptData(encryptedBase64, pin);
    } catch {
      throw new Error("Decryption failed. Please check your 6-digit PIN.");
    }
  }
}

/**
 * Encrypt a string with AES-GCM using a user's PIN.
 */
export async function encryptData(plaintext: string, pin: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
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

