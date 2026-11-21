import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM with a random 96-bit IV per value. Format: `v1.<iv>.<tag>.<ciphertext>` (base64url).
 * The version prefix allows key rotation later: add `v2` with another key and keep decrypting `v1`.
 * Plaintext tokens are never logged and never appear in error messages.
 */
const VERSION = "v1";
const b64 = (b: Buffer) => b.toString("base64url");

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultError";
  }
}

function keyFrom(hex: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new VaultError("APP_ENCRYPTION_KEY must be 64 hex characters");
  return Buffer.from(hex, "hex");
}

export function encryptToken(plain: string, keyHex: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(keyHex), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, b64(iv), b64(cipher.getAuthTag()), b64(ct)].join(".");
}

export function decryptToken(payload: string, keyHex: string): string {
  const [v, iv, tag, ct] = payload.split(".");
  if (v !== VERSION || !iv || !tag || !ct) throw new VaultError("Unsupported ciphertext");
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyFrom(keyHex), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
  } catch (e) {
    if (e instanceof VaultError) throw e;
    throw new VaultError("Could not decrypt token (wrong key or tampered data)");
  }
}
