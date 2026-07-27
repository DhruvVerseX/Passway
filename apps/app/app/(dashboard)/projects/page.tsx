import Link from "next/link";
import { ArrowUpRight, FolderPlus, Plus } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { projects } from "@/lib/mock-data";

export default function ProjectsPage(){
  return <><PageHeader title="Projects" description="Manage vaults, environments, and runtime access." action={<Button><Plus size={16}/>New project</Button>}/>
  {projects.length===0?<EmptyState icon={<FolderPlus/>} title="No projects yet" body="Create your first project to start storing secrets."/>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map(p=><Link href={`/projects/${p.id}`} key={p.id}><Card className="p-6 transition hover:border-blue-500/40"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl border border-[#1D2633] bg-[#05070A] font-semibold">{p.name.slice(0,2)}</span><ArrowUpRight className="text-[#8B949E]" size={17}/></div><h2 className="mt-7 font-semibold">{p.name}</h2><div className="mt-2"><Badge tone={p.environment==="production"?"success":"blue"}>{p.environment}</Badge></div><div className="mt-7 flex gap-5 border-t border-[#1D2633] pt-4 text-xs text-[#8B949E]"><span><b className="mono text-[#E6EDF3]">{p.secrets}</b> secrets</span><span><b className="mono text-[#E6EDF3]">{p.tokens}</b> active tokens</span></div></Card></Link>)}</div>}</>;
}
