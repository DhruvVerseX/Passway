import path from "node:path";
import { clearClipboard, CLIPBOARD_SECONDS, copyPassword } from "./clipboard.js";
import { ask, bold, clearScreen, confirm, cyan, dim, frame, green, readKey, red, secret, write, yellow } from "./terminal.js";
import {
  auditVault,
  createVault,
  exportVault,
  generatePassword,
  importVault,
  nextCredentialId,
  openVault,
  passwordStrength,
  saveVault,
  type Credential,
  type Vault,
  VaultError,
  vaultExists,
  vaultPath,
} from "./vault.js";

const commands = [
  "init", "unlock", "lock", "add", "list", "search <query>", "show <id>", "edit <id>",
  "delete <id>", "generate", "audit", "import <file>", "export", "config", "start",
];

function fail(message: string) {
  write(red(`✗ ${message}`));
  return 1;
}

function okay(message: string) {
  write(green(`✓ ${message}`));
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

async function unlockVault() {
  return openVault(await secret());
}

async function unlocked<T>(action: (vault: Vault, masterPassword: string) => Promise<T> | T) {
  const masterPassword = await secret();
  const vault = openVault(masterPassword);
  return action(vault, masterPassword);
}

function mask(password: string) {
  return "•".repeat(Math.min(Math.max(password.length, 8), 18));
}

function updated(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

function printCredentials(entries: Credential[], selected = -1) {
  const wide = (process.stdout.columns ?? 80) >= 64;
  write(bold("PASSWAY / VAULT\n"));
  if (wide) {
    write(`${dim("ID".padEnd(10))}${dim("NAME".padEnd(20))}${dim("USERNAME")}`);
    write(dim("─".repeat(Math.min(60, (process.stdout.columns ?? 80) - 2))));
    entries.forEach((entry, index) => {
      const row = `${entry.id.padEnd(10)}${entry.name.slice(0, 18).padEnd(20)}${entry.username}`;
      write(index === selected ? cyan(`› ${row}`) : `  ${row}`);
    });
  } else {
    entries.forEach((entry, index) => {
      const marker = index === selected ? cyan("›") : " ";
      write(`${marker} ${entry.id}  ${entry.name}`);
      write(`    ${dim(entry.username || "No username")}`);
    });
  }
  write(`\n${entries.length} credential${entries.length === 1 ? "" : "s"}`);
}

async function addCredential(vault: Vault, masterPassword: string, presetPassword?: string) {
  write(bold("PASSWAY / ADD\n"));
  const name = await ask("Name:");
  if (!name) return fail("Name is required.");
  const username = await ask("Username:");
  const password = presetPassword ?? await secret("Password:");
  if (!password) return fail("Password is required.");
  const website = await ask("Website (optional):");
  const category = await ask("Category (optional):");
  const now = new Date().toISOString();
  vault.entries.push({ id: nextCredentialId(vault), name, username, password, website, category, createdAt: now, updatedAt: now });
  saveVault(vault, masterPassword);
  okay(`${name} saved.`);
  return 0;
}

async function editCredential(vault: Vault, masterPassword: string, entry: Credential) {
  write(dim("Leave a field blank to keep its current value.\n"));
  entry.name = await ask(`Name [${entry.name}]:`) || entry.name;
  entry.username = await ask(`Username [${entry.username}]:`) || entry.username;
  entry.website = await ask(`Website [${entry.website || "none"}]:`) || entry.website;
  entry.category = await ask(`Category [${entry.category || "none"}]:`) || entry.category;
  entry.password = await secret("New password (blank keeps current):") || entry.password;
  entry.updatedAt = new Date().toISOString();
  saveVault(vault, masterPassword);
  okay(`${entry.name} updated.`);
}

async function deleteCredential(vault: Vault, masterPassword: string, entry: Credential) {
  write(yellow(`Delete ${entry.name} (${entry.username || "no username"})?`));
  if (!await confirm("This cannot be undone.")) {
    write(dim("Delete cancelled."));
    return false;
  }
  vault.entries = vault.entries.filter((item) => item.id !== entry.id);
  saveVault(vault, masterPassword);
  okay(`${entry.name} deleted.`);
  return true;
}

function detailFrame(entry: Credential, reveal = false) {
  return frame(entry.name, [
    `Username   ${entry.username || "—"}`,
    `Password   ${reveal ? entry.password : mask(entry.password)}`,
    `Website    ${entry.website || "—"}`,
    `Category   ${entry.category || "—"}`,
    `Updated    ${updated(entry.updatedAt)}`,
    "─".repeat(20),
    "[C] Copy   [R] Reveal   [E] Edit",
    "[D] Delete             [Esc] Back",
  ]);
}

async function credentialDetail(vault: Vault, masterPassword: string, entry: Credential) {
  let reveal = false;
  while (vault.entries.includes(entry)) {
    clearScreen();
    write(detailFrame(entry, reveal));
    const key = (await readKey()).toLowerCase();
    if (key === "\u001b" || key === "q") return;
    if (key === "r") reveal = !reveal;
    if (key === "c") {
      if (copyPassword(entry.password)) okay(`Copied. Clipboard clears in ${CLIPBOARD_SECONDS} seconds.`);
      else fail("Clipboard is unavailable on this system.");
      await readKey();
    }
    if (key === "e") {
      clearScreen();
      await editCredential(vault, masterPassword, entry);
      await readKey();
    }
    if (key === "d") {
      clearScreen();
      if (await deleteCredential(vault, masterPassword, entry)) return;
      await readKey();
    }
  }
}

async function browse(vault: Vault, masterPassword: string, initial = vault.entries) {
  let entries = initial;
  let selected = 0;
  while (true) {
    clearScreen();
    printCredentials(entries, entries.length ? selected : -1);
    write(dim("\n↑↓ Navigate   Enter Open   / Search   Q Back"));
    const key = await readKey();
    if (key.toLowerCase() === "q" || key === "\u001b") return;
    if (key === "\u001b[A") selected = Math.max(0, selected - 1);
    if (key === "\u001b[B") selected = Math.min(entries.length - 1, selected + 1);
    if ((key === "\r" || key === "\n") && entries[selected]) await credentialDetail(vault, masterPassword, entries[selected]);
    if (key === "/") {
      const query = (await ask("Search:")).toLowerCase();
      entries = vault.entries.filter((entry) => `${entry.name} ${entry.username} ${entry.website} ${entry.category}`.toLowerCase().includes(query));
      selected = 0;
    }
  }
}

function dashboard(vault: Vault) {
  return frame("PASSWAY", [
    "Secure local password manager",
    "─".repeat(24),
    `Vault      ${vault.name}`,
    `Status     ${green("● Unlocked")}`,
    `Entries    ${vault.entries.length}`,
    "─".repeat(24),
    `${cyan("[1]")} Search vault`,
    `${cyan("[2]")} Add credential`,
    `${cyan("[3]")} Generate password`,
    `${cyan("[4]")} Security audit`,
    `${cyan("[5]")} Lock vault`,
    "",
    "[Q] Quit",
  ]);
}

async function generator(vault?: Vault, masterPassword?: string) {
  let password = generatePassword();
  while (true) {
    clearScreen();
    const strength = passwordStrength(password);
    const bar = green("█".repeat(20));
    write(`${bold("PASSWAY / GENERATOR")}\n\nLength        20\nUppercase     [✓]\nLowercase     [✓]\nNumbers       [✓]\nSymbols       [✓]\n\nPassword\n${cyan(password)}\n\nStrength  ${bar}  ${green(strength)}\n\n[C] Copy   [R] Regenerate   [S] Save   [Q] Back`);
    const key = (await readKey()).toLowerCase();
    if (key === "q" || key === "\u001b") return 0;
    if (key === "r") password = generatePassword();
    if (key === "c") {
      if (copyPassword(password)) okay(`Copied. Clipboard clears in ${CLIPBOARD_SECONDS} seconds.`);
      else fail("Clipboard is unavailable on this system.");
      await readKey();
    }
    if (key === "s") {
      if (vault && masterPassword) return addCredential(vault, masterPassword, password);
      return unlocked((opened, master) => addCredential(opened, master, password));
    }
  }
}

function printAudit(vault: Vault) {
  const result = auditVault(vault);
  write(bold("PASSWAY / SECURITY AUDIT\n"));
  write(`${result.weak ? yellow("●") : green("●")} Weak passwords      ${result.weak}`);
  write(`${result.reused ? yellow("●") : green("●")} Reused passwords    ${result.reused}`);
  write(`${result.old ? yellow("●") : green("●")} Older than one year ${result.old}`);
  if (!result.weak && !result.reused && !result.old) write(green("\nNo security issues found."));
}

async function interactive(vault: Vault, masterPassword: string) {
  while (true) {
    clearScreen();
    write(dashboard(vault));
    write("\nSelect › ");
    const key = (await readKey()).toLowerCase();
    if (key === "q" || key === "5" || key === "\u001b") {
      clearClipboard();
      clearScreen();
      okay("Vault locked.");
      return 0;
    }
    if (key === "1") await browse(vault, masterPassword);
    if (key === "2") { clearScreen(); await addCredential(vault, masterPassword); await readKey(); }
    if (key === "3") await generator(vault, masterPassword);
    if (key === "4") { clearScreen(); printAudit(vault); await readKey(); }
  }
}

export function printPasswordManagerHelp() {
  write(`${bold("Passway")} — secure local password manager\n`);
  commands.forEach((command) => write(`  passway ${command}`));
}

export async function runPasswordManager(command: string | undefined, args: string[]) {
  try {
    if (!command || command === "unlock") {
      if (!vaultExists()) return fail("Vault not initialized. Run: passway init");
      const masterPassword = await secret();
      return interactive(openVault(masterPassword), masterPassword);
    }
    if (command === "init") {
      if (vaultExists()) return fail("A Passway vault already exists.");
      const first = await secret("Create master password:");
      if (first.length < 12) return fail("Use at least 12 characters for the master password.");
      if (first !== await secret("Confirm master password:")) return fail("Passwords do not match.");
      createVault(first);
      okay(`Vault created at ${vaultPath()}`);
      return 0;
    }
    if (command === "lock") {
      clearClipboard();
      okay("Vault locked and clipboard cleared.");
      return 0;
    }
    if (command === "add") return unlocked(addCredential);
    if (command === "list") return unlocked((vault) => { printCredentials(vault.entries); return 0; });
    if (command === "search") {
      const query = args.join(" ").trim().toLowerCase();
      if (!query) return fail("Usage: passway search <query>");
      return unlocked((vault) => {
        printCredentials(vault.entries.filter((entry) => `${entry.name} ${entry.username} ${entry.website} ${entry.category}`.toLowerCase().includes(query)));
        return 0;
      });
    }
    if (["show", "edit", "delete"].includes(command)) {
      const id = args[0];
      if (!id) return fail(`Usage: passway ${command} <id>`);
      return unlocked(async (vault, masterPassword) => {
        const entry = vault.entries.find((item) => item.id === id);
        if (!entry) return fail("Credential not found.");
        if (command === "show") {
          if (process.stdin.isTTY) await credentialDetail(vault, masterPassword, entry);
          else write(detailFrame(entry));
        }
        if (command === "edit") await editCredential(vault, masterPassword, entry);
        if (command === "delete") await deleteCredential(vault, masterPassword, entry);
        return 0;
      });
    }
    if (command === "generate") return generator();
    if (command === "audit") return unlocked((vault) => { printAudit(vault); return 0; });
    if (command === "export") {
      const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
      const destination = path.resolve(`passway-vault-${stamp}.json`);
      exportVault(destination);
      okay(`Encrypted backup exported to ${destination}`);
      return 0;
    }
    if (command === "import") {
      const source = args[0] && path.resolve(args[0]);
      if (!source) return fail("Usage: passway import <file>");
      if (vaultExists() && !await confirm("Replace the current vault with this encrypted backup?")) return 1;
      importVault(source, await secret("Backup master password:"));
      okay("Encrypted vault imported.");
      return 0;
    }
    if (command === "config") {
      write(`${bold("PASSWAY / CONFIG")}\n\nVault       ${vaultPath()}\nEncryption  AES-256-GCM + scrypt\nClipboard   Clears after ${CLIPBOARD_SECONDS} seconds\nColors      ${process.env.NO_COLOR ? "Disabled" : "Enabled"}`);
      return 0;
    }
    printPasswordManagerHelp();
    return 1;
  } catch (error) {
    return fail(formatError(error));
  }
}
