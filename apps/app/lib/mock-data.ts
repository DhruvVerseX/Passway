export const projects = [
  { id:"amiworthy", name:"AmiWorthy", environment:"development", secrets:12, tokens:2 },
  { id:"viruj-health", name:"Viruj Health", environment:"production", secrets:18, tokens:1 },
  { id:"envvault-demo", name:"EnvVault Demo", environment:"development", secrets:6, tokens:1 },
] as const;

export const secrets = [
  { key:"DATABASE_URL", updated:"2 hours ago" },
  { key:"OPENAI_API_KEY", updated:"Yesterday" },
  { key:"BETTER_AUTH_SECRET", updated:"3 days ago" },
  { key:"NEXT_PUBLIC_APP_URL", updated:"6 days ago" },
] as const;

export const tokens = [
  { id:"tok_01", value:"evt_dev_abcd••••••••••••wxyz", label:"Local development", created:"Jul 22, 2026", lastUsed:"8 minutes ago" },
  { id:"tok_02", value:"evt_live_qwer••••••••••••tyui", label:"Production runtime", created:"Jul 10, 2026", lastUsed:"2 hours ago" },
] as const;

export const logs = [
  { id:"log_01", code:200, status:"Success", event:"Secrets fetched", ip:"103.21.58.14", time:"2 min ago" },
  { id:"log_02", code:401, status:"Invalid token", event:"Request rejected", ip:"45.79.11.208", time:"18 min ago" },
  { id:"log_03", code:403, status:"IP blocked", event:"Request rejected", ip:"198.51.100.24", time:"1 hour ago" },
  { id:"log_04", code:429, status:"Rate limited", event:"Request throttled", ip:"103.21.58.14", time:"3 hours ago" },
] as const;
