import crypto from "node:crypto";
import keytar from "keytar";

const SERVICE = "Passway CLI";

function account(apiBaseUrl: string, appId: string) {
  return `ed25519:${crypto.createHash("sha256").update(`${apiBaseUrl}:${appId}`).digest("hex")}`;
}

export interface RuntimeDeviceKey {
  publicKey: string;
  sign(challengeId: string, challenge: string): string;
}

export async function getOrCreateRuntimeDeviceKey(apiBaseUrl: string, appId: string): Promise<RuntimeDeviceKey> {
  const keyAccount = account(apiBaseUrl, appId);
  let privateKey = await keytar.getPassword(SERVICE, keyAccount);
  if (!privateKey) {
    const pair = crypto.generateKeyPairSync("ed25519");
    privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    await keytar.setPassword(SERVICE, keyAccount, privateKey);
  }
  const key = crypto.createPrivateKey(privateKey);
  const publicKey = crypto.createPublicKey(key).export({ type: "spki", format: "pem" }).toString();
  return {
    publicKey,
    sign(challengeId, challenge) {
      return crypto.sign(null, Buffer.from(`passway-device-v1:${challengeId}:${challenge}`), key).toString("base64url");
    },
  };
}

export function deviceLabel() {
  return process.env.COMPUTERNAME?.trim() || process.env.HOSTNAME?.trim() || "Passway CLI device";
}
