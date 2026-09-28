import path from "node:path";
import { autocomplete, box, cancel, confirm, intro, isCancel, log, note, outro, password, select, text } from "@clack/prompts";
import { clearClipboard, CLIPBOARD_SECONDS, copyPassword } from "./clipboard.js";
import {
  auditVault, createVault, exportVault, generatePassword, importVault, nextCredentialId,
  openVault, passwordStrength, saveVault, type Credential, type Vault, VaultError,
  vaultExists, vaultPath,
} from "./vault.js";

const commands = [
  "init", "unlock", "lock", "add", "list", "search <query>", "show <id>", "edit <id>",
  "delete <id>", "generate", "audit", "import <file>", "export", "config", "start", "run",
];

class PromptCancelled extends Error {}

function answer<T>(value: T | symbol): T {
  if (isCancel(value)) throw new PromptCancelled();
  return value as T;
}

function formatError(error: unknown) {
  if (error instanceof VaultError) {
    if (error.code === "NOT_INITIALIZED") return "Vault not initialized. Run: passway init";
    if (error.code === "ALREADY_INITIALIZED") return "A Passway vault already exists.";
    if (error.code === "INVALID_PASSWORD") return "Invalid master password or damaged vault.";
    return "The vault file is invalid or damaged.";
  }
  return error instanceof Error ? error.message : "Passway could not complete the command.";
}

async function masterPassword(message = "Master password") {
  if (!process.stdin.isTTY) throw new Error("A secure interactive terminal is required for password input.");
  return answer<string>(await password({ message }));
}

async function unlocked<T>(action: (vault: Vault, master: string) => Promise<T> | T) {
  const master = await masterPassword();
  return action(openVault(master), master);
}

function summary(vault: Vault) {
  const audit = auditVault(vault);
  const issues = audit.weak + audit.reused + audit.old;
  box(
    `${vault.name} vault  ·  ${vault.entries.length} credentials\n${issues ? `${issues} security findings` : "No security findings"}`,
    "PASSWAY  /  UNLOCKED",
    { width: 48 },
  );
}

function listCredentials(entries: Credential[]) {
  note(
    entries.length ? entries.map((entry) => `${entry.id.padEnd(8)} ${entry.name}  ${entry.username}`).join("\n") : "No credentials found.",
    `${entries.length} credential${entries.length === 1 ? "" : "s"}`,
  );
}

async function addCredential(vault: Vault, master: string, presetPassword?: string) {
  const name = answer<string>(await text({ message: "Name", validate: (value) => value?.trim() ? undefined : "Name is required" })).trim();
  const username = answer<string>(await text({ message: "Username" })).trim();
  const secret = presetPassword ?? answer<string>(await password({ message: "Password", validate: (value) => value ? undefined : "Password is required" }));
  const website = answer<string>(await text({ message: "Website (optional)" })).trim();
  const category = answer<string>(await text({ message: "Category (optional)" })).trim();
  const now = new Date().toISOString();
  vault.entries.push({ id: nextCredentialId(vault), name, username, password: secret, website, category, createdAt: now, updatedAt: now });
  saveVault(vault, master);
  log.success(`${name} saved`);
  return 0;
}

async function editCredential(vault: Vault, master: string, entry: Credential) {
  const name = answer<string>(await text({ message: "Name", initialValue: entry.name, validate: (value) => value?.trim() ? undefined : "Name is required" })).trim();
  const username = answer<string>(await text({ message: "Username", initialValue: entry.username }));
  const website = answer<string>(await text({ message: "Website", initialValue: entry.website }));
  const category = answer<string>(await text({ message: "Category", initialValue: entry.category }));
  const changedPassword = answer<string>(await password({ message: "New password (blank keeps current)" }));
  Object.assign(entry, { name, username, website, category, password: changedPassword || entry.password, updatedAt: new Date().toISOString() });
  saveVault(vault, master);
  log.success(`${name} updated`);
}

async function deleteCredential(vault: Vault, master: string, entry: Credential) {
  if (!answer<boolean>(await confirm({ message: `Delete ${entry.name}? This cannot be undone.`, initialValue: false }))) {
    log.info("Deletion cancelled");
    return false;
  }
  vault.entries = vault.entries.filter((item) => item.id !== entry.id);
  saveVault(vault, master);
  log.success(`${entry.name} deleted`);
  return true;
}

async function credentialDetail(vault: Vault, master: string, entry: Credential) {
  let reveal = false;
  while (vault.entries.includes(entry)) {
    box(
      `Username   ${entry.username || "—"}\nPassword   ${reveal ? entry.password : "••••••••••••"}\nWebsite    ${entry.website || "—"}\nCategory   ${entry.category || "—"}\nUpdated    ${new Date(entry.updatedAt).toLocaleDateString()}`,
      entry.name, { width: 54 },
    );
    const action = answer<string>(await select({ message: "Credential actions", options: [
      { value: "copy", label: "Copy password", hint: `clipboard clears in ${CLIPBOARD_SECONDS}s` },
      { value: "reveal", label: reveal ? "Hide password" : "Reveal password" },
      { value: "edit", label: "Edit credential" },
      { value: "delete", label: "Delete credential" },
      { value: "back", label: "Back" },
    ] }));
    if (action === "back") return;
    if (action === "reveal") reveal = !reveal;
    if (action === "copy") {
      if (copyPassword(entry.password)) log.success(`Copied. Clipboard clears in ${CLIPBOARD_SECONDS} seconds.`);
      else log.error("Clipboard is unavailable on this system.");
    }
    if (action === "edit") { await editCredential(vault, master, entry); reveal = false; }
    if (action === "delete" && await deleteCredential(vault, master, entry)) return;
  }
}

async function browse(vault: Vault, master: string) {
  while (true) {
    if (!vault.entries.length) { note("Add your first credential to get started.", "Vault is empty"); return; }
    const choice = answer<string>(await autocomplete({
      message: "Search credentials",
      options: [
        ...vault.entries.map((entry) => ({ value: entry.id, label: entry.name, hint: entry.username || entry.website || entry.id })),
        { value: "back", label: "← Back to vault", hint: "" },
      ],
      placeholder: "Type a name, username, or website",
      filter: (query, option) => option.value === "back" || `${option.label} ${option.hint}`.toLowerCase().includes(query.toLowerCase()),
      maxItems: 8,
    }));
    if (choice === "back") return;
    const entry = vault.entries.find((item) => item.id === choice);
    if (entry) await credentialDetail(vault, master, entry);
  }
}

async function generator(vault?: Vault, master?: string) {
  let generated = generatePassword();
  while (true) {
    box(`${generated}\n\n20 characters  ·  ${passwordStrength(generated)}`, "PASSWORD GENERATOR", { width: 48 });
    const action = answer<string>(await select({ message: "Generator actions", options: [
      { value: "copy", label: "Copy password" },
      { value: "again", label: "Generate another" },
      { value: "save", label: "Save to vault" },
      { value: "back", label: "Back" },
    ] }));
    if (action === "back") return 0;
    if (action === "again") generated = generatePassword();
    if (action === "copy") {
      if (copyPassword(generated)) log.success(`Copied. Clipboard clears in ${CLIPBOARD_SECONDS} seconds.`);
      else log.error("Clipboard is unavailable on this system.");
    }
    if (action === "save") return vault && master ? addCredential(vault, master, generated) : unlocked((opened, password) => addCredential(opened, password, generated));
  }
}

function printAudit(vault: Vault) {
  const { weak, reused, old } = auditVault(vault);
  note(`Weak passwords         ${weak}\nReused passwords       ${reused}\nOlder than one year    ${old}\n\n${weak || reused || old ? "Review the affected credentials." : "No security issues found."}`, "SECURITY AUDIT");
}

async function interactive(vault: Vault, master: string) {
  intro("✦ PASSWAY");
  summary(vault);
  while (true) {
    const action = answer<string>(await select({ message: "What would you like to do?", options: [
      { value: "browse", label: "Search vault", hint: `${vault.entries.length} credentials` },
      { value: "add", label: "Add credential" },
      { value: "generate", label: "Generate password" },
      { value: "audit", label: "Security audit" },
      { value: "lock", label: "Lock vault" },
    ] }));
    if (action === "lock") { clearClipboard(); outro("Vault locked"); return 0; }
    if (action === "browse") await browse(vault, master);
    if (action === "add") await addCredential(vault, master);
    if (action === "generate") await generator(vault, master);
    if (action === "audit") printAudit(vault);
  }
}

export function printPasswordManagerHelp() {
  intro("✦ PASSWAY  /  COMMANDS");
  note(commands.map((command) => `passway ${command}`).join("\n"), "Local vault + runtime");
  outro("Run passway to open your vault");
}

export async function runPasswordManager(command: string | undefined, args: string[]) {
  try {
    if (!command || command === "unlock") {
      if (!vaultExists()) throw new VaultError("NOT_INITIALIZED");
      return unlocked(interactive);
    }
    if (command === "init") {
      intro("✦ PASSWAY  /  NEW VAULT");
      if (vaultExists()) throw new VaultError("ALREADY_INITIALIZED");
      const first = await masterPassword("Create master password");
      if (first.length < 12) { log.error("Use at least 12 characters for the master password."); return 1; }
      if (first !== await masterPassword("Confirm master password")) { log.error("Passwords do not match."); return 1; }
      createVault(first);
      outro(`Vault created at ${vaultPath()}`);
      return 0;
    }
    if (command === "lock") { clearClipboard(); log.success("Vault locked and clipboard cleared."); return 0; }
    if (command === "add") return unlocked(addCredential);
    if (command === "list") return unlocked((vault) => { listCredentials(vault.entries); return 0; });
    if (command === "search") {
      const query = args.join(" ").trim().toLowerCase();
      if (!query) { log.error("Usage: passway search <query>"); return 1; }
      return unlocked((vault) => { listCredentials(vault.entries.filter((entry) => `${entry.name} ${entry.username} ${entry.website} ${entry.category}`.toLowerCase().includes(query))); return 0; });
    }
    if (["show", "edit", "delete"].includes(command)) {
      const id = args[0];
      if (!id) { log.error(`Usage: passway ${command} <id>`); return 1; }
      return unlocked(async (vault, master) => {
        const entry = vault.entries.find((item) => item.id === id);
        if (!entry) { log.error("Credential not found."); return 1; }
        if (command === "show") await credentialDetail(vault, master, entry);
        if (command === "edit") await editCredential(vault, master, entry);
        if (command === "delete") await deleteCredential(vault, master, entry);
        return 0;
      });
    }
    if (command === "generate") return generator();
    if (command === "audit") return unlocked((vault) => { printAudit(vault); return 0; });
    if (command === "export") {
      const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
      const destination = path.resolve(`passway-vault-${stamp}.json`);
      exportVault(destination);
      log.success(`Encrypted backup exported to ${destination}`);
      return 0;
    }
    if (command === "import") {
      const source = args[0] && path.resolve(args[0]);
      if (!source) { log.error("Usage: passway import <file>"); return 1; }
      if (vaultExists() && !answer<boolean>(await confirm({ message: "Replace the current vault with this encrypted backup?", initialValue: false }))) return 1;
      importVault(source, await masterPassword("Backup master password"));
      log.success("Encrypted vault imported.");
      return 0;
    }
    if (command === "config") {
      note(`Vault       ${vaultPath()}\nEncryption  AES-256-GCM + scrypt\nClipboard   Clears after ${CLIPBOARD_SECONDS} seconds\nColors      ${process.env.NO_COLOR ? "Disabled" : "Enabled"}`, "PASSWAY  /  CONFIG");
      return 0;
    }
    printPasswordManagerHelp();
    return 1;
  } catch (error) {
    if (error instanceof PromptCancelled) { clearClipboard(); cancel("Cancelled"); return 1; }
    log.error(formatError(error));
    return 1;
  }
}
