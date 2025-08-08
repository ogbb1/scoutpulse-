"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DF_BLUE = "#0077C8";

export default function Page(){ return <Landing/>; }

function Landing(){
  const [accounts, setAccounts] = useState<Array<{name:string;domain?:string;score?:number}>>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [selected, setSelected] = useState<null | {name?:string;domain?:string;score?:number}>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [checking, setChecking] = useState(false);

  const pingServer = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/status", { method: "GET" });
      const data = await res.json().catch(()=>({}));
      setServerReady(Boolean((data as any).ai || (data as any).ok));
    } catch {
      setServerReady(false);
    } finally {
      setChecking(false);
    }
  };
  useEffect(()=>{ pingServer(); }, []);
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(v=>!v); }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, []);

  const runScan = async () => {
    if(!serverReady){ setToast("AI server not ready."); return; }
    try { setToast("Scanning watchlists…"); const res = await fetch("/watchlist/scan/batch", { method:"POST" }); if(!res.ok) throw new Error(); setToast("Scan complete."); } catch { setToast("Scan failed."); }
  };
  const batchBriefs = async () => {
    if(!serverReady){ setToast("AI server not ready."); return; }
    if(accounts.length===0){ setToast("Import accounts first."); return; }
    try { setToast("Generating briefs for Top 5…"); const payload={accounts:accounts.slice(0,5)};
      const res = await fetch("/assets/brief/batch", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error(); setToast("Briefs queued."); } catch { setToast("Brief generation failed."); }
  };
  const addReminder = () => { const r = window.prompt("New reminder"); if (r && r.trim()) setReminders(prev=>[r.trim(), ...prev]); };

  const handleDropCSV = async (file: File) => {
    const text = await file.text();
    const parsed = parseAccountsCSV(text);
    if(parsed.length===0){ setToast("No rows detected — check CSV headers."); return; }
    setAccounts(prev=>[...prev, ...parsed]);
    setToast(`Imported ${parsed.length} account${parsed.length===1?"":"s"}.`);
  };

  const downloadSampleCSV = () => {
    const csv = ["name,domain,score","Company A,companya.com,8.1","Company B,companyb.io,7.6","Company C,companyc.co,6.9"].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "scoutpulse-sample.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (<div className="relative min-h-screen text-white">
    <Wallpaper/>
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6">
      <div className="flex items-center gap-3"><LogoDot/><span className="text-xl font-semibold tracking-tight">ScoutPulse</span></div>
      <div className="flex items-center gap-2"><ServerStatusPill ready={serverReady} checking={checking} onClick={pingServer}/><button className="glass-btn" onClick={()=>setPaletteOpen(true)}>⌘K</button></div>
    </header>
    <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-5 py-6 md:grid-cols-12">
      <section className="md:col-span-8">
        <TodayPanel accounts={accounts} onOpen={setSelected} onScan={runScan} onBatchBriefs={batchBriefs} onDropCSV={handleDropCSV} onDownloadSample={downloadSampleCSV} serverReady={serverReady}/>
      </section>
      <aside className="md:col-span-4">
        <GlassPanel>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Reminders</h3><button className="glass-btn" onClick={addReminder}><IconPlus/> Add</button></div>
          {reminders.length===0 ? <EmptyHint text="No reminders yet. Add what you want to remember for outreach."/> :
            <ul className="space-y-2 text-sm text-white/80">{reminders.slice(0,6).map((r,i)=>(
              <li key={i} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-white/25 bg-white/10" /><span className="truncate">{r}</span></li>
            ))}</ul>}
        </GlassPanel>
      </aside>
    </main>
    <Dock/><NewFAB onClick={()=>setPaletteOpen(true)}/>
    <AccountSlideOver account={selected} onClose={()=>setSelected(null)} serverReady={serverReady}/>
    <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)} commands={[{id:"scan",label:"Run Daily Scan",run:runScan},{id:"batch",label:"Generate Top 5 Briefs",run:batchBriefs},{id:"sample",label:"Download sample CSV",run:downloadSampleCSV},{id:"status",label:"Check server status",run:pingServer}]}/>
    <AnimatePresence>{toast&&(<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}} className="pointer-events-none fixed bottom-24 left-1/2 z-20 -translate-x-1/2"><div className="pointer-events-auto glass px-4 py-2 text-sm">{toast}</div></motion.div>)}</AnimatePresence>
    <style>{`.glass{border-radius:24px;background:rgba(255,255,255,.08);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 20px 60px rgba(0,0,0,.30);} .glass-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);padding:10px 14px;border-radius:14px;font-size:12px;backdrop-filter:blur(18px);transition:background .2s;} .glass-btn:hover{background:rgba(255,255,255,.16);} .icon{width:18px;height:18px;display:block;}`}</style>
  </div>);
}

/* UI bits used above (shortened for clarity) */
function Wallpaper(){ return (<div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute inset-0" style={{background:"radial-gradient(1200px 800px at 20% -10%, rgba(0,119,200,.12), transparent),radial-gradient(1200px 800px at 110% 30%, rgba(139,92,246,.10), transparent)"}}/><div className="absolute inset-0" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",backgroundSize:"160px 160px, 160px 160px",backgroundPosition:"-1px -1px, -1px -1px",maskImage:"radial-gradient(1200px 800px at 50% 10%, rgba(0,0,0,.6), transparent)"}}/></div>); }
function LogoDot(){ return <div className="h-8 w-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur"/>; }
function GlassPanel({ children }:{children:React.ReactNode}){ return <div className="glass p-5">{children}</div>; }
function EmptyHint({ text }:{text:string}){ return (<div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70"><IconSparkles/> <span>{text}</span></div>); }
function ServerStatusPill({ ready, checking, onClick }:{ready:boolean; checking:boolean; onClick:()=>void}){ return (<button className="glass-btn" onClick={onClick} title="Click to recheck server"><span className={`inline-block h-2 w-2 rounded-full ${ready?"bg-green-400":"bg-yellow-400"}`}/>{checking?"Checking…":ready?"AI: Ready":"AI: Not configured"}</button>); }
function TodayPanel({ accounts, onOpen, onScan, onBatchBriefs, onDropCSV, onDownloadSample, serverReady }:{accounts:Array<{name?:string;domain?:string;score?:number}>; onOpen:(a:any)=>void; onScan:()=>void; onBatchBriefs:()=>void; onDropCSV:(f:File)=>void; onDownloadSample:()=>void; serverReady:boolean;}){
  const [isDragging, setIsDragging] = useState(false); const onDragOver=(e:React.DragEvent<HTMLDivElement>)=>{ e.preventDefault(); if(!isDragging) setIsDragging(true); }; const onDragLeave=()=>setIsDragging(False as any as boolean);
  const onDrop=async(e:React.DragEvent<HTMLDivElement>)=>{ e.preventDefault(); setIsDragging(False as any as boolean); const file=e.dataTransfer.files?.[0]; if(file) await onDropCSV(file); };
  return (<div className="glass relative p-6" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><HeroGlyph/><div><h1 className="text-2xl font-semibold leading-tight">Your focus today</h1><p className="text-sm text-white/70">Your org uses a server-side master key. Import accounts to get started.</p></div></div><div className="flex gap-2"><button className="glass-btn" onClick={onScan} disabled={!serverReady}><IconScan/> Run Daily Scan</button><button className="glass-btn" onClick={onBatchBriefs} disabled={!serverReady||accounts.length===0}><IconDoc/> Generate Top 5 Briefs</button></div></div>{accounts.length===0?(<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80"><div className="mb-2 text-base font-medium">Get started</div><ul className="mb-4 list-disc space-y-1 pl-5"><li>Drop a CSV here (columns: <code>name</code>, <code>domain</code>, optional <code>score</code>).</li><li>Use ⌘K to run commands like <i>Run Daily Scan</i> or <i>Generate Briefs</i>.</li></ul><div className="flex gap-2"><button className="glass-btn" onClick={onDownloadSample}><IconDownload/> Sample CSV</button><span className="glass-btn"><IconUpload/> Or drop CSV on this card</span></div></div>):(<ul className="divide-y divide-white/10">{accounts.slice(0,5).map((a,idx)=>(<li key={`${a.domain||a.name||idx}-row`} className="grid grid-cols-12 items-center gap-2 py-3"><div className="col-span-6 flex items-center gap-3"><Avatar label={a.name||"Account"}/><div><div className="text-sm font-medium">{a.name||"Unnamed"}</div><div className="text-xs text-white/60">{a.domain||"domain.tld"}</div></div></div><div className="col-span-2"><span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">Score {a.score ?? "–"}</span></div><div className="col-span-4 flex items-center justify-end gap-2"><button className="glass-btn" onClick={()=>onOpen(a)}><IconInfo/> Details</button><button className="glass-btn" onClick={onBatchBriefs} disabled={!serverReady}><IconDoc/> Brief</button><button className="glass-btn" onClick={()=>alert("Queue outreach")}><IconSend/> Outreach</button></div></li>))}</ul>)}<AnimatePresence>{isDragging&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"><div className="glass pointer-events-auto border-dashed border-white/30 p-10 text-center"><div className="mb-2 text-lg font-semibold">Drop CSV to import accounts</div><div className="text-sm text-white/70">We parse locally and never send anywhere</div></div></motion.div>)}</AnimatePresence></div>);
}
function Avatar({ label }:{label?:string}){ const initials=(label||"").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()||"?"; return (<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sm" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)" }}>{initials}</div>); }
function Dock(){ const items=[{id:"hot",label:"Hotlist",icon:IconHot,onClick:()=>alert("Open Hotlist")},{id:"tsk",label:"Tasks",icon:IconTasks,onClick:()=>alert("Open Tasks")},{id:"brf",label:"Briefs",icon:IconBriefs,onClick:()=>alert("Open Briefs")}]; return (<div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center"><div className="pointer-events-auto glass flex items-center gap-2 px-3 py-2">{items.map(it=>(<GlassTooltip key={it.id} label={it.label}><button onClick={it.onClick} title={it.label} aria-label={it.label} className="glass-btn !bg-white/8 px-3 py-2"><it.icon/></button></GlassTooltip>))}</div></div>); }
function GlassTooltip({ label, children }:{label:string; children:React.ReactNode}){ const [open,setOpen]=useState(false); return (<div className="relative" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>{children}<AnimatePresence>{open&&(<motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}} className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2"><div className="glass px-2 py-1 text-[11px]">{label}</div></motion.div>)}</AnimatePresence></div>); }
function NewFAB({ onClick }:{onClick:()=>void}){ return (<button aria-label="New" onClick={onClick} className="fixed bottom-24 right-6 z-20 h-12 w-12 rounded-2xl border border-white/20 bg-white/10 text-lg backdrop-blur hover:bg-white/16">+</button>); }
function AccountSlideOver({ account, onClose, serverReady }:{account:null|{name?:string;domain?:string;score?:number}; onClose:()=>void; serverReady:boolean;}){ const [loading,setLoading]=useState(false); const [research,setResearch]=useState<string[]>([]); useEffect(()=>{ setResearch([]); setLoading(false); },[account]);
  const runResearch=async()=>{ if(!serverReady) return; try{ setLoading(true); const res=await fetch("/api/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ domain: account?.domain })}); if(!res.ok) throw new Error(); const data=await res.json().catch(()=>({results:[]})); const items=Array.isArray((data as any).results)?(data as any).results:[]; setResearch(items.map(String)); } catch { setResearch([]);} finally { setLoading(false);} };
  return (<AnimatePresence>{account&&(<><motion.div initial={{opacity:0}} animate={{opacity:0.5}} exit={{opacity:0}} className="fixed inset-0 z-30 bg-black" onClick={onClose}/><motion.aside initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"tween",duration:0.25}} className="fixed right-0 top-0 z-40 h-full w-full max-w-md p-5"><div className="glass h-full p-5"><div className="mb-3 flex items-center justify-between"><div><div className="text-sm text-white/70">Account</div><div className="text-lg font-semibold">{account.name || "Unnamed"}</div></div><button className="glass-btn" onClick={onClose}>Close</button></div><div className="mb-4 flex flex-wrap gap-2"><button className="glass-btn" onClick={runResearch} disabled={loading || !serverReady}><IconSparkles/> {loading ? "Researching…" : "Research (AI)"}</button><button className="glass-btn" onClick={()=>alert("Create brief")}><IconDoc/> Create Brief</button><button className="glass-btn" onClick={()=>alert("Queue outreach")}><IconSend/> Outreach</button></div><h4 className="mb-2 text-sm font-semibold">Why‑Now receipts</h4>{research.length===0?(<EmptyHint text={serverReady ? "No receipts yet. Run Research to pull recent, relevant signals." : "Server AI not ready."}/>):(<ul className="space-y-2 text-sm text-white/80">{research.map((r,i)=>(<li key={i} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-white/25 bg-white/10" /> <span className="truncate">{r}</span></li>))}</ul>)}</div></motion.aside></>)}</AnimatePresence>); }
function IconHot(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6Z"/><path d="M6 14a6 6 0 1 0 12 0c0-2-1-3-2-4-.5 1.8-2.1 3-4 3s-3.5-1.2-4-3c-1 1-2 2-2 4Z"/></svg>); }
function IconTasks(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 9h8M8 13h5"/></svg>); }
function IconBriefs(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 7h10v10H7z"/><path d="M9 5h6M9 19h6"/></svg>); }
function IconPlus(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>); }
function IconDoc(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h7l4 4v12H7z"/><path d="M14 4v4h4"/></svg>); }
function IconSend(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l18-9-9 18-2-7-7-2z"/></svg>); }
function IconInfo(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h2v4h-2z"/></svg>); }
function IconUpload(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V6"/><path d="M8 10l4-4 4 4"/><path d="M4 18h16"/></svg>); }
function IconScan(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M4 17v2a1 1 0 0 0 1 1h2"/><path d="M20 7V5a1 1 0 0 0-1-1h-2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M4 12h16"/></svg>); }
function IconSparkles(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.8 3.6L18 8.2l-3.6 1.8L12 14l-1.8-3.9L6 8.2l4.2-1.6L12 3z"/><path d="M6 16l.9 1.8L9 19l-1.8.9L6 22l-.9-2.1L3 19l2.1-.2L6 16z"/></svg>); }
function IconDownload(){ return (<svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v10"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>); }
function HeroGlyph(){ return (<div className="relative h-10 w-10 overflow-hidden rounded-2xl"><div className="absolute inset-0" style={{background:`radial-gradient(60% 60% at 30% 30%, ${DF_BLUE}, transparent 60%), radial-gradient(60% 60% at 70% 70%, rgba(139,92,246,.8), transparent 60%)`, filter:"blur(10px)", opacity:.8}}/><div className="absolute inset-px rounded-2xl" style={{boxShadow:"inset 0 1px 0 rgba(255,255,255,.6)"}}/></div>); }
function parseAccountsCSV(text:string){ const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); if(lines.length===0) return []; const header=safeSplitCSVLine(lines[0]).map(h=>h.trim().toLowerCase()); const idxName=header.findIndex(h=>h==="name"||h==="account"||h==="company"); const idxDomain=header.findIndex(h=>h==="domain"||h==="website"); const idxScore=header.findIndex(h=>h==="score"||h==="priority"); const out:Array<{name:string;domain?:string;score?:number}>=[]; for(let i=1;i<lines.length;i++){ const cols=safeSplitCSVLine(lines[i]); const name=idxName>=0?cols[idxName]:(cols[0]||""); const domain=idxDomain>=0?cols[idxDomain]:""; const scoreRaw=idxScore>=0?cols[idxScore]:""; const score=scoreRaw&&!isNaN(parseFloat(scoreRaw))?parseFloat(scoreRaw):undefined; if(name) out.push({name,domain,score}); } return out; }
function safeSplitCSVLine(line:string){ const res:string[]=[]; let cur=""; let inQ=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){ inQ=!inQ; continue; } if(ch===','&&!inQ){ res.push(cur); cur=""; continue; } cur+=ch; } res.push(cur); return res.map(s=>s.trim()); }
