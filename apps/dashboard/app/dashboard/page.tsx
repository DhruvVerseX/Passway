"use client";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Code2,
  Command,
  Copy,
  Ellipsis,
  ExternalLink,
  Fingerprint,
  Gauge,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import { EnvironmentOnboardingModal } from "@/components/environment-onboarding-modal";
import { useEffect, useMemo, useState } from "react";

type Environment = "Production" | "Preview" | "Development";
type KeyStatus = "Healthy" | "Rotate soon";

type SdkKey = {
  id: string;
  name: string;
  fingerprint: string;
  environment: Environment;
  scopes: string[];
  lastUsed: string;
  created: string;
  requests: string;
  status: KeyStatus;
};

const initialKeys: SdkKey[] = [
  {
    id: "key_live_8fd21",
    name: "Production API",
    fingerprint: "pw_live_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢8F2D",
    environment: "Production",
    scopes: ["secrets:read", "sdk:connect"],
    lastUsed: "18 seconds ago",
    created: "Jun 28, 2026",
    requests: "428.2k",
    status: "Healthy",
  },
  {
    id: "key_preview_4ac19",
    name: "Vercel previews",
    fingerprint: "pw_prev_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢4AC1",
    environment: "Preview",
    scopes: ["secrets:read"],
    lastUsed: "12 minutes ago",
    created: "Jul 02, 2026",
    requests: "31.8k",
    status: "Healthy",
  },
  {
    id: "key_dev_91bb2",
    name: "Local development",
    fingerprint: "pw_dev_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢91BB",
    environment: "Development",
    scopes: ["secrets:read", "secrets:list"],
    lastUsed: "Yesterday, 11:42 PM",
    created: "May 17, 2026",
    requests: "8.4k",
    status: "Rotate soon",
  },
];

const surfaces = [
  { label: "Landing", domain: "passway.co.in", icon: Globe2 },
  { label: "Dashboard", domain: "app.passway.co.in", icon: LayoutDashboard },
  { label: "Docs", domain: "docs.passway.co.in", icon: BookOpen },
  { label: "API", domain: "api.passway.co.in", icon: TerminalSquare },
];

const navigation = [
  { label: "Overview", icon: Gauge, active: true, href: "/dashboard" },
  { label: "SDK keys", icon: KeyRound, count: "3", href: "#" },
  {
    label: "Secrets",
    icon: LockKeyhole,
    count: "24",
    href: "/dashboard/secrets",
  },
  { label: "Environments", icon: Box, href: "/dashboard/environments" },
  { label: "Access", icon: Users, href: "#" },
  { label: "Audit log", icon: Activity, href: "#" },
];

function PasswayMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/assets/logo/passway-mark-dark.svg"
      alt=""
      className={`h-8 w-8 shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}

function EnvironmentBadge({ environment }: { environment: Environment }) {
  const styles: Record<Environment, string> = {
    Production: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
    Preview: "border-violet-400/15 bg-violet-400/[0.07] text-violet-300",
    Development: "border-sky-400/15 bg-sky-400/[0.07] text-sky-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${styles[environment]}`}
    >
      {environment}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof KeyRound;
  accent?: boolean;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-colors ${accent ? "border-[#b9f55d]/20 bg-[#b9f55d]/[0.055]" : "border-white/[0.075] bg-white/[0.025] hover:bg-white/[0.04]"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-white/45">{label}</p>
          <p className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-white">
            {value}
          </p>
        </div>
        <div
          className={`grid h-9 w-9 place-items-center rounded-xl border ${accent ? "border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]" : "border-white/[0.08] bg-white/[0.035] text-white/50"}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/35">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {detail}
      </div>
    </article>
  );
}

function CreateKeyModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (key: SdkKey) => void;
}) {
  const [name, setName] = useState("Backend production");
  const [environment, setEnvironment] = useState<Environment>("Production");

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const handleCreate = () => {
    const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
    onCreate({
      id: `key_${Date.now()}`,
      name: name.trim() || "Untitled SDK key",
      fingerprint: `pw_${environment.toLowerCase().slice(0, 4)}_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢${suffix}`,
      environment,
      scopes: ["secrets:read", "sdk:connect"],
      lastUsed: "Never",
      created: "Just now",
      requests: "0",
      status: "Healthy",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section
        className="w-full max-w-[520px] rounded-t-3xl border border-white/10 bg-[#111310] p-6 shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-key-title"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
              <KeyRound size={18} />
            </div>
            <h2
              id="create-key-title"
              className="text-xl font-semibold tracking-[-0.025em]"
            >
              Create an SDK key
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-white/45">
              Keys identify an application. Secret values stay encrypted and are
              never included in the key itself.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Key name
            </span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#b9f55d]/45 focus:ring-4 focus:ring-[#b9f55d]/[0.06]"
              placeholder="e.g. Railway production"
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-white/65">
              Environment
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(["Production", "Preview", "Development"] as Environment[]).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setEnvironment(item)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${environment === item ? "border-[#b9f55d]/40 bg-[#b9f55d]/[0.08] text-white" : "border-white/[0.08] bg-white/[0.02] text-white/45 hover:bg-white/[0.04]"}`}
                  >
                    <span
                      className={`mb-2 block h-2 w-2 rounded-full ${item === "Production" ? "bg-emerald-400" : item === "Preview" ? "bg-violet-400" : "bg-sky-400"}`}
                    />
                    <span className="text-[11px] font-medium sm:text-xs">
                      {item}
                    </span>
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <div className="rounded-xl border border-white/[0.075] bg-black/20 p-3.5">
            <div className="flex gap-3">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-[#b9f55d]"
                size={16}
              />
              <p className="text-xs leading-5 text-white/45">
                <span className="font-medium text-white/70">
                  Least privilege by default.
                </span>{" "}
                This key can read encrypted secrets and establish SDK sessions.
                You can add scopes later.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 rounded-xl border border-white/10 px-4 text-sm font-medium text-white/65 transition hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b9f55d] px-4 text-sm font-semibold text-[#11140c] transition hover:bg-[#c8ff72] focus:outline-none focus:ring-4 focus:ring-[#b9f55d]/20"
          >
            <Plus size={15} strokeWidth={2.5} /> Create key
          </button>
        </div>
      </section>
    </div>
  );
}

export default function PasswayDashboard() {
  const [keys, setKeys] = useState(initialKeys);
  const [query, setQuery] = useState("");
  const [environment, setEnvironment] = useState<"All" | Environment>("All");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEnvironmentOpen, setEnvironmentOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const visibleKeys = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return keys.filter((key) => {
      const matchesEnvironment =
        environment === "All" || key.environment === environment;
      const matchesQuery =
        !normalized ||
        [key.name, key.fingerprint, key.environment, ...key.scopes]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesEnvironment && matchesQuery;
    });
  }, [environment, keys, query]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access can be unavailable in embedded previews.
    }
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const createKey = (key: SdkKey) => {
    setKeys((current) => [key, ...current]);
    setCreateOpen(false);
    setToast(`${key.name} created`);
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="min-h-screen bg-[#0b0d0b] text-white selection:bg-[#b9f55d]/25">
      <CreateKeyModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createKey}
      />
      <EnvironmentOnboardingModal
        open={isEnvironmentOpen}
        onClose={() => setEnvironmentOpen(false)}
      />

      {toast && (
        <div
          className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#191c17] px-4 py-3 text-sm font-medium shadow-2xl"
          role="status"
        >
          <CheckCircle2 size={16} className="text-[#b9f55d]" /> {toast}
        </div>
      )}

      <div
        className={`fixed inset-0 z-30 bg-black/65 backdrop-blur-sm transition lg:hidden ${sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/[0.07] bg-[#0d0f0c] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[68px] items-center gap-3 border-b border-white/[0.065] px-5">
          <img
            src="/assets/logo/passway-logo-dark.svg"
            alt="Passway"
            className="h-8 w-auto"
          />
          <span className="rounded border border-white/[0.08] bg-white/[0.035] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/35">
            BETA
          </span>
          <button
            className="ml-auto text-white/35 transition hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3">
          <button className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.075] bg-white/[0.025] p-2 text-left transition hover:bg-white/[0.045]">
            <img
              src="/assets/logo/passway-mark-dark.svg"
              alt=""
              className="h-7 w-7 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white/85">
                Passway Cloud
              </span>
              <span className="block text-[10px] text-white/30">
                Pro workspace
              </span>
            </span>
            <ChevronDown size={14} className="text-white/30" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-3"
          aria-label="Dashboard navigation"
        >
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">
            Workspace
          </p>
          <div className="space-y-0.5">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition ${item.active ? "bg-white/[0.065] text-white" : "text-white/42 hover:bg-white/[0.035] hover:text-white/75"}`}
              >
                <item.icon
                  size={15}
                  strokeWidth={item.active ? 2.2 : 1.8}
                  className={item.active ? "text-[#b9f55d]" : ""}
                />
                {item.label}
                {item.count && (
                  <span className="ml-auto text-[10px] tabular-nums text-white/25">
                    {item.label === "SDK keys" ? keys.length : item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <p className="mb-2 mt-7 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">
            Developer surfaces
          </p>
          <div className="space-y-0.5">
            {surfaces.map((surface) => (
              <a
                key={surface.label}
                href={`https://${surface.domain}`}
                className="group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium text-white/42 transition hover:bg-white/[0.035] hover:text-white/75"
              >
                <surface.icon size={15} strokeWidth={1.8} />
                {surface.label}
                <ExternalLink
                  size={11}
                  className="ml-auto opacity-0 transition group-hover:opacity-60"
                />
              </a>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/[0.065] p-3">
          <UserMenu direct />
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center border-b border-white/[0.065] bg-[#0b0d0b]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/55 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={17} />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="hidden text-white/30 sm:inline">
              Passway Cloud
            </span>
            <ChevronRight
              size={13}
              className="hidden text-white/20 sm:inline"
            />
            <span className="truncate font-medium text-white/75">
              Production overview
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-white/40 transition hover:bg-white/[0.04] hover:text-white/70 md:flex">
              <Search size={14} /> Search
              <span className="ml-4 flex items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.035] px-1.5 py-0.5 font-mono text-[9px] text-white/25">
                <Command size={9} />K
              </span>
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-white/40 transition hover:bg-white/[0.04] hover:text-white/70"
              aria-label="Help"
            >
              <CircleHelp size={16} />
            </button>
            <button
              onClick={() => setEnvironmentOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white sm:inline-flex"
            >
              <Box size={14} /> New environment
            </button>
            <button
              onClick={() => setEnvironmentOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#b9f55d] px-3.5 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72] focus:outline-none focus:ring-4 focus:ring-[#b9f55d]/20"
            >
              <Plus size={14} strokeWidth={2.5} />{" "}
              <span className="hidden sm:inline">Create Environment</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <section className="flex flex-col gap-5 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-emerald-300/80">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                All systems operational
              </div>
              <h1 className="text-[28px] font-semibold tracking-[-0.045em] text-white sm:text-[34px]">
                Security control plane
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                Manage how your applications access encrypted secrets-without
                exposing secret values to source code, logs, or team members.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.085] px-3 text-xs font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-white">
                <Activity size={14} /> View audit log
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.085] px-3 text-xs font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-white">
                <BookOpen size={14} /> Docs <ArrowUpRight size={12} />
              </button>
            </div>
          </section>

          <section
            className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Key security metrics"
          >
            <MetricCard
              label="Active SDK keys"
              value={String(keys.length)}
              detail="All keys authenticated"
              icon={KeyRound}
              accent
            />
            <MetricCard
              label="Secrets protected"
              value="24"
              detail="Across 3 environments"
              icon={LockKeyhole}
            />
            <MetricCard
              label="Requests - 24h"
              value="468.4k"
              detail="99.99% delivery rate"
              icon={Activity}
            />
            <MetricCard
              label="Blocked attempts"
              value="12"
              detail="Policy engine enforced"
              icon={ShieldCheck}
            />
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[1.45fr_1fr]">
            <article className="relative overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 sm:p-6">
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#b9f55d]/[0.07] blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                      <Code2 size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white/90">
                        SDK quick start
                      </h2>
                      <p className="mt-0.5 text-[11px] text-white/35">
                        Connect in less than two minutes
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-md text-sm leading-6 text-white/40">
                    Install the SDK, add your public key identifier, and read
                    encrypted secrets at runtime. Decryption happens in
                    memory-never in your repository.
                  </p>
                </div>
                <a
                  href="https://docs.passway.co.in"
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#b9f55d] transition hover:text-[#d2ff8c]"
                >
                  Open guide <ArrowUpRight size={13} />
                </a>
              </div>
              <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.075] bg-black/25 font-mono text-[12px]">
                <div className="flex h-9 items-center border-b border-white/[0.065] px-3.5">
                  <span className="text-white/25">terminal</span>
                  <button
                    onClick={() => copyText("bun add @passway/sdk", "install")}
                    className="ml-auto flex items-center gap-1.5 text-[10px] text-white/30 transition hover:text-white"
                    aria-label="Copy install command"
                  >
                    {copied === "install" ? (
                      <Check size={13} className="text-[#b9f55d]" />
                    ) : (
                      <Copy size={12} />
                    )}{" "}
                    {copied === "install" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-3.5">
                  <span className="select-none text-[#b9f55d]">$</span>
                  <code className="text-white/65">bun add @passway/sdk</code>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white/90">
                    Surface health
                  </h2>
                  <p className="mt-1 text-[11px] text-white/35">
                    Live across the Passway network
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-1 text-[10px] font-medium text-emerald-300">
                  4 / 4 online
                </span>
              </div>
              <div className="mt-4 divide-y divide-white/[0.055]">
                {surfaces.map((surface) => (
                  <a
                    key={surface.label}
                    href={`https://${surface.domain}`}
                    className="group flex items-center gap-3 py-3"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/35">
                      <surface.icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-white/70">
                        {surface.label}
                      </span>
                      <span className="block truncate text-[10px] text-white/25">
                        {surface.domain}
                      </span>
                    </span>
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <ArrowUpRight
                      size={12}
                      className="text-white/20 transition group-hover:text-white/60"
                    />
                  </a>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-8" aria-labelledby="sdk-keys-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="sdk-keys-heading"
                  className="text-base font-semibold tracking-[-0.02em] text-white/90"
                >
                  SDK keys
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Application identities used to establish encrypted runtime
                  sessions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative flex-1 sm:w-56">
                  <span className="sr-only">Search SDK keys</span>
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search keys..."
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/20"
                  />
                </label>
                <div className="relative">
                  <SlidersHorizontal
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/30"
                  />
                  <select
                    value={environment}
                    onChange={(event) =>
                      setEnvironment(event.target.value as "All" | Environment)
                    }
                    className="h-9 appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f0c] pl-8 pr-8 text-xs text-white/50 outline-none"
                  >
                    <option value="All">All environments</option>
                    <option value="Production">Production</option>
                    <option value="Preview">Preview</option>
                    <option value="Development">Development</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/25"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.018]">
              <div className="hidden grid-cols-[1.4fr_1fr_1.15fr_.7fr_36px] gap-4 border-b border-white/[0.065] bg-white/[0.018] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 lg:grid">
                <span>Key</span>
                <span>Environment</span>
                <span>Last used</span>
                <span>Requests</span>
                <span />
              </div>
              {visibleKeys.length ? (
                visibleKeys.map((key) => (
                  <article
                    key={key.id}
                    className="group grid gap-4 border-b border-white/[0.055] px-4 py-4 last:border-0 sm:px-5 lg:grid-cols-[1.4fr_1fr_1.15fr_.7fr_36px] lg:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/40 transition group-hover:border-[#b9f55d]/20 group-hover:text-[#b9f55d]">
                        <Fingerprint size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-xs font-medium text-white/80">
                            {key.name}
                          </h3>
                          {key.status === "Rotate soon" && (
                            <span className="rounded bg-amber-400/[0.08] px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                              Rotate soon
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => copyText(key.fingerprint, key.id)}
                          className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-white/28 transition hover:text-white/60"
                          aria-label={`Copy fingerprint for ${key.name}`}
                        >
                          {key.fingerprint}{" "}
                          {copied === key.id ? (
                            <Check size={11} className="text-[#b9f55d]" />
                          ) : (
                            <Clipboard size={10} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <EnvironmentBadge environment={key.environment} />
                    </div>
                    <div>
                      <p className="text-[11px] text-white/55">
                        {key.lastUsed}
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">
                        Created {key.created}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-white/55">
                        {key.requests}
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">
                        last 30 days
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/${key.environment.toLowerCase()}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-white/25 transition hover:bg-white/[0.05] hover:text-white"
                      aria-label={`Open ${key.environment} environment for ${key.name}`}
                    >
                      <Ellipsis size={16} />
                    </Link>
                  </article>
                ))
              ) : (
                <div className="grid place-items-center px-6 py-16 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-white/25">
                    <Search size={16} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-white/60">
                    No keys found
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Try another search or environment.
                  </p>
                </div>
              )}
            </div>
          </section>

          <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] py-5 text-[10px] text-white/22 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Passway encrypts secret payloads with envelope encryption and
              scoped runtime access.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.passway.co.in/security"
                className="hover:text-white/50"
              >
                Security
              </a>
              <a
                href="https://passway.co.in/status"
                className="hover:text-white/50"
              >
                Status
              </a>
              <span>API v1</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
