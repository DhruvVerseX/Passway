"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Clipboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ControlPlaneShell } from "@/components/control-plane-shell";
import { EnvironmentOnboardingModal } from "@/components/environment-onboarding-modal";
import {
  deleteEnvironment,
  listEnvironments,
  resolveProjectId,
  type ApiEnvironment,
} from "@/lib/passway-api";

type EnvironmentType =
  "Production" | "Development" | "Staging" | "Preview" | "Testing" | "CI/CD";
type Environment = {
  id: string;
  name: string;
  type: EnvironmentType;
  description: string;
  secrets: number;
  tokens: number;
  status: "Healthy" | "Needs attention";
  updated: string;
};

function fromApiEnvironment(item: ApiEnvironment): Environment {
  return {
    id: item.id,
    name: item.name,
    type:
      item.type === "custom"
        ? "CI/CD"
        : ((item.type.charAt(0).toUpperCase() +
            item.type.slice(1)) as EnvironmentType),
    description: item.description ?? "No description added.",
    secrets: 0,
    tokens: 0,
    status: item.status === "disabled" ? "Needs attention" : "Healthy",
    updated: new Date(item.updatedAt).toLocaleDateString(),
  };
}

const typeTone: Record<EnvironmentType, string> = {
  Production: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
  Development: "border-sky-400/15 bg-sky-400/[0.07] text-sky-300",
  Staging: "border-amber-400/15 bg-amber-400/[0.07] text-amber-300",
  Preview: "border-violet-400/15 bg-violet-400/[0.07] text-violet-300",
  Testing: "border-blue-400/15 bg-blue-400/[0.07] text-blue-300",
  "CI/CD": "border-pink-400/15 bg-pink-400/[0.07] text-pink-300",
};

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const projectId = await resolveProjectId();
        if (projectId) {
          const result = await listEnvironments(projectId);
          if (active) {
            setEnvironments(result.environments.map(fromApiEnvironment));
          }
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load environments from Passway.",
          );
        }
      }

      if (active) setIsLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return environments.filter(
      (item) =>
        !value ||
        `${item.name} ${item.type} ${item.description}`
          .toLowerCase()
          .includes(value),
    );
  }, [environments, query]);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };
  const copyLink = async (environment: Environment) => {
    const url = `${window.location.origin}/dashboard/${environment.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* embedded previews can block clipboard */
    }
    notify("Dashboard link copied");
  };
  const remove = async (environment: Environment) => {
    if (removingId) return;
    setRemovingId(environment.id);

    try {
      await deleteEnvironment(environment.id);
      window.sessionStorage.removeItem(`passway_environment_${environment.id}`);
      setEnvironments((current) =>
        current.filter((item) => item.id !== environment.id),
      );
      notify(`${environment.name} removed from this workspace`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : `Unable to remove ${environment.name}`,
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <ControlPlaneShell
      active="Environments"
      title="Environments"
      showCreate={false}
    >
      <EnvironmentOnboardingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#191c17] px-4 py-3 text-sm font-medium shadow-2xl"
          role="status"
        >
          <CheckCircle2 size={16} className="text-[#b9f55d]" /> {toast}
        </div>
      )}
      <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-[#b9f55d]/80">
            <span className="h-2 w-2 rounded-full bg-[#b9f55d]" /> Workspace
            environments
          </div>
          <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[34px]">
            Environments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Separate secrets, runtime access, and policies by the way your
            applications run.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#b9f55d] px-3.5 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72]"
        >
          <Plus size={14} strokeWidth={2.5} /> Create Environment
        </button>
      </div>

      <section className="mt-8">
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.018]">
          <div className="hidden grid-cols-[1.35fr_1fr_1fr_.8fr_124px] gap-4 border-b border-white/[0.065] bg-white/[0.018] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 lg:grid">
            <span>Environment</span>
            <span>Type</span>
            <span>Status</span>
            <span>Secrets</span>
            <span />
          </div>
          {isLoading ? (
            <div
              className="divide-y divide-white/[0.055]"
              aria-label="Loading environments"
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1.35fr_1fr_1fr_.8fr_124px] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-9 animate-pulse rounded-xl bg-white/[0.06]" />
                    <span className="space-y-2">
                      <span className="block h-2.5 w-32 animate-pulse rounded bg-white/[0.07]" />
                      <span className="block h-2 w-48 animate-pulse rounded bg-white/[0.04]" />
                    </span>
                  </div>
                  <span className="h-6 w-20 animate-pulse rounded-md bg-white/[0.05]" />
                  <span className="h-3 w-24 animate-pulse rounded bg-white/[0.05]" />
                  <span className="h-3 w-16 animate-pulse rounded bg-white/[0.05]" />
                  <span />
                </div>
              ))}
            </div>
          ) : visible.length ? (
            visible.map((environment) => (
              <article
                key={environment.id}
                className="group grid gap-4 border-b border-white/[0.055] px-4 py-4 last:border-0 sm:px-5 lg:grid-cols-[1.35fr_1fr_1fr_.8fr_124px] lg:items-center"
              >
                <Link
                  href={`/dashboard/${environment.id}`}
                  className="flex min-w-0 items-start gap-3"
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/40 transition group-hover:border-[#b9f55d]/20 group-hover:text-[#b9f55d]">
                    <Box size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-white/80">
                        {environment.name}
                      </span>
                      <ArrowUpRight
                        size={12}
                        className="shrink-0 text-white/25 transition group-hover:text-[#b9f55d]"
                      />
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-white/25">
                      {environment.description}
                    </span>
                  </span>
                </Link>
                <div>
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-medium ${typeTone[environment.type]}`}
                  >
                    {environment.type}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] ${environment.status === "Healthy" ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${environment.status === "Healthy" ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                    {environment.status}
                  </span>
                  <span className="mt-1 block text-[10px] text-white/25">
                    Updated {environment.updated}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs text-white/60">
                    {environment.secrets}
                  </span>
                  <span className="mt-1 block text-[10px] text-white/25">
                    secrets · {environment.tokens} tokens
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => copyLink(environment)}
                    className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-white/[0.05] hover:text-white"
                    aria-label={`Copy ${environment.name} dashboard link`}
                  >
                    <Clipboard size={14} />
                  </button>
                  <Link
                    href={`/dashboard/${environment.id}`}
                    className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-white/[0.05] hover:text-[#b9f55d]"
                    aria-label={`Manage ${environment.name}`}
                  >
                    <Settings2 size={14} />
                  </Link>
                  <button
                    onClick={() => void remove(environment)}
                    disabled={removingId === environment.id}
                    className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-red-400/10 hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
                    aria-label={`Remove ${environment.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => notify(`${environment.name} actions`)}
                    className="grid size-8 place-items-center rounded-lg text-white/20 transition hover:bg-white/[0.05] hover:text-white"
                    aria-label={`More actions for ${environment.name}`}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="grid place-items-center px-6 py-16 text-center">
              <span className="grid size-10 place-items-center rounded-xl border border-white/[0.07] text-white/25">
                <AlertTriangle size={16} />
              </span>
              <p className="mt-3 text-sm font-medium text-white/60">
                {loadError
                  ? "Unable to load environments"
                  : "No environments found"}
              </p>
              <p className="mt-1 max-w-md text-xs text-white/30">
                {loadError ??
                  "Create an environment to start managing encrypted secrets and runtime access."}
              </p>
            </div>
          )}
        </div>
      </section>
      <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] py-5 text-[10px] text-white/22 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Each environment has its own encrypted values, tokens, and access
          policy.
        </p>
        <span>{environments.length} environments in workspace</span>
      </footer>
    </ControlPlaneShell>
  );
}
