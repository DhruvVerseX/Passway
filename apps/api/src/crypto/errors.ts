export type SecretCryptoErrorCode =
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_ALGORITHM"
  | "KEY_UNAVAILABLE"
  | "ENCRYPTION_FAILED"
  | "DECRYPTION_FAILED";

/** Deliberately contains no cryptographic detail or plaintext. */
export class SecretCryptoError extends Error {
  constructor(readonly code: SecretCryptoErrorCode) {
    super("Secret cryptographic operation failed");
    this.name = "SecretCryptoError";
  }
}
