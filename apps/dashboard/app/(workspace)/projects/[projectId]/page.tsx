import { Activity, KeyRound, LockKeyhole, Network } from "lucide-react";
import { Card } from "@/components/ui";
import { ProjectPageShell } from "@/components/project-page-shell";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <ProjectPageShell projectId={projectId}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<LockKeyhole />} label="Secrets" value="12" />
        <Stat icon={<KeyRound />} label="Active tokens" value="2" />
        <Stat icon={<Network />} label="IP rules" value="3" />
        <Stat icon={<Activity />} label="24h requests" value="184" />
      </div>
      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Runtime setup</h2>
        <p className="mt-2 text-sm text-[#8B949E]">
          Install the Node SDK and load this project’s secrets before your
          application starts.
        </p>
        <pre className="mono mt-5 overflow-x-auto rounded-lg border border-[#1D2633] bg-[#05070A] p-4 text-sm text-blue-300">
          <code>npm install @passway/envvault</code>
        </pre>
      </Card>
    </ProjectPageShell>
  );
}
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <span className="text-blue-400">{icon}</span>
      <p className="mt-5 text-sm text-[#8B949E]">{label}</p>
      <b className="mono mt-1 block text-2xl">{value}</b>
    </Card>
  );
}
