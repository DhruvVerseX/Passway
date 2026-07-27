import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { ProjectNav } from "@/components/project-nav";
import { projects } from "@/lib/mock-data";

export function ProjectPageShell({projectId,children}:{projectId:string;children:React.ReactNode}){
  const project=projects.find(p=>p.id===projectId);if(!project)notFound();
  return <><div className="mb-6"><p className="mono text-xs text-[#8B949E]">PROJECT / {project.id}</p><div className="mt-2 flex items-center gap-3"><h1 className="text-2xl font-semibold">{project.name}</h1><Badge tone={project.environment==="production"?"success":"blue"}>{project.environment}</Badge></div></div><ProjectNav projectId={project.id}/>{children}</>;
}
