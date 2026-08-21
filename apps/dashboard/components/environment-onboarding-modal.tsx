"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type EnvironmentType =
  "Production" | "Development" | "Staging" | "Preview" | "Testing" | "CI/CD";
type SecretDraft = { id: string; key: string; value: string };

const types: { name: EnvironmentType; detail: string; dot: string }[] = [
  {
    name: "Production",
    detail: "Live customer traffic",
    dot: "bg-emerald-400",
  },
  { name: "Development", detail: "Local development", dot: "bg-sky-400" },
  { name: "Staging", detail: "Pre-release verification", dot: "bg-amber-400" },
  { name: "Preview", detail: "Pull requests & branches", dot: "bg-violet-400" },
  { name: "Testing", detail: "Automated test runs", dot: "bg-blue-400" },
  { name: "CI/CD", detail: "Build and deployment jobs", dot: "bg-pink-400" },
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

export function EnvironmentOnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState<EnvironmentType>("Development");
  const [description, setDescription] = useState("");
  const [secrets, setSecrets] = useState<SecretDraft[]>([]);
  const [manualKey, setManualKey] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const slug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  useEffect(() => {
    if (!open) {
      setStep(1);
      setError(null);
    }
  }, [open]);

  if (!open) return null;
  const addManual = () => {
    const key = manualKey.trim().toUpperCase().replace(/\s+/g, "_");
    if (!key || !manualValue.trim()) return;
    setSecrets((current) => [
      ...current.filter((item) => item.key !== key),
      { id: `secret_${Date.now()}`, key, value: manualValue.trim() },
    ]);
    setManualKey("");
    setManualValue("");
  };
  const readFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = String(reader.result)
        .split(/\r?\n/)
        .flatMap((line, index) => {
          const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
          if (!match) return [];
          return [
            {
              id: `secret_${Date.now()}_${index}`,
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
  const continueFlow = () => {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError("Give this environment a name to continue.");
      return;
    }
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
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
    onClose();
    router.push("/dashboard/environments");
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0f120f] shadow-[0_24px_90px_rgba(0,0,0,.65)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="environment-modal-title"
      >
        <header className="flex shrink-0 items-start justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b9f55d]/75">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b9f55d]" />{" "}
              Environment onboarding
            </div>
            <h2
              id="environment-modal-title"
              className="mt-2 text-lg font-semibold tracking-[-0.025em] text-white"
            >
              Create an environment
            </h2>
            <p className="mt-1 text-xs text-white/35">
              Set up a secure boundary for runtime configuration.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close onboarding"
          >
            <X size={17} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div
            className="mb-6 flex items-center gap-2"
            aria-label="Onboarding progress"
          >
            {["Details", "Secrets", "Review"].map((label, index) => {
              const number = index + 1;
              const done = number < step;
              return (
                <div
                  key={label}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${done ? "border-[#b9f55d]/40 bg-[#b9f55d]/10 text-[#b9f55d]" : number === step ? "border-[#b9f55d] bg-[#b9f55d] text-[#11140c]" : "border-white/[0.12] text-white/30"}`}
                  >
                    {done ? <Check size={12} strokeWidth={2.5} /> : number}
                  </span>
                  <span
                    className={`shrink-0 whitespace-nowrap text-[11px] ${number === step ? "font-medium text-white/80" : "text-white/30"}`}
                  >
                    {label}
                  </span>
                  {number < 3 && (
                    <span className="h-px min-w-2 flex-1 bg-white/[0.08]" />
                  )}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-medium text-white/65">
                    Environment name
                  </span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. AmiWorthy production"
                    className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-[#b9f55d]/45 focus:ring-4 focus:ring-[#b9f55d]/[0.06]"
                  />
                  <span className="mt-1.5 block font-mono text-[9px] text-white/25">
                    /dashboard/{slug}
                  </span>
                </label>
                <div>
                  <span className="mb-2 block text-[11px] font-medium text-white/65">
                    Created securely
                  </span>
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] px-3 text-[10px] text-emerald-200/65">
                    <ShieldCheck size={13} className="text-emerald-300" />{" "}
                    Encrypted by default
                  </div>
                </div>
              </div>
              <fieldset>
                <legend className="mb-2 text-[11px] font-medium text-white/65">
                  Environment type
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {types.map((item) => {
                    const selected = type === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setType(item.name)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition ${selected ? "border-[#b9f55d]/35 bg-[#b9f55d]/[0.06]" : "border-white/[0.08] bg-black/15 hover:border-white/20"}`}
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${item.dot}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-[11px] font-medium ${selected ? "text-white" : "text-white/65"}`}
                          >
                            {item.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[9px] text-white/25">
                            {item.detail}
                          </span>
                        </span>
                        {selected && (
                          <Check size={12} className="text-[#b9f55d]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-2 block text-[11px] font-medium text-white/65">
                  Description{" "}
                  <span className="font-normal text-white/25">(optional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this environment used for?"
                  className="min-h-20 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-[#b9f55d]/45"
                />
              </label>
              <div className="flex gap-2 rounded-lg border border-white/[0.07] bg-white/[0.018] px-3 py-2.5 text-[10px] leading-4 text-white/35">
                <Info size={13} className="mt-0.5 shrink-0 text-white/30" /> You
                can add more environments later without duplicating the
                workspace.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group rounded-xl border border-white/[0.09] bg-black/20 p-4 text-left transition hover:border-[#b9f55d]/30 hover:bg-[#b9f55d]/[0.035]"
                >
                  <span className="grid size-8 place-items-center rounded-lg border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
                    <Upload size={15} />
                  </span>
                  <p className="mt-3 text-xs font-semibold text-white/85">
                    Upload .env file
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-white/35">
                    Import key/value pairs from an existing environment file.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#b9f55d]">
                    {fileName || "Choose a file"} <FileUp size={12} />
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".env,.txt"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readFile(file);
                    }}
                  />
                </button>
                <div className="rounded-xl border border-white/[0.09] bg-black/20 p-4">
                  <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50">
                    <Plus size={15} />
                  </span>
                  <p className="mt-3 text-xs font-semibold text-white/85">
                    Add manually
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={manualKey}
                      onChange={(event) => setManualKey(event.target.value)}
                      placeholder="SECRET_KEY"
                      className="mono h-8 min-w-0 rounded-md border border-white/[0.08] bg-black/20 px-2.5 text-[10px] uppercase text-white outline-none placeholder:normal-case placeholder:text-white/25 focus:border-[#b9f55d]/40"
                    />
                    <input
                      value={manualValue}
                      onChange={(event) => setManualValue(event.target.value)}
                      placeholder="Value"
                      type="password"
                      className="mono h-8 min-w-0 rounded-md border border-white/[0.08] bg-black/20 px-2.5 text-[10px] text-white outline-none placeholder:font-sans placeholder:text-white/25 focus:border-[#b9f55d]/40"
                    />
                    <button
                      type="button"
                      onClick={addManual}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-white/[0.09] px-2.5 text-[10px] font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
              </div>
              {secrets.length ? (
                <div className="overflow-hidden rounded-xl border border-white/[0.075] bg-white/[0.018]">
                  <div className="flex items-center justify-between border-b border-white/[0.065] px-4 py-2.5">
                    <p className="text-[11px] font-semibold text-white/70">
                      Secrets to import{" "}
                      <span className="ml-1 text-white/30">
                        {secrets.length}
                      </span>
                    </p>
                    <span className="rounded-full border border-[#b9f55d]/20 bg-[#b9f55d]/[0.07] px-2 py-1 text-[9px] text-[#b9f55d]">
                      Encrypted on save
                    </span>
                  </div>
                  {secrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="flex items-center gap-2 border-b border-white/[0.055] px-4 py-2.5 last:border-0"
                    >
                      <FileKey2 size={13} className="text-white/35" />
                      <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-white/65">
                        {secret.key}
                      </code>
                      <span className="font-mono text-[9px] text-white/25">
                        ••••••••
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSecrets((current) =>
                            current.filter((item) => item.id !== secret.id),
                          )
                        }
                        className="grid size-6 place-items-center rounded text-white/20 transition hover:bg-red-400/10 hover:text-red-300"
                        aria-label={`Remove ${secret.key}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.1] p-7 text-center">
                  <FileKey2 size={17} className="mx-auto text-white/25" />
                  <p className="mt-2 text-xs font-medium text-white/55">
                    No secrets added yet
                  </p>
                  <p className="mt-1 text-[10px] text-white/25">
                    You can skip this step and add them from the environment
                    dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.075] bg-black/20">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[11px] text-white/35">Name</span>
                  <span className="text-xs font-medium text-white/80">
                    {name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[11px] text-white/35">Type</span>
                  <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[10px] text-white/65">
                    {type}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[11px] text-white/35">Dashboard</span>
                  <span className="font-mono text-[10px] text-[#b9f55d]">
                    /dashboard/{slug}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[11px] text-white/35">Secrets</span>
                  <span className="text-[11px] text-white/65">
                    {secrets.length} ready to encrypt
                  </span>
                </div>
                <div className="px-4 py-3">
                  <span className="block text-[11px] text-white/35">
                    Description
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-5 text-white/60">
                    {description || "No description added"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 rounded-lg border border-[#b9f55d]/15 bg-[#b9f55d]/[0.04] px-3 py-2.5 text-[10px] leading-4 text-white/45">
                <ShieldCheck
                  size={13}
                  className="mt-0.5 shrink-0 text-[#b9f55d]"
                />
                <span>
                  <b className="font-medium text-white/75">
                    Secure by default.
                  </b>{" "}
                  Values are encrypted before being stored and scoped to this
                  environment.
                </span>
              </div>
            </div>
          )}
          {error && (
            <p
              className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-[10px] text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.07] px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.09] px-3 text-[11px] font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <button
            type="button"
            onClick={continueFlow}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#b9f55d] px-3.5 text-[11px] font-semibold text-[#10130d] transition hover:bg-[#c8ff72] focus:outline-none focus:ring-4 focus:ring-[#b9f55d]/20"
          >
            {step === 3 ? "Create Environment" : "Continue"}
            <ArrowRight size={13} />
          </button>
        </footer>
      </section>
    </div>
  );
}
