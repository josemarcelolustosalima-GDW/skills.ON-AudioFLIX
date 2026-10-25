/**
 * Cryptographic utility for password security using the native Web Cryptography API (crypto.subtle)
 * Implements AES-GCM-256 authenticated encryption and key derivation with PBKDF2.
 */

// Application Master Secret Salt for Key Derivation
const MASTER_SECRET = 'skills.ON!_Executive_Master_Key_2026_Secure';

// Convert ArrayBuffer or Uint8Array to Hex string
function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Derive a CryptoKey from a passphrase using PBKDF2
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(MASTER_SECRET),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a password using AES-256-GCM.
 * Output format: enc:<saltHex>:<ivHex>:<cipherHex>
 */
export async function encryptPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  // If already encrypted, return as is
  if (plainText.startsWith('enc:')) return plainText;

  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(salt);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      enc.encode(plainText)
    );

    return `enc:${bufToHex(salt)}:${bufToHex(iv)}:${bufToHex(cipherBuffer)}`;
  } catch (err) {
    console.error('Error encrypting password:', err);
    // Fallback: base64 obfuscation if crypto.subtle is unavailable
    return `enc_b64:${btoa(plainText)}`;
  }
}

/**
 * Decrypt an AES-256-GCM encrypted password string.
 */
export async function decryptPassword(cipherString: string): Promise<string> {
  if (!cipherString) return '';
  // If not encrypted (legacy plain password), return as is
  if (!cipherString.startsWith('enc:') && !cipherString.startsWith('enc_b64:')) {
    return cipherString;
  }

  // Handle fallback b64
  if (cipherString.startsWith('enc_b64:')) {
    try {
      return atob(cipherString.replace('enc_b64:', ''));
    } catch {
      return cipherString;
    }
  }

  try {
    const parts = cipherString.split(':');
    if (parts.length !== 4) return cipherString;

    const salt = hexToBuf(parts[1]);
    const iv = hexToBuf(parts[2]);
    const cipherBytes = hexToBuf(parts[3]);

    const key = await deriveKey(salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      cipherBytes as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('Error decrypting password:', err);
    return '••••••••';
  }
}

/**
 * Generate a cryptographically secure random password
 */
export function generateSecurePassword(length = 12): string {
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  const values = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

/**
 * Hash a password with SHA-256 (one-way digest for token signatures or quick checksums)
 */
export async function sha256(message: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuffer);
}
