const SECRET_KEYS = /(?:SECRET|TOKEN|PASSWORD|PASS|KEY|PRIVATE|DATABASE_URL|DB_URL)/i;

export function redactKnownSecrets(value: unknown) {
  const text =
    value instanceof Error
      ? (value.stack ?? value.message)
      : typeof value === "string"
        ? value
        : JSON.stringify(value);

  return Object.entries(process.env)
    .filter(([key, secret]) => SECRET_KEYS.test(key) && secret && secret.length >= 4)
    .reduce((output, [, secret]) => output.replaceAll(secret!, "[REDACTED]"), text ?? "");
}
