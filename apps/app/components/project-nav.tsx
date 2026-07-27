import Link from "next/link";
const links=[["Overview",""],["Secrets","/secrets"],["Tokens","/tokens"],["IP rules","/ip-rules"],["Access logs","/logs"],["Settings","/settings"]];
export function ProjectNav({projectId}:{projectId:string}){return <nav className="mb-7 flex gap-1 overflow-x-auto border-b border-[#1D2633]">{links.map(([label,path])=><Link key={label} href={`/projects/${projectId}${path}`} className="whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm text-[#8B949E] hover:border-blue-500 hover:text-white">{label}</Link>)}</nav>;}
