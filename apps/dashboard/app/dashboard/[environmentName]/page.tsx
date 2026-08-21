"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Download,
  Eye,
  EyeOff,
  FileKey2,
  FileUp,
  KeyRound,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ControlPlaneShell } from "@/components/control-plane-shell";

type EnvironmentType =
  "Production" | "Development" | "Staging" | "Preview" | "Testing" | "CI/CD";
type Secret = { id: string; key: string; value: string; updated: string };

const typeTone: Record<EnvironmentType, string> = {
  Production: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
  Development: "border-sky-400/15 bg-sky-400/[0.07] text-sky-300",
  Staging: "border-amber-400/15 bg-amber-400/[0.07] text-amber-300",
  Preview: "border-violet-400/15 bg-violet-400/[0.07] text-violet-300",
  Testing: "border-blue-400/15 bg-blue-400/[0.07] text-blue-300",
  "CI/CD": "border-pink-400/15 bg-pink-400/[0.07] text-pink-300",
};
const defaults: Secret[] = [
  {
    id: "secret_01",
    key: "DATABASE_URL",
    value: "postgresql://app:••••••••@db.passway.cloud:5432/app",
    updated: "2 hours ago",
  },
  {
    id: "secret_02",
    key: "OPENAI_API_KEY",
    value: "sk-proj-••••••••••••••••••••",
    updated: "Yesterday",
  },
  {
    id: "secret_03",
    key: "BETTER_AUTH_SECRET",
    value: "••••••••••••••••••••••••••••••••",
    updated: "3 days ago",
  },
  {
    id: "secret_04",
    key: "NEXT_PUBLIC_APP_URL",
    value: "https://app.passway.co.in",
    updated: "6 days ago",
  },
];

function formatName(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function parseEnv(text: string): Secret[] {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) return [];
    return [
      {
        id: `secret_${Date.now()}_${index}`,
        key: match[1],
        value: match[2].trim().replace(/^['"]|['"]$/g, ""),
        updated: "Just now",
      },
    ];
  });
}

function AddSecretModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (secrets: Secret[]) => void;
}) {
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  if (!open) return null;
  const addManual = () => {
    if (!key.trim() || !value.trim()) return;
    onAdd([
      {
        id: `secret_${Date.now()}`,
        key: key.trim().toUpperCase().replace(/\s+/g, "_"),
        value: value.trim(),
        updated: "Just now",
      },
    ]);
    setKey("");
    setValue("");
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section
        className="w-full max-w-[560px] rounded-t-3xl border border-white/10 bg-[#111510] p-6 shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-secret-title"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-4 grid size-10 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
              <LockKeyhole size={18} />
            </div>
            <h2 id="add-secret-title" className="text-xl font-semibold">
              Add secrets
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-white/40">
              Add values to this environment. They are encrypted on save.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 flex rounded-xl border border-white/[0.08] bg-black/20 p-1">
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${mode === "manual" ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/65"}`}
          >
            <Plus size={13} className="mr-1.5 inline" /> Add manually
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${mode === "upload" ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/65"}`}
          >
            <Upload size={13} className="mr-1.5 inline" /> Upload .env
          </button>
        </div>
        {mode === "manual" ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-white/65">
                Secret key
              </span>
              <input
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="STRIPE_SECRET_KEY"
                className="mono h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-white/25 focus:border-[#b9f55d]/45"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-white/65">
                Secret value
              </span>
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Paste the value here"
                className="mono min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none placeholder:font-sans placeholder:text-white/25 focus:border-[#b9f55d]/45"
              />
            </label>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/[0.12] p-8 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
              <FileUp size={18} />
            </span>
            <p className="mt-4 text-sm font-medium text-white/75">
              {fileName || "Choose an environment file"}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Only key/value pairs are imported. Comments are ignored.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Upload size={13} /> Select .env file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".env,.txt"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                const reader = new FileReader();
                reader.onload = () => onAdd(parseEnv(String(reader.result)));
                reader.readAsText(file);
              }}
            />
          </div>
        )}
        <div className="mt-7 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 rounded-xl border border-white/10 px-4 text-sm font-medium text-white/60 transition hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          {mode === "manual" && (
            <button
              onClick={addManual}
              disabled={!key.trim() || !value.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b9f55d] px-4 text-sm font-semibold text-[#11140c] transition hover:bg-[#c8ff72] disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus size={15} /> Add secret
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default function EnvironmentDashboard() {
  const params = useParams<{ environmentName: string }>();
  const slug = params.environmentName || "environment";
  const stored =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`passway_environment_${slug}`)
      : null;
  const environment = stored
    ? (JSON.parse(stored) as {
        name: string;
        type: EnvironmentType;
        description: string;
        secrets: Secret[];
      })
    : {
        name: formatName(slug),
        type: "Development" as EnvironmentType,
        description: "Secure runtime configuration for this environment.",
        secrets: defaults,
      };
  const [secrets, setSecrets] = useState<Secret[]>(
    environment.secrets?.length ? environment.secrets : defaults,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Recently updated">("All");
  const [revealed, setRevealed] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Secrets");
  const visible = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return secrets.filter(
      (secret) =>
        !normalized ||
        `${secret.key} ${secret.value}`.toLowerCase().includes(normalized),
    );
  }, [query, secrets]);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };
  const addSecrets = (items: Secret[]) => {
    setSecrets((current) => [
      ...items.filter(
        (item) => !current.some((existing) => existing.key === item.key),
      ),
      ...current,
    ]);
    setModalOpen(false);
    notify(`${items.length} secret${items.length === 1 ? "" : "s"} added`);
  };
  const copyValue = async (secret: Secret) => {
    try {
      await navigator.clipboard.writeText(secret.value);
    } catch {
      /* embedded previews can block clipboard */
    }
    setCopied(secret.id);
    window.setTimeout(() => setCopied(null), 1700);
  };
  const downloadEnv = () => {
    const content = secrets
      .map((secret) => `${secret.key}=${secret.value}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slug}.env`;
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Environment file prepared");
  };
  const remove = (id: string) => {
    const secret = secrets.find((item) => item.id === id);
    setSecrets((current) => current.filter((item) => item.id !== id));
    if (secret) notify(`${secret.key} removed`);
  };

  return (
    <ControlPlaneShell active="Environments" title={environment.name}>
      <AddSecretModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addSecrets}
      />
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#191c17] px-4 py-3 text-sm font-medium shadow-2xl"
          role="status"
        >
          <CheckCircle2 size={16} className="text-[#b9f55d]" /> {toast}
        </div>
      )}
      <div className="flex flex-col gap-6 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-[#b9f55d]/80">
            <span className="h-2 w-2 rounded-full bg-[#b9f55d]" /> Environment
            control plane
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[36px]">
              {environment.name}
            </h1>
            <span
              className={`rounded-md border px-2 py-1 text-[10px] font-medium ${typeTone[environment.type]}`}
            >
              {environment.type}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            {environment.description ||
              "Secure runtime configuration for this environment."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadEnv}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.085] px-3 text-xs font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-white"
          >
            <Download size={14} /> Export .env
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#b9f55d] px-3.5 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72]"
          >
            <Plus size={14} strokeWidth={2.5} /> Add secret
          </button>
        </div>
      </div>
      <nav
        className="mt-6 flex gap-1 overflow-x-auto border-b border-white/[0.07]"
        aria-label="Environment navigation"
      >
        {["Secrets", "Tokens", "Access", "Activity", "Settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition ${activeTab === tab ? "border-[#b9f55d] text-white" : "border-transparent text-white/35 hover:text-white/70"}`}
          >
            {tab}
            {tab === "Secrets" && (
              <span className="ml-2 text-[10px] text-white/25">
                {secrets.length}
              </span>
            )}
          </button>
        ))}
      </nav>
      {activeTab === "Secrets" ? (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#b9f55d]/20 bg-[#b9f55d]/[0.055] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-white/45">
                    Secrets in scope
                  </p>
                  <p className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-white">
                    {secrets.length}
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                  <LockKeyhole size={16} />
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/35">
                <span className="size-1.5 rounded-full bg-emerald-400" />{" "}
                Encrypted and healthy
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-white/45">
                    Runtime tokens
                  </p>
                  <p className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-white">
                    2
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/50">
                  <KeyRound size={16} />
                </span>
              </div>
              <p className="mt-4 text-[11px] text-white/35">
                1 token used in the last 24h
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-white/45">
                    Access policy
                  </p>
                  <p className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-white">
                    Strict
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-emerald-300">
                  <ShieldCheck size={16} />
                </span>
              </div>
              <p className="mt-4 text-[11px] text-white/35">
                Least privilege enabled
              </p>
            </article>
          </section>
          <section className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-white/90">
                  Environment secrets
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Only applications with a scoped token can request these
                  values.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative flex-1 sm:w-56">
                  <span className="sr-only">Search environment secrets</span>
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search secrets..."
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/20"
                  />
                </label>
                <div className="relative">
                  <SlidersHorizontal
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/30"
                  />
                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(
                        event.target.value as "All" | "Recently updated",
                      )
                    }
                    className="h-9 appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f0c] pl-8 pr-8 text-xs text-white/50 outline-none"
                  >
                    <option>All</option>
                    <option>Recently updated</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/25"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.018]">
              <div className="hidden grid-cols-[1.2fr_1.75fr_1fr_90px] gap-4 border-b border-white/[0.065] bg-white/[0.018] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25] lg:grid">
                <span>Secret</span>
                <span>Value</span>
                <span>Updated</span>
                <span />
              </div>
              {visible.length ? (
                visible.map((secret) => {
                  const isRevealed = revealed.includes(secret.id);
                  return (
                    <article
                      key={secret.id}
                      className="group grid gap-4 border-b border-white/[0.055] px-4 py-4 last:border-0 sm:px-5 lg:grid-cols-[1.2fr_1.75fr_1fr_90px] lg:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/40 transition group-hover:border-[#b9f55d]/20 group-hover:text-[#b9f55d]">
                          <KeyRound size={16} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-mono text-xs font-medium text-white/80">
                            {secret.key}
                          </h3>
                          <p className="mt-1 text-[10px] text-white/25">
                            Scoped to {environment.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <code
                          className={`min-w-0 truncate font-mono text-[10px] ${isRevealed ? "text-white/65" : "text-white/35"}`}
                        >
                          {isRevealed ? secret.value : "••••••••••••••••••••"}
                        </code>
                        <button
                          onClick={() =>
                            setRevealed((current) =>
                              current.includes(secret.id)
                                ? current.filter((id) => id !== secret.id)
                                : [...current, secret.id],
                            )
                          }
                          className="grid size-7 shrink-0 place-items-center rounded-md text-white/25 transition hover:bg-white/[0.06] hover:text-white/70"
                          aria-label={`${isRevealed ? "Hide" : "Reveal"} ${secret.key}`}
                        >
                          {isRevealed ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                        <button
                          onClick={() => copyValue(secret)}
                          className="grid size-7 shrink-0 place-items-center rounded-md text-white/25 transition hover:bg-white/[0.06] hover:text-white/70"
                          aria-label={`Copy ${secret.key}`}
                        >
                          {copied === secret.id ? (
                            <Check size={13} className="text-[#b9f55d]" />
                          ) : (
                            <Clipboard size={13} />
                          )}
                        </button>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/55">
                          {secret.updated}
                        </p>
                        <p className="mt-1 text-[10px] text-white/25">
                          Last changed
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            notify(`${secret.key} rotation queued`)
                          }
                          className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-white/[0.05] hover:text-[#b9f55d]"
                          aria-label={`Rotate ${secret.key}`}
                        >
                          <Settings2 size={14} />
                        </button>
                        <button
                          onClick={() => remove(secret.id)}
                          className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-red-400/10 hover:text-red-300"
                          aria-label={`Delete ${secret.key}`}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-white/[0.05] hover:text-white"
                          aria-label={`More actions for ${secret.key}`}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="grid place-items-center px-6 py-16 text-center">
                  <div className="grid size-10 place-items-center rounded-xl border border-white/[0.07] text-white/25">
                    <Search size={16} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-white/60">
                    No secrets found
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Try another search or add a new secret.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-white/[0.1] p-12 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl border border-white/[0.07] text-white/25">
            {activeTab === "Tokens" ? (
              <KeyRound size={18} />
            ) : activeTab === "Access" ? (
              <Users size={18} />
            ) : activeTab === "Activity" ? (
              <Activity size={18} />
            ) : (
              <Settings2 size={18} />
            )}
          </span>
          <h2 className="mt-4 text-sm font-semibold text-white/75">
            {activeTab} for {environment.name}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/35">
            This environment-level control surface is ready for the next
            configuration step.
          </p>
          <button
            onClick={() => notify(`${activeTab} configuration coming next`)}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
          >
            Open settings <ChevronDown size={13} className="-rotate-90" />
          </button>
        </section>
      )}
      <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] py-5 text-[10px] text-white/22 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Passway encrypts secret payloads with envelope encryption and scoped
          runtime access.
        </p>
        <div className="flex items-center gap-4">
          <span>Environment ID: {slug}</span>
          <span>API v1</span>
        </div>
      </footer>
    </ControlPlaneShell>
  );
}
