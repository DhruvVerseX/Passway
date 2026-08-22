import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { ProjectPageShell } from "@/components/project-page-shell";

export default async function TokensPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <ProjectPageShell projectId={projectId}>
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8B949E]">
          Runtime access
        </p>
        <h2 className="mt-2 font-semibold">Environment tokens</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#8B949E]">
          Passway runtime tokens belong to hosted environments, not projects. Host an environment to receive a registered token for the CLI and runtime SDK.
        </p>
      </div>

      <Card className="mb-5 border-[#b9f55d]/25 bg-[#b9f55d]/[.04] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-xl border border-[#b9f55d]/20 bg-[#b9f55d]/10 text-[#b9f55d]">
            <ShieldCheck size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white/90">
              Tokens are issued when an environment is hosted
            </h3>
            <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#8B949E]">
              The full token is shown once after hosting, stored only as a hash, and registered against its environment. Do not use legacy project-token previews or token hints with <code className="mono text-[#b9f55d]">passway start</code>.
            </p>
            <Link
              href="/dashboard/environments"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#b9f55d] px-3.5 text-xs font-semibold text-[#10130d] transition hover:bg-[#c8ff72]"
            >
              Open environments
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 p-5">
          <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/40">
            <KeyRound size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white/80">
              No project-level token previews
            </h3>
            <p className="mt-1 text-xs text-[#8B949E]">
              Choose an environment to host, reveal, rotate, or revoke its runtime access token.
            </p>
          </div>
        </div>
      </Card>
    </ProjectPageShell>
  );
}
