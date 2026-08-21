import { KeyRound, Plus, RotateCcw, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, EmptyState } from "@/components/ui";
import { ProjectPageShell } from "@/components/project-page-shell";
import { tokens } from "@/lib/mock-data";

const generatedToken = "evt_dev_7f39c88a4e5b2f10d7a6c3ef";
export default async function TokensPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <ProjectPageShell projectId={projectId}>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-semibold">Project tokens</h2>
          <p className="mt-1 text-sm text-[#8B949E]">
            Revokable credentials used by the runtime SDK.
          </p>
        </div>
        <Button>
          <Plus size={16} />
          Generate token
        </Button>
      </div>
      <Card className="mb-5 border-blue-500/30 bg-blue-500/[.04] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
          <KeyRound size={16} />
          Generated token preview
        </div>
        <p className="mt-2 text-xs text-[#8B949E]">
          This is the only UI where the raw token is shown. Copy it now.
        </p>
        <div className="mt-4 flex items-center rounded-lg border border-blue-500/20 bg-[#05070A] pl-4">
          <code className="mono min-w-0 flex-1 overflow-x-auto py-3 text-sm">
            {generatedToken}
          </code>
          <CopyButton value={generatedToken} label="Copy token" />
        </div>
      </Card>
      <Card>
        {tokens.length === 0 ? (
          <EmptyState
            icon={<KeyRound />}
            title="No active tokens"
            body="Generate a scoped token to fetch secrets at runtime."
          />
        ) : (
          <div className="divide-y divide-[#1D2633]">
            {tokens.map((token) => (
              <div key={token.id} className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <b className="text-sm">{token.label}</b>
                    <code className="mono mt-2 block text-xs text-[#8B949E]">
                      {token.value}
                    </code>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="rounded-md p-2 text-[#8B949E] hover:bg-white/5"
                      aria-label="Rotate token"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      className="rounded-md p-2 text-red-400 hover:bg-red-500/10"
                      aria-label="Revoke token"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex gap-5 text-xs text-[#8B949E]">
                  <span>Created {token.created}</span>
                  <span>Last used {token.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </ProjectPageShell>
  );
}
