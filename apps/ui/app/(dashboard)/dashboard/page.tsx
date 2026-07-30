import Link from "next/link";
import { Activity, ArrowUpRight, FolderKanban, KeyRound, LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { logs, projects } from "@/lib/mock-data";

export default function DashboardPage(){
  return <><PageHeader title="Overview" description="A clear view of your projects and recent secret access."/>
  <div className="grid gap-4 sm:grid-cols-3"><Metric icon={<FolderKanban/>} label="Projects" value="3"/><Metric icon={<LockKeyhole/>} label="Managed secrets" value="36"/><Metric icon={<KeyRound/>} label="Active tokens" value="4"/></div>
  <div className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><Card><div className="flex items-center justify-between border-b border-[#1D2633] p-5"><h2 className="font-semibold">Projects</h2><Link href="/projects" className="text-sm text-blue-400">View all</Link></div><div className="divide-y divide-[#1D2633]">{projects.map(p=><Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-4 p-5 hover:bg-white/[.02]"><span className="grid size-10 place-items-center rounded-lg border border-[#1D2633] bg-[#05070A] font-semibold">{p.name.slice(0,2)}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{p.name}</b><span className="mono text-xs text-[#8B949E]">{p.environment}</span></span><span className="hidden text-xs text-[#8B949E] sm:block">{p.secrets} secrets</span><ArrowUpRight size={16} className="text-[#8B949E]"/></Link>)}</div></Card>
  <Card><div className="border-b border-[#1D2633] p-5"><h2 className="font-semibold">Recent access</h2></div><div className="divide-y divide-[#1D2633]">{logs.slice(0,4).map(log=><div key={log.id} className="flex gap-3 p-4"><span className={`mt-1 size-2 rounded-full ${log.code===200?"bg-green-500":log.code===429?"bg-amber-500":"bg-red-500"}`}/><span className="min-w-0 flex-1"><b className="block text-sm">{log.status}</b><span className="text-xs text-[#8B949E]">{log.ip}</span></span><time className="mono text-[11px] text-[#8B949E]">{log.time}</time></div>)}</div></Card></div></>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <Card className="p-5"><div className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-400">{icon}</span><span><span className="block text-sm text-[#8B949E]">{label}</span><b className="mono mt-1 block text-2xl">{value}</b></span></div></Card>;}
