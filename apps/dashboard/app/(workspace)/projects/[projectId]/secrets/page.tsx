import { EyeOff, LockKeyhole, Plus } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { ProjectPageShell } from "@/components/project-page-shell";
import { secrets } from "@/lib/mock-data";

export default async function SecretsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <ProjectPageShell projectId={projectId}>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-semibold">Secrets</h2>
          <p className="mt-1 text-sm text-[#8B949E]">
            Values remain hidden after they are saved.
          </p>
        </div>
        <Button>
          <Plus size={16} />
          Add secret
        </Button>
      </div>
      <Card>
        {secrets.length === 0 ? (
          <EmptyState
            icon={<LockKeyhole />}
            title="No secrets yet"
            body="Add your first environment variable to this vault."
          />
        ) : (
          <div className="divide-y divide-[#1D2633]">
            {secrets.map((secret) => (
              <div
                key={secret.key}
                className="grid items-center gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]"
              >
                <span className="mono text-sm font-semibold">{secret.key}</span>
                <span className="mono flex items-center gap-2 text-sm tracking-widest text-[#8B949E]">
                  <EyeOff size={14} />
                  ••••••••••••••••
                </span>
                <span className="text-xs text-[#8B949E]">{secret.updated}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </ProjectPageShell>
  );
}
