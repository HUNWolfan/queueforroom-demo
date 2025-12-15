import { randomBytes } from 'crypto';

/**
 * Biztonságos, egyedi token generálása megosztható linkekhez
 * @returns 32 karakteres hexadecimális string
 */
export function generateShareToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * UUID v4 generálás (alternatív megoldás)
 * @returns UUID formátumú string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
