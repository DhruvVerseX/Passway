import { Button, Card } from "@/components/ui";
import { ProjectPageShell } from "@/components/project-page-shell";
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <ProjectPageShell projectId={projectId}>
      <div className="max-w-2xl space-y-5">
        <Card className="p-6">
          <h2 className="font-semibold">Project details</h2>
          <p className="mt-1 text-sm text-[#8B949E]">
            Update how this project appears in the dashboard.
          </p>
          <label className="mt-6 block text-sm">
            Project name
            <input
              defaultValue="AmiWorthy"
              className="mt-2 w-full rounded-lg border border-[#1D2633] bg-[#05070A] px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </label>
          <label className="mt-4 block text-sm">
            Environment
            <select
              defaultValue="development"
              className="mt-2 w-full rounded-lg border border-[#1D2633] bg-[#05070A] px-3 py-2.5"
            >
              <option>development</option>
              <option>production</option>
            </select>
          </label>
          <Button className="mt-6">Save changes</Button>
        </Card>
        <Card className="border-red-500/25 p-6">
          <h2 className="font-semibold text-red-400">Danger zone</h2>
          <p className="mt-2 text-sm text-[#8B949E]">
            Deleting a project revokes its tokens and removes all stored
            secrets.
          </p>
          <Button variant="danger" className="mt-5">
            Delete project
          </Button>
        </Card>
      </div>
    </ProjectPageShell>
  );
}
