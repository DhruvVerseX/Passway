const MIN_SECRET_LENGTH = 4;

export function secretValues(values: Record<string, string | undefined>) {
  return Object.values(values).filter(
    (value): value is string => !!value && value.length >= MIN_SECRET_LENGTH,
  );
}

export function redactKnownSecrets(value: unknown, secrets: readonly string[]) {
  const text =
    value instanceof Error
      ? (value.stack ?? value.message)
      : typeof value === "string"
        ? value
        : JSON.stringify(value);

  return [...new Set(secrets)]
    .sort((a, b) => b.length - a.length)
    .reduce((output, secret) => output.replaceAll(secret, "[REDACTED]"), text ?? "");
}
