import { generateToken } from "../apps/api/src/crypto/tokens.js";

process.stdout.write(`${generateToken()}\n`);
