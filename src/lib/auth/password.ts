import { z } from "zod";

export const emailSchema = z.string().trim().max(254).email().transform(email => email.toLowerCase());
/** bcrypt silently truncates after 72 bytes; reject inputs rather than truncating. */
export function passwordIsValidInput(password: string): boolean {
  return Buffer.byteLength(password, "utf8") > 0 && Buffer.byteLength(password, "utf8") <= 72;
}
export function passwordIsStrongEnough(password: string): boolean {
  return password.length >= 12 && passwordIsValidInput(password);
}
