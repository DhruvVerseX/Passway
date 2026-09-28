import { Doc, Section } from "../components/doc";

export default function SecurityDocs() {
  return <Doc eyebrow="SECURITY MODEL" title="Security" description="How Passway delivers runtime secrets, and where protection ends.">
    <Section title="Runtime delivery">
      <p>Passway stores encrypted secret values and fetches them through a device-bound session over HTTPS. The CLI passes values to your app as environment variables at startup without writing a new secrets file. The runtime token stays in your local .env file, while the device private key is stored in the OS keychain.</p>
    </Section>
    <Section title="Limits">
      <p>Your app and its dependencies can read the plaintext values in memory. A modified CLI can copy them and ignore a revocation message. Revocation blocks future server fetches and stops a child process managed by the official CLI; it cannot erase values already copied. A stolen token and device key together can authorize new sessions.</p>
    </Section>
    <Section title="Operations">
      <p>Startup fails when a required fetch fails. After startup, a lost revocation connection leaves the app running with a warning. Protect the local .env and device key, rotate exposed credentials at their source, and revoke compromised runtime tokens. Passway currently holds its master encryption keys in the API server environment; managed KMS is a future milestone.</p>
    </Section>
  </Doc>;
}
