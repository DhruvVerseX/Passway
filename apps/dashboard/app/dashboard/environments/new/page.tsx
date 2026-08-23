"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileKey2,
  FileUp,
  Info,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ControlPlaneShell } from "@/components/control-plane-shell";

type EnvironmentType =
  "Production" | "Development" | "Staging" | "Preview" | "Testing" | "CI/CD";
type SecretDraft = { id: string; key: string; value: string };

const steps = ["Vault details", "Add secrets", "Review & create"];
const environmentTypes: {
  name: EnvironmentType;
  detail: string;
  color: string;
}[] = [
  { name: "Production", detail: "Live customer traffic", color: "emerald" },
  { name: "Development", detail: "Local development", color: "sky" },
  { name: "Staging", detail: "Pre-release verification", color: "amber" },
  { name: "Preview", detail: "Pull requests & branches", color: "violet" },
  { name: "Testing", detail: "Automated test runs", color: "blue" },
  { name: "CI/CD", detail: "Build and deployment jobs", color: "pink" },
];

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "environment"
  );
}
function colorClasses(color: string, selected: boolean) {
  const map: Record<string, string> = {
    emerald: "emerald-400",
    sky: "sky-400",
    amber: "amber-400",
    violet: "violet-400",
    blue: "blue-400",
    pink: "pink-400",
  };
  const c = map[color] ?? "white";
  return selected
    ? `border-${c}/40 bg-${c}/[0.07]`
    : "border-white/[0.08] bg-black/15 hover:border-white/20 hover:bg-white/[0.035]";
}

export default function CreateEnvironmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState<EnvironmentType>("Development");
  const [description, setDescription] = useState("");
  const [secrets, setSecrets] = useState<SecretDraft[]>([]);
  const [manualKey, setManualKey] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const slug = useMemo(() => slugify(name), [name]);
  const addManualSecret = () => {
    const key = manualKey.trim().toUpperCase().replace(/\s+/g, "_");
    if (!key || !manualValue.trim()) return;
    setSecrets((current) => [
      ...current.filter((item) => item.key !== key),
      { id: `secret_${Date.now()}`, key, value: manualValue.trim() },
    ]);
    setManualKey("");
    setManualValue("");
  };
  const parseEnvFile = (file: File) => {
    setUploadName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = String(reader.result)
        .split(/\r?\n/)
        .flatMap((line) => {
          const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
          if (!match) return [];
          return [
            {
              id: `secret_${Date.now()}_${match[1]}`,
              key: match[1],
              value: match[2].trim().replace(/^['"]|['"]$/g, ""),
            },
          ];
        });
      setSecrets((current) => [
        ...current,
        ...parsed.filter(
          (item) => !current.some((existing) => existing.key === item.key),
        ),
      ]);
    };
    reader.readAsText(file);
  };
  const removeSecret = (id: string) =>
    setSecrets((current) => current.filter((secret) => secret.id !== id));
  const next = () => {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError("Give this vault a name to continue.");
      return;
    }
    if (step < 3) setStep((current) => current + 1);
    else {
      sessionStorage.setItem(
        `passway_environment_${slug}`,
        JSON.stringify({
          name: name.trim(),
          slug,
          type,
          description: description.trim(),
          secrets,
          createdAt: new Date().toISOString(),
        }),
      );
      router.push("/dashboard/environments");
    }
  };

  return (
    <ControlPlaneShell
      active="Vaults"
      title={step === 1 ? "Create Vault" : name || "New Vault"}
      showCreate={false}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"
            >
              <ArrowLeft size={14} /> Overview
            </Link>
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#b9f55d]/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b9f55d]" />{" "}
              Vault onboarding
            </div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.045em] text-white sm:text-[32px]">
              Create a vault.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
              Give your vault a secure boundary for runtime configuration,
              then add the values it needs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <ShieldCheck size={14} className="text-[#b9f55d]" /> Encrypted by
            default
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <nav
              aria-label="Onboarding progress"
              className="mb-5 flex items-center gap-2 overflow-x-auto"
            >
              {steps.map((label, index) => {
                const number = index + 1;
                const done = number < step;
                return (
                  <div key={label} className="flex shrink-0 items-center gap-2">
                    <div
                      className={`grid size-7 place-items-center rounded-full border text-[11px] font-semibold ${done ? "border-[#b9f55d]/40 bg-[#b9f55d]/10 text-[#b9f55d]" : number === step ? "border-[#b9f55d] bg-[#b9f55d] text-[#11140c]" : "border-white/[0.12] text-white/30"}`}
                    >
                      {done ? <Check size={13} strokeWidth={2.5} /> : number}
                    </div>
                    <span
                      className={`text-xs ${number === step ? "font-medium text-white/80" : "text-white/30"}`}
                    >
                      {label}
                    </span>
                    {number < steps.length && (
                      <ChevronRight size={13} className="mx-1 text-white/15" />
                    )}
                  </div>
                );
              })}
            </nav>

            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                      <KeyRound size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white/90">
                        Vault details
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Name the boundary and tell your team what it is used
                        for.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-white/65">
                        Vault name
                      </span>
                      <input
                        autoFocus
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#b9f55d]/45 focus:ring-4 focus:ring-[#b9f55d]/[0.06]"
                        placeholder="e.g. AmiWorthy production"
                      />
                      <span className="mt-2 block text-[10px] text-white/25">
                        Dashboard URL: /dashboard/{slug}
                      </span>
                    </label>
                    <fieldset>
                      <legend className="mb-2 text-xs font-medium text-white/65">
                        Hosting profile
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {environmentTypes.map((item) => {
                          const selected = type === item.name;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => setType(item.name)}
                              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${colorClasses(item.color, selected)} ${selected ? "ring-4 ring-white/[0.02]" : ""}`}
                            >
                              <span
                                className={`size-2 shrink-0 rounded-full bg-${item.color}-400`}
                              />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block text-xs font-semibold ${selected ? "text-white" : "text-white/70"}`}
                                >
                                  {item.name}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-white/30">
                                  {item.detail}
                                </span>
                              </span>
                              {selected && (
                                <Check size={14} className="text-[#b9f55d]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-white/65">
                        Description{" "}
                        <span className="font-normal text-white/25">
                          (optional)
                        </span>
                      </span>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#b9f55d]/45 focus:ring-4 focus:ring-[#b9f55d]/[0.06]"
                        placeholder="What does this vault protect?"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4 text-xs leading-5 text-white/40">
                  <Info size={15} className="shrink-0 text-white/35" /> You can
                  create additional vaults later without duplicating your
                  workspace.
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                      <LockKeyhole size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white/90">
                        Add secrets
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Upload an existing .env file or add values manually. You
                        can always change these later.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group rounded-2xl border border-white/[0.09] bg-black/20 p-5 text-left transition hover:border-[#b9f55d]/30 hover:bg-[#b9f55d]/[0.035]"
                    >
                      <span className="grid size-10 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                        <Upload size={17} />
                      </span>
                      <p className="mt-5 text-sm font-semibold text-white/85">
                        Upload .env file
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Import key/value pairs from your existing environment
                        file.
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#b9f55d]">
                        {uploadName || "Choose a file only"} <FileUp size={13} />
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".env,.txt,text/plain"
                        multiple={false}
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) parseEnvFile(file);
                        }}
                      />
                    </button>
                    <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-5">
                      <span className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50">
                        <Plus size={17} />
                      </span>
                      <p className="mt-5 text-sm font-semibold text-white/85">
                        Add manually
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Create a key and value one at a time.
                      </p>
                      <div className="mt-4 space-y-2">
                        <input
                          value={manualKey}
                          onChange={(event) => setManualKey(event.target.value)}
                          placeholder="SECRET_KEY"
                          className="mono h-9 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-[11px] uppercase text-white outline-none placeholder:normal-case placeholder:text-white/25 focus:border-[#b9f55d]/40"
                        />
                        <input
                          value={manualValue}
                          onChange={(event) =>
                            setManualValue(event.target.value)
                          }
                          placeholder="Secret value"
                          type="password"
                          className="mono h-9 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-[11px] text-white outline-none placeholder:font-sans placeholder:text-white/25 focus:border-[#b9f55d]/40"
                        />
                        <button
                          type="button"
                          onClick={addManualSecret}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-[11px] font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          <Plus size={13} /> Add key
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {secrets.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.018]">
                    <div className="flex items-center justify-between border-b border-white/[0.065] px-5 py-3">
                      <div>
                        <p className="text-xs font-semibold text-white/75">
                          Secrets to import
                        </p>
                        <p className="mt-1 text-[10px] text-white/30">
                          {secrets.length} value
                          {secrets.length === 1 ? "" : "s"} ready for{" "}
                          {type.toLowerCase()}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#b9f55d]/20 bg-[#b9f55d]/[0.07] px-2 py-1 text-[10px] text-[#b9f55d]">
                        Encrypted on save
                      </span>
                    </div>
                    {secrets.map((secret) => (
                      <div
                        key={secret.id}
                        className="flex items-center gap-3 border-b border-white/[0.055] px-5 py-3 last:border-0"
                      >
                        <span className="grid size-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/40">
                          <FileKey2 size={14} />
                        </span>
                        <code className="min-w-0 flex-1 truncate font-mono text-xs text-white/65">
                          {secret.key}
                        </code>
                        <span className="font-mono text-[10px] text-white/25">
                          ••••••••••••
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSecret(secret.id)}
                          className="grid size-7 place-items-center rounded-md text-white/25 transition hover:bg-red-400/10 hover:text-red-300"
                          aria-label={`Remove ${secret.key}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center">
                    <span className="mx-auto grid size-10 place-items-center rounded-xl border border-white/[0.07] text-white/25">
                      <FileKey2 size={16} />
                    </span>
                    <p className="mt-3 text-sm font-medium text-white/60">
                      No secrets added yet
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      You can skip this step and add them from the vault dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                      <ShieldCheck size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white/90">
                        Review & create
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Check the vault details before creating its secure
                        boundary.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 divide-y divide-white/[0.06] rounded-xl border border-white/[0.075] bg-black/20">
                    <div className="flex items-center justify-between gap-4 p-4">
                      <span className="text-xs text-white/35">Name</span>
                      <span className="text-xs font-medium text-white/80">
                        {name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4">
                      <span className="text-xs text-white/35">Type</span>
                      <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[11px] text-white/65">
                        {type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4">
                      <span className="text-xs text-white/35">URL</span>
                      <span className="font-mono text-xs text-[#b9f55d]">
                        /dashboard/{slug}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4">
                      <span className="text-xs text-white/35">Secrets</span>
                      <span className="text-xs text-white/65">
                        {secrets.length} ready to encrypt
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="block text-xs text-white/35">
                        Description
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-white/60">
                        {description || "No description added"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-[#b9f55d]/15 bg-[#b9f55d]/[0.04] p-4">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-[#b9f55d]"
                  />
                  <p className="text-xs leading-5 text-white/45">
                    <span className="font-medium text-white/75">
                      Secure by default.
                    </span>{" "}
                    Values are encrypted before being stored and scoped to this
                    vault.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p
                className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] px-4 text-xs font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-white disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b9f55d] px-4 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72] focus:outline-none focus:ring-4 focus:ring-[#b9f55d]/20"
              >
                {step === 3 ? "Create Vault" : "Continue"}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
          <aside className="h-fit space-y-3 xl:sticky xl:top-[84px]">
            <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.025]">
              <div className="border-b border-white/[0.065] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">
                  Vault preview
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <img
                    src="/assets/logo/passway-mark-dark.svg"
                    alt=""
                    className="size-9"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white/85">
                      {name || "Your vault"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {type} · {secrets.length} secrets
                    </p>
                  </div>
                  <span className="ml-auto h-2 w-2 rounded-full bg-[#b9f55d]" />
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[10px] text-white/30">Dashboard URL</p>
                  <p className="mt-1 truncate font-mono text-xs text-[#b9f55d]/80">
                    /dashboard/{slug}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30">Description</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    {description || "Optional context for your team"}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] p-3 text-[10px] leading-4 text-emerald-200/65">
                  <CheckCircle2
                    size={13}
                    className="shrink-0 text-emerald-300"
                  />{" "}
                  Access policy ready
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.075] bg-white/[0.018] p-5">
              <div className="flex items-center gap-2">
                <LockKeyhole size={14} className="text-[#b9f55d]" />
                <p className="text-xs font-medium text-white/70">
                  Keep secrets out of source code
                </p>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/35">
                Passway manages encrypted values at runtime so your repository
                never needs another committed .env file.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </ControlPlaneShell>
  );
}
