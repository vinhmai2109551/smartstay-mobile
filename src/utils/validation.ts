import { z } from 'zod';

// Vietnamese mobile numbers: 0xxxxxxxxx or +84xxxxxxxxx, carrier prefix 3/5/7/8/9
// (the ranges still issued to mobile subscribers), 8 digits after that.
const VN_PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

/** Strips internal/leading/trailing whitespace before matching VN_PHONE_PATTERN. */
export function phoneSchema(invalidMessage: string) {
  return z
    .string()
    .transform((value) => value.replace(/\s+/g, ''))
    .refine((value) => VN_PHONE_PATTERN.test(value), invalidMessage);
}

/** register & reset-password: backend requires at least 6 characters (doc/API.md 1.1, 10.3). */
export function passwordSchema(minLengthMessage: string) {
  return z.string().min(6, minLengthMessage);
}

/**
 * change-password: backend requires at least 8 characters, with both a letter and a
 * digit (doc/API.md 6.x) — stricter than, and distinct from, passwordSchema() above.
 */
export function strongPasswordSchema(message: string) {
  return z
    .string()
    .min(8, message)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), message);
}
