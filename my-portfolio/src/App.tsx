import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookText,
  Atom,
  Lightbulb,
  GitBranch,
  Search,
  Clock,
  ExternalLink,
  User,
} from "lucide-react";



// =========================================================
// Astrophotography data — single source of truth
// (shared by the Notes gallery and the universal search index)
// =========================================================
export type AstroObj = {
  name: string;
  aliases: string[];
  files: string[];
  desc: string;
  gear?: string;
};

export const ASTRO: AstroObj[] = [
  {
    name: "C27 (Crescent Nebula)",
    aliases: ["Crescent Nebula", "NGC 6888", "Cygnus"],
    files: ["C27(1).JPG", "C27(2).JPG"],
    desc: "An emission nebula in Cygnus, formed by stellar winds from a massive, incredibly hot star at its heart.",
    gear: "Seestar S50",
  },
  {
    name: "IC 5070 (Pelican Nebula)",
    aliases: ["Pelican Nebula", "IC5070", "Cygnus"],
    files: ["IC5070(1).JPG", "IC5070(2).JPG"],
    desc: "A bright emission nebula in Cygnus, known for its distinctive pelican shape. But tbh I don't see it 🤷‍♂️",
    gear: "Seestar S50",
  },
  {
    name: "M27 (Dumbbell Nebula)",
    aliases: ["Dumbbell Nebula", "NGC 6853", "Vulpecula"],
    files: ["M27(1).JPG", "M27(2).JPG"],
    desc: "A planetary nebula in Vulpecula, 1360 light-years away. One of the brightest and earliest discovered. Personal favourite.",
    gear: "Seestar S50",
  },
  {
    name: "M97 (Owl Nebula)",
    aliases: ["Owl Nebula", "NGC 3587", "Ursa Major"],
    files: ["m97.jpeg", "m97-2.jpeg"],
    desc: "A planetary nebula in Ursa Major, showing its faint structure.",
    gear: "Seestar S50",
  },
  {
    name: "M81 (Bode's Galaxy)",
    aliases: ["Bode's Galaxy", "NGC 3031", "Ursa Major"],
    files: ["m81.jpeg", "m81-2.jpeg"],
    desc: "A spiral galaxy in Ursa Major, imaged on two different nights.",
    gear: "Seestar S50",
  },
  {
    name: "Andromeda Galaxy (M31)",
    aliases: ["Andromeda", "M31", "NGC 224"],
    files: ["andromeda.jpeg"],
    desc: "The closest major galaxy to the Milky Way, captured on a somewhat cloudy night in Toronto.",
    gear: "Canon mirrorless",
  },
  // ── New (July 2026) — filenames are drop-in targets; identities pending confirmation ──
  {
    name: "M13 (Great Hercules Cluster)",
    aliases: ["Hercules Cluster", "NGC 6205", "globular cluster"],
    files: ["m13.jpg", "m13-2.jpg"],
    desc: "A globular cluster in Hercules — hundreds of thousands of stars bound into a dense sphere. Two processing passes of the same night.",
    gear: "Seestar S50",
  },
  {
    name: "M101 (Pinwheel Galaxy)",
    aliases: ["Pinwheel Galaxy", "NGC 5457", "Ursa Major", "grand design spiral"],
    files: ["m101.jpg"],
    desc: "A grand-design face-on spiral in Ursa Major, with sweeping blue arms and pink star-forming regions.",
    gear: "Canon mirrorless",
  },
  {
    name: "M33 (Triangulum Galaxy)",
    aliases: ["Triangulum Galaxy", "NGC 598", "face-on spiral"],
    files: ["m33.jpg", "m33-2.jpg"],
    desc: "A faint face-on spiral in Triangulum — a challenging low-surface-brightness target. Two exposures showing how much stacking pulls out of the noise.",
    gear: "Canon mirrorless",
  },
  {
    name: "Faint galaxy field",
    aliases: ["galaxy field", "deep sky"],
    files: ["field-object.jpg"],
    desc: "A dim galaxy field pushed hard out of a short integration — the kind of target that rewards more time under dark skies.",
    gear: "Canon mirrorless",
  },
];

// =========================================================
// Interactive project mini-visuals
// Monochrome + a single accent each; illustrative previews.
// =========================================================

// Fixate — scrub through a focus session; drift markers + live focus %
function FixateViz() {
  const total = 45; // minutes
  const drifts = [7, 19, 31]; // minute marks where attention drifted
  const [t, setT] = useState(total);
  const focusPct = Math.max(
    0,
    Math.round(100 - (drifts.filter((d) => d <= t).length / Math.max(t, 1)) * 100 * 3)
  );
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-zinc-500">Focus session replay · illustrative</div>
        <div className="text-right">
          <span className="text-2xl font-semibold tabular-nums text-zinc-900">{focusPct}%</span>
          <span className="text-xs text-zinc-400 ml-1">focus</span>
        </div>
      </div>
      <svg viewBox="0 0 300 40" className="w-full">
        <rect x="0" y="16" width="300" height="8" rx="4" fill="#e4e4e7" />
        <rect x="0" y="16" width={(t / total) * 300} height="8" rx="4" fill="#10b981" />
        {drifts.map((d) => (
          <g key={d}>
            <rect x={(d / total) * 300 - 1} y="10" width="2" height="20" rx="1" fill="#ef4444" />
          </g>
        ))}
        <circle cx={(t / total) * 300} cy="20" r="6" fill="#fff" stroke="#10b981" strokeWidth="2" />
      </svg>
      <input
        type="range"
        min={0}
        max={total}
        value={t}
        onChange={(e) => setT(parseInt(e.target.value))}
        className="w-full mt-2 accent-emerald-500"
        aria-label="Scrub focus session"
      />
      <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> focused</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-500" /> drift</span>
        <span className="ml-auto tabular-nums">{t} / {total} min</span>
      </div>
    </div>
  );
}

// whoomp — recovery ring + hoverable heart-rate sparkline
function WhoompViz() {
  const hr = [58, 61, 60, 64, 72, 68, 63, 66, 74, 70, 65, 62, 67, 71, 69];
  const [hover, setHover] = useState<number | null>(null);
  const w = 300, h = 60, min = 52, max = 78;
  const pts = hr.map((v, i) => [
    (i / (hr.length - 1)) * w,
    h - ((v - min) / (max - min)) * (h - 8) - 4,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const recovery = 72;
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div className="rounded-xl border border-zinc-200 p-4 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={R} fill="none" stroke="#e4e4e7" strokeWidth="7" />
          <circle
            cx="36" cy="36" r={R} fill="none" stroke="#10b981" strokeWidth="7"
            strokeLinecap="round" strokeDasharray={C}
            strokeDashoffset={C * (1 - recovery / 100)}
            transform="rotate(-90 36 36)"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div className="text-lg font-semibold text-zinc-900">{recovery}</div>
            <div className="text-[9px] uppercase tracking-wide text-zinc-400">recov</div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs font-medium text-zinc-500">Live heart rate · illustrative</div>
          <div className="text-sm tabular-nums text-zinc-900">
            {hover !== null ? hr[hover] : hr[hr.length - 1]} <span className="text-xs text-zinc-400">bpm</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" onMouseLeave={() => setHover(null)}>
          <path d={path} fill="none" stroke="#e11d48" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <rect
              key={i} x={p[0] - w / hr.length / 2} y="0" width={w / hr.length} height={h}
              fill="transparent" onMouseEnter={() => setHover(i)}
            />
          ))}
          {hover !== null && (
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" fill="#fff" stroke="#e11d48" strokeWidth="2" />
          )}
        </svg>
      </div>
    </div>
  );
}

// kōdō — priority donut + now/next/later load
function KodoViz() {
  const data = [
    { label: "High", value: 4, color: "#18181b" },
    { label: "Medium", value: 7, color: "#71717a" },
    { label: "Low", value: 5, color: "#d4d4d8" },
  ];
  const totalV = data.reduce((s, d) => s + d.value, 0);
  const [hover, setHover] = useState<number | null>(null);
  const R = 30, r = 18, cx = 36, cy = 36;
  let acc = 0;
  const arcs = data.map((d) => {
    const start = (acc / totalV) * 2 * Math.PI;
    acc += d.value;
    const end = (acc / totalV) * 2 * Math.PI;
    const large = end - start > Math.PI ? 1 : 0;
    const p = (ang: number, rad: number) => [cx + rad * Math.sin(ang), cy - rad * Math.cos(ang)];
    const [x1, y1] = p(start, R), [x2, y2] = p(end, R);
    const [x3, y3] = p(end, r), [x4, y4] = p(start, r);
    return `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`;
  });
  const buckets = [
    { label: "Now", n: 3 },
    { label: "Next", n: 5 },
    { label: "Later", n: 8 },
  ];
  return (
    <div className="rounded-xl border border-zinc-200 p-4 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72">
          {arcs.map((d, i) => (
            <path
              key={i} d={d} fill={data[i].color}
              opacity={hover === null || hover === i ? 1 : 0.35}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              stroke="#fff" strokeWidth="1.5"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center leading-none">
            <div className="text-lg font-semibold text-zinc-900">{hover === null ? totalV : data[hover].value}</div>
            <div className="text-[9px] uppercase tracking-wide text-zinc-400">{hover === null ? "tasks" : data[hover].label}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2">
        <div className="text-xs font-medium text-zinc-500 mb-1">Task load · illustrative</div>
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="w-10 text-[11px] text-zinc-500">{b.label}</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-zinc-800" style={{ width: `${(b.n / 8) * 100}%` }} />
            </div>
            <span className="w-4 text-[11px] tabular-nums text-zinc-400 text-right">{b.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// CryptoRadar — market sparkline + regulatory status heatmap
function CryptoRadarViz() {
  const series = [42, 44, 43, 47, 51, 49, 53, 58, 55, 60, 63, 61, 66, 70, 68];
  const w = 300, h = 44, min = 38, max = 74;
  const pts = series.map((v, i) => [
    (i / (series.length - 1)) * w,
    h - ((v - min) / (max - min)) * (h - 6) - 3,
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  // regulatory status grid: 0 restrictive, 1 developing, 2 favorable
  const grid = [
    { c: "US", s: 1 }, { c: "CA", s: 2 }, { c: "BR", s: 2 }, { c: "MX", s: 1 },
    { c: "AR", s: 1 }, { c: "CL", s: 2 }, { c: "CO", s: 1 }, { c: "SV", s: 2 },
  ];
  const scale = ["#e4e4e7", "#a1a1aa", "#18181b"];
  const statusLabel = ["Restrictive", "Developing", "Favorable"];
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-zinc-500">Market index · illustrative</div>
        <div className="text-sm tabular-nums text-zinc-900">+18.4%<span className="text-xs text-zinc-400 ml-1">90d</span></div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <path d={area} fill="#3b82f6" opacity="0.08" />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div>
        <div className="text-xs font-medium text-zinc-500 mb-1.5">Americas regulatory posture</div>
        <div className="flex flex-wrap gap-1.5">
          {grid.map((g, i) => (
            <div
              key={g.c} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              className="w-9 h-9 rounded-md grid place-items-center text-[10px] font-medium cursor-default"
              style={{ background: scale[g.s], color: g.s === 2 ? "#fff" : "#3f3f46" }}
              title={`${g.c}: ${statusLabel[g.s]}`}
            >
              {g.c}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-zinc-500 mt-1.5 h-4">
          {hover !== null ? `${grid[hover].c} — ${statusLabel[grid[hover].s]}` : "Hover a country for its regulatory status"}
        </div>
      </div>
    </div>
  );
}

// =======
// Layout
// =======
export default function Portfolio() {
  const [route, setRoute] = useState("home");
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Deep-link target set by the universal search (e.g. open a galaxy or a project)
  const [focus, setFocus] = useState<{ astro?: string; project?: string } | null>(null);

  const go = (to: string, f?: { astro?: string; project?: string }) => {
    setRoute(to);
    setFocus(f ?? null);
  };

  // keyboard: ⌘K / Ctrl-K / "/" toggles the command palette
  // (ignore "/" while typing in a field so it doesn't hijack input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Header onOpenPalette={() => setPaletteOpen(true)} />
      <div className="mx-auto max-w-7xl grid grid-cols-12 gap-4 px-4 md:px-6 py-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 top-4 h-fit">
          <Sidebar route={route} setRoute={(r) => go(r)} />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <NotionSurface>
            <AnimatePresence mode="wait">
              {route === "home" && (
                <Page key="home">
                  <Hero />
                  <QuickBlocks setRoute={setRoute} />
                </Page>
              )}
              {route === "projects" && (
                <Page key="projects" title="Projects" subtitle="Selected builds, experiments, and demos.">
                  <Projects />
                </Page>
              )}
              {route === "research" && (
                <Page key="research" title="Physics Research" subtitle="Notes, preprints, and interactive derivations.">
                  <Research />
                </Page>
              )}
              {route === "blog" && (
                <Page key="notes" title="Notes" subtitle="Short notes, and a growing astrophotography log.">
                  <Notes focusAstro={focus?.astro} />
                </Page>
              )}
              {route === "graph" && (
                <Page key="graph" title="Idea Graph" subtitle="A current map linking projects, papers, and concepts.">
                  <IdeaGraph />
                </Page>
              )}
              {route === "work" && (
                <Page key="work" title="Projects + Research" subtitle="Selected research, builds, and experiments.">
                  <ProjectsResearch focusProject={focus?.project} />
                </Page>
              )}
              {route === "contact" && (
                <Page key="contact" title="Contact" subtitle="Let's connect.">
                  <Contact />
                </Page>
              )}
            </AnimatePresence>
          </NotionSurface>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={go}
      />
      <Footer />
    </div>
  );
}

function Header({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <div className="border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 top-0 z-20">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          {/* <div className="size-7 rounded-lg bg-zinc-900 text-white grid place-items-center font-bold">R</div> */}
         <img
            src="/logo.svg"
            alt="Logo"
            className="size-5 border-zinc-200"
          />
          <div className="text-sm text-zinc-500">/</div>
          <div className="text-sm text-zinc-700">Portfolio</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPalette}
            className="flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            <Search className="size-4" />
            <span>Search</span>
            <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 text-[10px] text-zinc-500">⌘K</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ route, setRoute }: { route: string; setRoute: (r: string) => void }) {
  const links = [
    { id: "home", label: "Home", icon: Home },
    { id: "work", label: "Projects + Research", icon: Atom },
    { id: "blog", label: "Notes", icon: BookText },
    { id: "graph", label: "Idea Graph", icon: Lightbulb },
    { id: "contact", label: "Contact", icon: User },
  ];
  return (
    <nav className="space-y-2">
      {links.map((l) => (
        <button
          key={l.id}
          onClick={() => setRoute(l.id)}
          className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
            route === l.id
              ? "bg-zinc-900 text-white border-zinc-900"
              : "border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <l.icon className="size-4" />
          <span>{l.label}</span>
        </button>
      ))}

      <div className="mt-6 p-3 rounded-2xl border border-dashed text-xs text-zinc-500">
        Tip: Press <span className="font-mono">/</span> or <span className="font-mono">⌘K</span> to open the palette.
      </div>
    </nav>
  );
}

function NotionSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 md:p-8 shadow-[0_1px_0_#00000010]">
      {children}
    </div>
  );
}

function Page({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {title && (
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-zinc-500">{subtitle}</p>}
        </header>
      )}
      <div>{children}</div>
    </motion.section>
  );
}

// =======
// Home
// =======
function Hero(){
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
        hola
        </h1>
        <p className="text-zinc-600 max-w-2xl">
          I’m <span className="font-medium">Ronak Toprani</span> — I work on tech in finance by day and build products the rest of the time. Lately that means <span className="font-medium">local-first tools</span> and <span className="font-medium">small on-device AI</span>: focus software, wearables, and desk robots. I also love physics, astrophotography, and philosophy. This is where it all lives.
        </p>
         <img
          src="/home.jpeg"
          alt="Ronak Toprani"
          className="rounded-2xl border border-zinc-200 w-full max-w-xl mx-auto"
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <BlockCard title="Latest Build" icon={<Atom className="size-4" />}>
          <span className="font-medium">Fixate</span> — a Chrome extension that <em>verifies</em> focus with local, on-device gaze detection. No backend, no data leaves the machine.
        </BlockCard>
        <BlockCard title="Also Shipping" icon={<GitBranch className="size-4" />}>
          <span className="font-medium">whoomp</span> (WHOOP 4.0 reverse-engineered over BLE) and <span className="font-medium">kōdō</span> (a productivity dashboard run by local SLMs).
        </BlockCard>
        <BlockCard title="Recent Note" icon={<BookText className="size-4" />}>
          New astrophotography — the C27 Crescent Nebula, M27 Dumbbell, and more, over in the Notes section.
        </BlockCard>
      </div>
    </div>
  );
}

function QuickBlocks({ setRoute }: { setRoute: (r: string) => void }) {
  const items = [
    { label: "Explore Projects", to: "work" },
    { label: "Read Notes", to: "blog" },
    { label: "Open Idea Graph", to: "graph" },
    { label: "Connect with Me", to: "contact" },
  ];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
      {items.map((i) => (
        <button
          key={i.to}
          onClick={() => setRoute(i.to)}
          className="rounded-2xl border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-left"
        >
          <div className="text-sm font-medium">{i.label}</div>
          <div className="text-xs text-zinc-500">Jump right in →</div>
        </button>
      ))}
    </div>
  );
}

function BlockCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

// =========
// Projects
// =========
function Projects() {
  const projects = [
    {
      title: "WaveSim",
      meta: "C++ • WebGL • PDEs",
      desc: "Interactive finite-difference solver for 2D wave equations with on-canvas probes.",
      link: "#",
    },
    {
      title: "LatticeLab",
      meta: "Python • NumPy • Monte Carlo",
      desc: "Exploring Ising model dynamics and phase transitions with visual notebooks.",
      link: "#",
    },
    {
      title: "OpticsKit",
      meta: "TS • React • Canvas",
      desc: "Ray-tracing playground for lenses, mirrors, and wavefronts.",
      link: "#",
    },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => (
        <div key={p.title} className="rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50">
          <div className="text-sm text-zinc-500">{p.meta}</div>
          <h3 className="mt-1 font-medium">{p.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{p.desc}</p>
          <a className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-900" href={p.link}>
            View <ExternalLink className="size-3" />
          </a>
        </div>
      ))}
    </div>
  );
}

// =========
// Research
// =========
function Research() {
  const papers = [
    {
      title: "Conserved currents from continuous symmetries",
      venue: "Preprint, 2025",
      tags: ["field theory", "noether"],
      link: "#",
      abstract:
        "We revisit Noether’s theorem with a geometric view and derive currents for a class of Lagrangians...",
    },
    {
      title: "Finite-difference schemes for wave PDEs",
      venue: "Notes",
      tags: ["pdes", "numerics"],
      link: "#",
      abstract: "A gentle comparison of explicit vs. implicit schemes, stability, and dispersion.",
    },
  ];
  return (
    <div className="space-y-4">
      {papers.map((p) => (
        <div key={p.title} className="rounded-2xl border border-zinc-200 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{p.venue}</span>
            {p.tags.map((t) => (
              <span key={t} className="rounded-lg border border-zinc-200 px-2 py-0.5">{t}</span>
            ))}
          </div>
          <h3 className="mt-1 font-medium">{p.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{p.abstract}</p>
          <a className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-900" href={p.link}>
            Read <ExternalLink className="size-3" />
          </a>
        </div>
      ))}

      <DerivationBlock />
    </div>
  );
}

// Notion-like unusual block: toggle between "ELI5" and "Technical" explanations
function DerivationBlock() {
  const [mode, setMode] = useState<"eli5" | "tech">("eli5");
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Noether’s theorem — intuition vs. derivation</h4>
        <div className="flex gap-1 rounded-xl border border-zinc-200 p-1">
          {(["eli5", "tech"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 rounded-lg text-xs ${
                mode === m ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {m === "eli5" ? "ELI5" : "Technical"}
            </button>
          ))}
        </div>
      </div>
      {mode === "eli5" ? (
        <p className="mt-3 text-sm text-zinc-700">
          If nudging a system leaves it basically the same, something measurable stays the same. Time nudges → energy,
          space nudges → momentum. That’s Noether in a nutshell.
        </p>
      ) : (
        <div className="mt-3 text-sm text-zinc-700 space-y-2">
          <p>
            Start with a Lagrangian <em>L(ϕ, ∂ϕ)</em> invariant under a continuous transformation. Compute the variation,
            collect boundary terms, and identify the conserved current <em>j^μ</em> with ∂_μ j^μ = 0.
          </p>
          <div className="rounded-xl border border-zinc-200 p-3 font-mono text-xs overflow-auto">
            δS = 0 ⇒ δ∫ L d^4x = ∫ (EOM·δϕ + ∂_μK^μ) d^4x ⇒ j^μ = K^μ.
          </div>
        </div>
      )}
    </div>
  );
}


// Unusual micro-feature: a scrubber that "replays" a week of work logs (fictional data here)
function TimeMachine() {
  const [t, setT] = useState(3);
  const logs = [
    { day: "Spark of Curiosity", note: "What if machine learning could map more than just shape of galaxies?" },
    { day: "Building the Model", note: "Wrote a convergence test harness." },
    { day: " Discovery", note: "Found a pattern in dust lanes. But tricky to work with these kinds of images.." },
    { day: "Main Discovery", note: "Training different types of classifiers and testing" },
    { day: "Applied to real world", note: "Applied model to galaxy wide images to test overall accuracy" },
  ];
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Clock className="size-4" /> Research Replay
        </h4>
        <div className="text-xs text-zinc-500">Scrub to see snapshots</div>
      </div>
      <input
        className="w-full mt-3"
        type="range"
        min={0}
        max={logs.length - 1}
        value={t}
        onChange={(e) => setT(parseInt(e.target.value))}
      />
      <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
        {logs.map((l, i) => (
          <div key={l.day} className={`rounded-xl border p-2 ${i <= t ? "bg-zinc-50" : "opacity-50"}`}>
            <div className="font-medium">{l.day}</div>
            <div className="text-zinc-600">{l.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================
// graphing IDEAS feature. brain map sorta
// ==================
// Idea Graph: map relationships between projects, blog posts, and research topics.
// Lightweight (no external graph lib) with fixed positions + simple link routing.
function IdeaGraph() {
  const { nodes, links } = useMemo(() => mockGraph(), []);
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return { nodes, links };
    const f = filter.toLowerCase();
    const keep = new Set(nodes.filter((n) => n.label.toLowerCase().includes(f)).map((n) => n.id));
    const l2 = links.filter((l) => keep.has(l.source) || keep.has(l.target));
    const n2 = nodes.filter((n) => keep.has(n.id) || l2.some((l) => l.source === n.id || l.target === n.id));
    return { nodes: n2, links: l2 };
  }, [nodes, links, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            placeholder="Search concepts, projects, posts…"
            className="w-full rounded-2xl border border-zinc-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {active && (
          <button onClick={() => setActive(null)} className="text-sm text-zinc-600 underline">Clear selection</button>
        )}
      </div>

      <div className="h-[480px] rounded-3xl border border-zinc-200 overflow-x-auto overflow-y-hidden">
        <div className="relative h-full min-w-[760px]">
        {/* links */}
        <svg className="absolute inset-0 w-full h-full">
          {filtered.links.map((l, idx) => (
            <line
              key={idx}
              x1={filtered.nodes.find((n) => n.id === l.source)?.x}
              y1={filtered.nodes.find((n) => n.id === l.source)?.y}
              x2={filtered.nodes.find((n) => n.id === l.target)?.x}
              y2={filtered.nodes.find((n) => n.id === l.target)?.y}
              stroke="#e6e6e6"
              strokeWidth={2}
            />
          ))}
        </svg>
        {/* nodes */}
        {filtered.nodes.map((n) => (
          <button
            key={n.id}
            onClick={() => setActive(n.id)}
            style={{ left: n.x - 70, top: n.y - 28 }}
            className={`absolute w-[140px] rounded-2xl border px-3 py-2 text-left shadow-sm ${
              active === n.id ? "border-zinc-900 bg-white" : "border-zinc-200 bg-white/80 backdrop-blur"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">{n.kind}</div>
            <div className="text-sm font-medium leading-tight">{n.label}</div>
          </button>
        ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-zinc-200 p-4"
          >
            <ActiveCard id={active} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-zinc-500">
      a simplified representation of my work and ideas. It’s not exhaustive, but I always find graphs help explain things.
      </div>
    </div>
  );
}

function ActiveCard({ id }: { id: string }) {
  const { nodes, links } = useMemo(() => mockGraph(), []);
  const node = nodes.find((n) => n.id === id)!;
  const related = links
    .filter((l) => l.source === id || l.target === id)
    .map((l) => (l.source === id ? l.target : l.source))
    .map((rid) => nodes.find((n) => n.id === rid)!);
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-400">{node.kind}</div>
      <div className="font-medium">{node.label}</div>
      <p className="mt-1 text-sm text-zinc-600">{node.note}</p>
      {related.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-zinc-500 mb-1">Related</div>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <span key={r.id} className="rounded-xl border border-zinc-200 px-2 py-1 text-xs">{r.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function mockGraph() {
  const nodes = [
    // Builds / products (top band)
    { id: "fixate", label: "Fixate — Verified Focus", kind: "Project", x: 110, y: 70, note: "Local-CV Chrome extension that verifies real focus time." },
    { id: "whoomp", label: "whoomp (WHOOP 4.0)", kind: "Project", x: 290, y: 70, note: "Reverse-engineered WHOOP 4.0 over BLE; on-device biometrics." },
    { id: "kodo", label: "kōdō", kind: "Project", x: 470, y: 70, note: "Productivity dashboard driven by local SLMs." },
    { id: "cryptoradar", label: "CryptoRadar", kind: "Project", x: 650, y: 70, note: "Crypto regulatory + market intelligence terminal." },
    { id: "options", label: "Options Chain Analytics", kind: "Project", x: 110, y: 150, note: "Analytics for historical options chain data." },
    { id: "tradingbot", label: "XRP Trading Bot", kind: "Project", x: 290, y: 150, note: "Algorithmic trading bot pairing signals with a local SLM." },
    { id: "mochi", label: "Mochi (AI desk robot)", kind: "Project", x: 470, y: 150, note: "ESP32 desk companion running a small language model." },
    { id: "cubesat", label: "CubeSat (Ukpik-1)", kind: "Project", x: 650, y: 150, note: "Radio ground station for the Ukpik-1 CubeSat." },
    // Research (middle band)
    { id: "galaxy", label: "Galactic Mapping ML", kind: "Research", x: 200, y: 235, note: "ML classification for galactic components (JWST)." },
    { id: "spectral", label: "Spectral Emission Study", kind: "Research", x: 400, y: 235, note: "PAH spectroscopy of NGC 2023 (Spitzer)." },
    { id: "birds", label: "Bird Species Classification", kind: "Research", x: 600, y: 235, note: "Bioacoustics CNN for bird species ID." },
    // Concepts
    { id: "ml", label: "AI / SLMs", kind: "Concept", x: 140, y: 325, note: "Machine learning and small on-device language models." },
    { id: "finance", label: "Finance", kind: "Concept", x: 320, y: 325, note: "Options, risk, crypto, analytics." },
    { id: "astro", label: "Astronomy", kind: "Concept", x: 500, y: 325, note: "Galaxies, nebulae, mapping." },
    { id: "engineering", label: "Engineering", kind: "Concept", x: 660, y: 325, note: "Embedded, satellites, radio, hardware." },
    // Hobbies
    { id: "trading", label: "Trading", kind: "Hobbies", x: 180, y: 410, note: "Algorithmic and discretionary trading strategies." },
    { id: "astrophotography", label: "Astrophotography", kind: "Hobbies", x: 520, y: 410, note: "Capturing celestial objects with long exposures." },
  ];
  const links = [
    { source: "fixate", target: "ml" },
    { source: "whoomp", target: "engineering" },
    { source: "whoomp", target: "ml" },
    { source: "kodo", target: "ml" },
    { source: "cryptoradar", target: "finance" },
    { source: "mochi", target: "engineering" },
    { source: "mochi", target: "ml" },
    { source: "options", target: "finance" },
    { source: "options", target: "ml" },
    { source: "galaxy", target: "ml" },
    { source: "galaxy", target: "astro" },
    { source: "birds", target: "ml" },
    { source: "spectral", target: "astro" },
    { source: "spectral", target: "ml" },
    { source: "cubesat", target: "engineering" },
    { source: "cubesat", target: "astro" },
    { source: "tradingbot", target: "finance" },
    { source: "tradingbot", target: "ml" },
    // Hobbies links
    { source: "trading", target: "finance" },
    { source: "trading", target: "ml" },
    { source: "astrophotography", target: "astro" },
  ];
  return { nodes, links } as const;
}

// =====================
// Command Palette (⌘K)
// =====================
function CommandPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (to: string, focus?: { astro?: string; project?: string }) => void;
}) {
  const [input, setInput] = useState("");
  const [active, setActive] = useState(0);

  const defaults = useMemo<SearchEntry[]>(() => {
    const pages = SEARCH_INDEX.filter((e) => e.kind === "Page");
    const featured = SEARCH_INDEX.filter((e) =>
      [
        "Fixate — verified focus",
        "whoomp — WHOOP 4.0, unlocked",
        "M101 (Pinwheel Galaxy)",
      ].includes(e.title)
    );
    return [...pages, ...featured];
  }, []);

  const results = input.trim() ? searchAll(input) : defaults;

  useEffect(() => setActive(0), [input]);

  const choose = (e: SearchEntry) => {
    onNavigate(e.route, e.focus);
    onClose();
    setInput("");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[active]) choose(results[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, active]);

  if (!open) return null;

  const kindStyle: Record<string, string> = {
    Page: "bg-zinc-100 text-zinc-600",
    Project: "bg-zinc-900 text-white",
    Research: "bg-sky-100 text-sky-700",
    Note: "bg-amber-100 text-amber-700",
    Astro: "bg-indigo-100 text-indigo-700",
    Concept: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="relative mx-auto mt-24 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-2 pb-2">
          <Search className="size-4 text-zinc-400" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search anything — projects, galaxies, notes…"
            className="w-full py-2 text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-zinc-200 px-1.5 text-[10px] text-zinc-400">esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto p-1">
          {!input.trim() && (
            <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-zinc-400">Jump to</div>
          )}
          {results.map((e, i) => (
            <button
              key={e.kind + e.title}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(e)}
              className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 ${
                i === active ? "bg-zinc-100" : "hover:bg-zinc-50"
              }`}
            >
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${kindStyle[e.kind]}`}>
                {e.kind}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{e.title}</span>
                <span className="block text-xs text-zinc-500 truncate">{e.subtitle}</span>
              </span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="text-sm text-zinc-500 px-3 py-6 text-center">No results for “{input.trim()}”.</div>
          )}
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-zinc-100 text-[11px] text-zinc-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
      </motion.div>
    </div>
  );
}

// =====
// Notes
// =====
function Notes({ focusAstro }: { focusAstro?: string | null }) {
  const posts = [
    { title: "aims without attachment", date: "Aug 2025", summary: "a personal take on Taoism — dropping the enforcement, and aiming high while letting go of the outcome.", slug: "taoist-philosophy" },
  ];

  const astroPhotos = ASTRO;

  // Gallery modal state
  const [gallery, setGallery] = useState<{
    objIdx: number;
    imgIdx: number;
  } | null>(null);

  // Note routing state
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Deep-link: open a specific target when the universal search selects it
  useEffect(() => {
    if (!focusAstro) return;
    const idx = astroPhotos.findIndex(
      (o) => o.name === focusAstro || o.aliases.includes(focusAstro)
    );
    if (idx >= 0) {
      setGallery({ objIdx: idx, imgIdx: 0 });
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      typeof document !== "undefined" &&
        document.getElementById("astro-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [focusAstro, astroPhotos]);

  // Keyboard nav for the lightbox
  useEffect(() => {
    if (!gallery) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGallery(null);
      if (e.key === "ArrowRight")
        setGallery((g) =>
          g && g.imgIdx < astroPhotos[g.objIdx].files.length - 1
            ? { objIdx: g.objIdx, imgIdx: g.imgIdx + 1 }
            : g
        );
      if (e.key === "ArrowLeft")
        setGallery((g) => (g && g.imgIdx > 0 ? { objIdx: g.objIdx, imgIdx: g.imgIdx - 1 } : g));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery, astroPhotos]);

  // Render a note page if selected
    if (activeNote === "taoist-philosophy") {
    return <TaoistPhilosophyNote onBack={() => setActiveNote(null)} />;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        {posts.map((p) => (
          <article key={p.title} className="rounded-2xl border border-zinc-200 p-4">
            <div className="text-xs text-zinc-500">{p.date}</div>
            <h3 className="font-medium mt-1">{p.title}</h3>
            <p className="text-sm text-zinc-600 mt-1">{p.summary}</p>
            <button
              className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-900 underline"
              onClick={() => setActiveNote(p.slug)}
            >
              Read <ExternalLink className="size-3" />
            </button>
          </article>
        ))}
      </section>

      <section id="astro-section" className="scroll-mt-24">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-semibold">Astrophotography</h2>
          <span className="text-xs text-zinc-400">{astroPhotos.length} targets</span>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Shot with a Seestar S50 smart telescope or a Canon mirrorless — long exposures,
          stacked and processed. Click any target to open the full frame.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {astroPhotos.map((obj, objIdx) => (
            <button
              key={obj.name}
              onClick={() => setGallery({ objIdx, imgIdx: 0 })}
              className="group text-left rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <div className="relative aspect-[4/5] sm:aspect-[4/3] bg-zinc-950 overflow-hidden">
                <img
                  src={`/${obj.files[0]}`}
                  alt={obj.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
                />
                {obj.files.length > 1 && (
                  <span className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5 backdrop-blur">
                    {obj.files.length} shots
                  </span>
                )}
                {obj.gear && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/85 text-zinc-700 text-[10px] px-2 py-0.5 backdrop-blur">
                    {obj.gear}
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium text-sm leading-tight">{obj.name}</div>
                <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{obj.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {gallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setGallery(null)}
          >
            <div
              className="relative max-w-5xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setGallery(null)}
                className="absolute -top-1 right-0 text-white/70 hover:text-white text-2xl leading-none z-10"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="relative">
                <img
                  src={`/${astroPhotos[gallery.objIdx].files[gallery.imgIdx]}`}
                  alt={astroPhotos[gallery.objIdx].name}
                  className="max-w-full max-h-[74vh] rounded-xl border border-white/10 shadow-2xl"
                />
                {astroPhotos[gallery.objIdx].files.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                      disabled={gallery.imgIdx === 0}
                      onClick={() =>
                        setGallery((g) => (g && g.imgIdx > 0 ? { objIdx: g.objIdx, imgIdx: g.imgIdx - 1 } : g))
                      }
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                      disabled={gallery.imgIdx === astroPhotos[gallery.objIdx].files.length - 1}
                      onClick={() =>
                        setGallery((g) =>
                          g && g.imgIdx < astroPhotos[g.objIdx].files.length - 1
                            ? { objIdx: g.objIdx, imgIdx: g.imgIdx + 1 }
                            : g
                        )
                      }
                      aria-label="Next"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              <div className="mt-4 text-center text-white max-w-2xl">
                <div className="font-medium flex items-center justify-center gap-2">
                  {astroPhotos[gallery.objIdx].name}
                  {astroPhotos[gallery.objIdx].files.length > 1 && (
                    <span className="text-xs text-white/50">
                      {gallery.imgIdx + 1} / {astroPhotos[gallery.objIdx].files.length}
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/70 mt-1">{astroPhotos[gallery.objIdx].desc}</div>
                {astroPhotos[gallery.objIdx].gear && (
                  <div className="text-xs text-white/40 mt-2">{astroPhotos[gallery.objIdx].gear}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TimeMachine />
    </div>
  );
}


// // --- Taoist Philosophy Note Page ---
// function TaoistPhilosophyNote({ onBack }: { onBack: () => void }) {
//   // Apple-like smooth animation variants
//   const variants = {
//   initial: { opacity: 0, y: 40, scale: 0.98 },
//   animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
//   exit: { opacity: 0, y: -30, scale: 0.97, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
// };

//   return (
//     <AnimatePresence mode="wait">
//       <motion.div
//         key="taoist-note"
//         variants={variants}
//         initial="initial"
//         animate="animate"
//         exit="exit"
//         className="rounded-3xl border border-zinc-200 bg-white p-4 md:p-10 shadow-[0_1px_0_#00000010] min-h-[70vh] flex flex-col"
//         style={{ overflow: "hidden"}}
//       >
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
//           <div>
//             <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">taoist philosophy</h1>
//             <div className="text-xs text-zinc-500 mt-1">Aug 12, 2025</div>
//           </div>
//           <button
//             onClick={onBack}
//             className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition font-medium shadow-sm"
//             title="Back to Notes"
//           >
//             <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
//               <path d="M11 15l-5-5 5-5" />
//             </svg>
//             Back
//           </button>
//         </div>
//         <div className="prose prose-zinc max-w-none text-zinc-700 space-y-10 flex-1 flex flex-col">
//           <section>
//             <blockquote>
//               <span className="italic text-lg">
//                 “A good traveler has no fixed plans, and is not intent on arriving”
//               </span>
//               <br />
//               <span className="text-xs text-zinc-400">— Laozi, Tao Te Ching</span>
//             </blockquote>
//           </section>
//           <section>
//             <img
//               src="https://images.unsplash.com/photo-1659500979313-3e1c7d946654?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//               alt="Taoist Mountain"
//               className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-200 shadow-lg mb-6"
//               style={{ objectFit: "cover", maxHeight: 340 }}
//             />
//             <p>
//               <b>My take on Taoism?</b> It’s not about mystical riddles or ancient poetry. It’s about learning to get out of your own way. The world is always moving, always changing, and the more you try to force it, the more tangled things get.
//             </p>
//             <p>
//               I used to think philosophy was about answers. Taoism taught me it’s about learning to be okay with not knowing. It’s about noticing the flow of things—work, relationships, even your own thoughts—and realizing you don’t have to fight the current all the time.
//             </p>
//           </section>
//           <section>
//             <h2 className="text-xl font-semibold mt-8 mb-2">What it means for me</h2>
//             <ul>
//               <li>
//                 <b>Letting go of control:</b> The more I try to micromanage life, the more I miss what’s actually happening. Sometimes the best move is to step back and let things unfold.
//               </li>
//               <li>
//                 <b>Embracing paradox:</b> You can be ambitious and relaxed. You can care deeply and still let go. Taoism isn’t about picking sides—it’s about holding both.
//               </li>
//               <li>
//                 <b>Effortless action (Wu Wei):</b> The best work I’ve done has always felt natural, not forced. When I’m in the zone, it’s like things just happen.
//               </li>
//               <li>
//                 <b>Nature as a teacher:</b> Rivers don’t rush, trees don’t hurry, but everything gets done. I try to remember that when I’m stuck or impatient.
//               </li>
//             </ul>
//           </section>
//           <section>
//             <div className="rounded-xl border border-dashed border-zinc-200 p-6 bg-zinc-50 text-base my-8 shadow-sm">
//               <b>Modern Taoism?</b>
//               <br />
//               In a world obsessed with hustle, optimization, and “crushing it,” Taoism is a reminder to breathe, to let go, and to trust the process. Sometimes, the most radical thing you can do is nothing at all. 
//               <br />
//               <br />
//               <span className="text-zinc-500">
//                 I’m not a monk. I still get stressed, still overthink, still want to win. But Taoism gives me a way to zoom out and remember: the river flows, with or without me.
//               </span>
//             </div>
//           </section>
//           <section>
//             <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-8">
//               <img
//                   src="https://images.unsplash.com/photo-1709884233479-9fdc5cb6955b?q=80&w=1135&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//                   alt="Yin Yang"
//                   className="w-28 h-28 rounded-full border border-zinc-200 shadow"
//                 />
//               <div className="text-center md:text-left">
//                 <p className="text-lg font-medium mb-2">“Nature does not hurry, yet everything is accomplished.”</p>
//                 <span className="text-xs text-zinc-400">— Laozi</span>
//               </div>
//             </div>
//           </section>
//           <section>
//             <h2 className="text-xl font-semibold mt-12 mb-2">How I use it day-to-day</h2>
//             <ul>
//               <li>
//                 <b>When I’m stuck:</b> I pause, breathe, and let my mind wander. Usually, the answer shows up when I stop looking for it.
//               </li>
//               <li>
//                 <b>When I’m overwhelmed:</b> I remind myself that not everything needs to be solved right now. The river takes its time.
//               </li>
//               <li>
//                 <b>When I’m excited:</b> I try to ride the wave, not overthink it. Flow is better than force.
//               </li>
//             </ul>
//           </section>
//           <section>
//             <div className="text-center text-zinc-500 mt-16 text-base">
//               <span className="italic">
//                 “The wise man is one who, knows, what he does not know.”
//               </span>
//               <br />
//               <span className="text-xs text-zinc-400">— Laozi</span>
//             </div>
//           </section>
//         </div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }


// --- Taoist Philosophy Note Page ---
function TaoistPhilosophyNote({ onBack }: { onBack: () => void }) {
  // Apple-like smooth animation variants
  const variants = {
    initial: { opacity: 0, y: 40, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -30, scale: 0.97, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="taoist-note"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="font-sans rounded-3xl border border-zinc-200 bg-white p-6 md:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-h-[80vh] flex flex-col max-w-4xl mx-auto my-8"
        style={{ overflow: "hidden" }}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">aims without attachment</h1>
            <div className="text-sm text-zinc-400 mt-2 font-medium uppercase tracking-widest">Philosophy • Aug 2025</div>
          </div>
          <button
            onClick={onBack}
            className="group flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all font-medium shadow-sm"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:-translate-x-1">
              <path d="M11 15l-5-5 5-5" />
            </svg>
            Back to Notes
          </button>
        </div>

        <div className="prose prose-zinc max-w-none text-zinc-700 space-y-12 flex-1">
          
          {/* Intro Quote */}
          <section className="relative py-4">
            <div className="absolute left-0 top-0 w-1 h-full bg-zinc-100 rounded-full" />
            <blockquote className="border-none pl-8 m-0">
              <p className="italic text-base md:text-lg text-zinc-800 leading-relaxed">
                “a good traveler has no fixed plans and is not intent on arriving.”
              </p>
              <cite className="text-xs text-zinc-400 uppercase tracking-widest not-italic mt-4 block">
                — Laozi, Tao Te Ching
              </cite>
            </blockquote>
          </section>

          {/* Hero Image - Represents the "Flow" and "Path" */}
          <section>
            <div className="relative group overflow-hidden rounded-3xl border border-zinc-200">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1674&auto=format&fit=crop"
                alt="River flowing through a misty valley"
                className="w-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
                style={{ maxHeight: 420 }}
              />
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-zinc-500 uppercase tracking-tight">
                finding the destination through the motion of the river, not by staring at the shore
              </div>
            </div>
          </section>

                    {/* Core Philosophy Section */}
          <section className="max-w-3xl">
            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-zinc-900">
                Dropping the Enforcement
              </h2>

              <div className="space-y-6 text-sm md:text-base leading-relaxed text-zinc-700">
                <p>
                  I took it upon myself, from an early age, to answer the most difficult
                  questions a conscious being would have to face in their life: What is
                  the main goal of it all? Where is the final destination? What is the
                  fastest route? What is my role in this puzzle?
                </p>

                <p>
                  Again and again, I arrived at answers that were unready and felt, wrong or incomplete. 
                  I’d stare at the horizon, trying to find the “true north” of something 
                  ever-developing. Nothing felt true. Nothing felt absolute. A way to cope
                  was to let go of the “outcome” of it all. Let the motion dictate, whilst
                  still moving in a direction I deemed momentarily meaningful.
                </p>

                <p>
                  It seems so basic, so trivial, so palpable — this idea that “outcomes
                  shouldn’t define our objectives.” But this idea runs deeper than when
                  first assayed. Over the past few years, my learned reflections kept
                  circling the same underlying themes. At some point, I grasped that most
                  of us are driven by remarkably similar deep desires. The things that
                  subconsciously motivate every decision and define every action, the
                  overarching patterns of our lives are strikingly consistent.
                </p>

                <div className="pl-4 border-l border-zinc-200 space-y-2">
                  <p>To feel secure.</p>
                  <p>To feel capable.</p>
                  <p>To feel seen - and to be perceived.</p>
                </div>

                <p>
                  There is often a quiet urge beneath it all: to prove “something” to
                  “someone.” This impulse isn’t inherently good or bad. It simply is. It
                  animates us.
                </p>

                <p>
                  In an effort to reconcile this messy clustering of motives and
                  contradictions, Taoism found its way in.
                </p>

                <p className="font-semibold text-zinc-900">
                  Let go of the need to control.
                </p>

                <p>
                  In a world that glorifies hustle, grind, and “crushing it” which, to
                  be fair, I both love and suffer from, this feels almost irresponsible.
                  We are conditioned to believe that if we work hard enough, plan carefully
                  enough, optimize each step, we can force the river to flow where we want
                  it to go. But I reckon it’s not this way.
                </p>

                <p>
                  We all have dreams, goals, and ambitions. The question is: how tightly
                  are we gripping them?
                </p>

                <p>
                  My ill-informed, personally concocted take on Taoism isn't about
                  sitting still. It’s about learning to get out of your own way. The shift
                  is that I've stopped trying to strangle the outcome into existence,
                  because I simply cannot.
                </p>

                <p>
                  I exist. I try. I fail.
                  <br />
                  But the outcome is not entirely tied to my actions (or at least less-so).
                </p>

                <p>
                  And all that said, what do I know? If nothing else, I’ve freed myself
                  from the burden of those haunting, unanswerable life questions in the
                  process.
                </p>
              </div>
            </div>
          </section>

          {/* Full-width Highlight Section */}
          <section className="bg-zinc-900 rounded-[2.5rem] p-5 md:p-11 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-white text-xl font-semibold mb-6">Effortless Action (Wu Wei)</h2>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
                The best work I’ve ever done felt natural, not coerced.
              </p>
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium">Practice: Aim high, then let go.</span>
              </div>
            </div>
            {/* Subtle Abstract Background Element */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tr from-zinc-800 to-transparent rounded-full opacity-50 blur-3xl" />
          </section>

          

        </div>
      </motion.div>
    </AnimatePresence>
  );
}


// =========================================================
// Projects + Research — single source of truth (shared with search)
// =========================================================
const WORK = [
    {
      title: "Fixate — verified focus",
      venue: "Chrome Extension (MV3) · 2026",
      tags: ["typescript", "computer vision", "local-first", "product"],
      desc:
        "A focus tool that verifies you actually stayed heads-down. Local webcam gaze-tracking + hard site-blocking turn real focus time into a shareable, accumulating record — 100% on-device, no backend.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Most focus apps ask you to trust yourself. Fixate proves it. It calibrates a personal
            gaze baseline before every session, then watches — locally — for the moment your
            attention drifts, blocks your distraction sites, and notices when you leave the browser
            entirely. The session becomes a verifiable record of real, attributed focus time.
          </p>
          <FixateViz />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Trustworthy gaze detection</div>
              <p className="text-xs text-zinc-600">
                Combines eye-blendshapes with head pose, applies hysteresis so it never flickers,
                and skips frames it isn't sure about (no face / mid-blink) instead of falsely
                flagging them.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Specific attribution</div>
              <p className="text-xs text-zinc-600">
                The end report says what actually happened — <em>"2 gaze drifts, left Chrome once,
                tried instagram.com twice"</em> — and feeds a shareable focus card.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Friction to quit</div>
              <p className="text-xs text-zinc-600">
                Ending early takes a press-and-hold or a typed reason, so a moment of weakness
                isn't one click away.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Private by construction</div>
              <p className="text-xs text-zinc-600">
                No camera frames, blendshapes, or session data ever leave the machine. There is no
                server — and the UI is honest about exactly what it can and can't see.
              </p>
            </div>
          </div>
          <ul className="list-disc pl-6 space-y-1 text-zinc-600 text-xs leading-relaxed">
            <li><b>Site blocking</b> via <code>declarativeNetRequest</code> for the session's duration</li>
            <li><b>Leaving-Chrome detection</b> through <code>windows.onFocusChanged</code></li>
            <li><b>Runs in the background</b> — a hidden document, live dashboard in the toolbar popout</li>
            <li><b>Verified history</b> — accumulates focus hours, clean streaks, and one pattern insight</li>
          </ul>
        </div>
      ),
      clickable: true,
    },
    {
      title: "whoomp — WHOOP 4.0, unlocked",
      venue: "Reverse Engineering · iOS",
      tags: ["reverse engineering", "bluetooth le", "react native", "expo"],
      desc:
        "Reverse-engineered the WHOOP 4.0 strap's Bluetooth protocol and built a local-only iOS app that reads raw biometrics straight off the band — computing HRV, recovery, and strain on-device. No subscription, no cloud.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            A commercial fitness strap locks your own biometric data behind a monthly subscription.
            whoomp takes it back. By decoding the strap's proprietary Bluetooth LE protocol, the app
            talks to the hardware directly — pulling raw heart-rate and sensor streams and computing
            recovery metrics locally, with nothing leaving the phone.
          </p>
          <WhoompViz />
          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="font-medium mb-1">Protocol work</div>
            <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
              <li>Mapped the custom GATT service and its command / event / data characteristics</li>
              <li>Decoded the framed command format with a matched <code>CRC-32</code> parameter set</li>
              <li>Parsed the 96-byte realtime packet from the strap's data stream</li>
              <li>Drove the standard Heart-Rate characteristic after issuing the enable-broadcast command</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Expo (SDK 52+)</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">react-native-ble-plx</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">expo-sqlite</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">EAS Build</span>
          </div>
          <p className="text-xs text-zinc-500 italic">
            A systems + protocol project: BLE, byte-level framing, and on-device signal processing —
            wrapped in a clean dashboard.
          </p>
        </div>
      ),
      clickable: true,
    },
    {
      title: "kōdō — local-first productivity OS",
      venue: "Personal Dashboard · Local SLMs",
      tags: ["node", "local SLM", "ollama", "sqlite"],
      desc:
        "A brain-dump dashboard that runs on local language models. Type anything and two on-device SLMs categorize priority and estimate time in parallel; natural-language dates auto-pin to a calendar; everything syncs via SQLite. No cloud, no subscriptions.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            One input box, zero ceremony. Dump a messy thought — <em>"call bank tmr, fix login bug,
            brunch this weekend"</em> — and kōdō cleans up the title, assigns a priority, estimates
            how long it'll take, and pins anything dated to the calendar. The intelligence runs
            entirely on local models, so it's fast, private, and free to run.
          </p>
          <KodoViz />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Two models, in parallel</div>
              <p className="text-xs text-zinc-600">
                Gemma (via Ollama) categorizes priority; a second model (qwen2.5:1.5b) estimates
                time in the background so the timeline fills in without ever blocking you.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Natural-language dates</div>
              <p className="text-xs text-zinc-600">
                Understands <code>tmr</code>, <code>this weekend</code>, <code>end of month</code>,
                <code>in 2 weeks</code>, <code>3/15</code> — and drops the task on the right day.
              </p>
            </div>
          </div>
          <ul className="list-disc pl-6 space-y-1 text-zinc-600 text-xs leading-relaxed">
            <li><b>Cross-device sync</b> — same data on phone and laptop, all SQLite on the server</li>
            <li><b>Analytics</b> — streak, completion rate, activity heatmap, priority donut</li>
            <li><b>Now / next / later</b> layout with an estimated-hours task timeline</li>
            <li><b>Stack:</b> Node + Express, better-sqlite3, Chart.js, Ollama, zero build step</li>
          </ul>
        </div>
      ),
      clickable: true,
    },
    {
      title: "CryptoRadar — regulatory intelligence",
      venue: "Market & Compliance Terminal",
      tags: ["next.js", "react", "fintech", "data viz"],
      desc:
        "A real-time crypto regulatory and market-intelligence terminal for the Americas — live market stats, ETF flows, a compliance calendar, and CBDC / stablecoin trackers packed into one trading-desk-style view.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Crypto regulation moves faster than anyone can read. CryptoRadar pulls the market and the
            policy picture into a single dense dashboard: what's happening to price and ETF demand
            right now, and what's happening to the rules underneath it across the Americas.
          </p>
          <CryptoRadarViz />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Market layer</div>
              <p className="text-xs text-zinc-600">
                Live global stats (CoinGecko), a BTC/ETH 90-day correlation panel, ETF demand flows,
                and a stablecoin monitor.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium mb-1">Regulatory layer</div>
              <p className="text-xs text-zinc-600">
                A country regulatory snapshot, compliance calendar, CBDC tracker, tokenization
                pipeline, and an RSS-driven live intelligence feed.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Next.js 16</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">React 19</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Recharts</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Tailwind v4</span>
          </div>
        </div>
      ),
      clickable: true,
    },
    {
      title: "Mochi — AI desk companion",
      venue: "Embedded / Robotics · ESP32",
      tags: ["esp32", "embedded", "local SLM", "hardware"],
      desc:
        "A palm-sized desk-companion robot: an ESP32 with a touchscreen face running a small language model, iterated across several hardware revisions. An endearingly-ugly (dasai) pet that lives on your desk.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Mochi is a hardware love-letter to the idea that AI can have a physical body and a
            personality. Built on an ESP32 with a touchscreen display, it wears an expressive
            animated face and is driven by a small language model — a companion, not an assistant.
            The project has gone through multiple hardware and firmware revisions.
          </p>
          <div className="rounded-xl border border-zinc-200 p-3 bg-zinc-50">
            <img
              src="/mochi_screen.png"
              alt="Mochi robot display — LVGL UI running on the ESP32 touchscreen"
              className="rounded-lg border border-zinc-200 mx-auto max-h-56 object-contain"
            />
            <p className="text-[11px] text-zinc-500 mt-2 text-center">
              Mochi's on-device display — the LVGL interface running on the ESP32 touchscreen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">ESP32</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">PlatformIO / C++</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Touchscreen UI</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Local SLM</span>
          </div>
          <p className="text-xs text-zinc-500 italic">
            An ongoing exploration of embedded firmware, display pipelines, and giving a small model
            a face.
          </p>
        </div>
      ),
      clickable: true,
    },
    {
      title: "XRP algo trading bot",
      venue: "Crypto / Finance · In progress",
      tags: ["python", "finance", "crypto", "local SLM"],
      desc:
        "An algorithmic trading bot for XRP that pairs classical signals with a local small language model for early-stage predictive modeling. Actively in development.",
      details: (
        <div className="space-y-3 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            An experiment in blending quantitative signals with on-device language models: the bot
            ingests market data and uses a locally-hosted SLM to help frame short-horizon
            predictions, feeding a Python execution layer. Still a work in progress — shared here as
            a live build rather than a finished product.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Python</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Local SLM</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Predictive modeling</span>
          </div>
        </div>
      ),
      clickable: true,
    },
          {
      title: "Dash Options chain Platform",
      venue: "Finance / Derivatives",
      tags: ["python", "finance", "data analysis", "risk reversal"],
      desc: "Built a analytics dashboard for analyzing historical options chain data, focusing on risk reversal strategies, volatility skew, and time-series visualization. Built to aid my own trading strategies.",
      details: (
        <div className="space-y-8 text-sm max-w-4xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            This comprehensive trading dashboard processes massive historical options datasets to identify trends, market sentiment, and trading opportunities through volatility analysis, Greeks tracking, and risk-neutral density modeling. Built with Python for data processing and interactive visualization libraries for historic/real-time market analysis.
          </p>
          {/* Main Dashboard Overview */}
          <div className="space-y-2">
            <img
              src="/optionsdashMain.png"
              alt="Main Dashboard Interface"
              className="rounded-xl border shadow w-full max-w-2xl mx-auto"
              style={{ marginBottom: "20px", lineHeight: "1.5" }}
            />
            <p className="text-xs text-zinc-500 mt-1">
              <b>Main Dashboard</b> – Real-time filtering interface showing key metrics including
              spot price, ATM IV, risk-reversal spread (30D RR at -1.1%), and butterfly spread.
              Greeks heatmaps display Delta and Gamma patterns across the entire options chain.
            </p>
          </div>

          {/* Multi-view Analysis */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <img src="/IV smile.png" alt="IV Smile Visualization" className="rounded-xl border shadow" /> 
              <p className="text-xs text-zinc-500 mt-1">
                <b>Implied Volatility Smile</b> – Time-series analysis showing how call and put IV curves evolve. The ATM inflection point reveals market sentiment shifts and skew dynamics critical for risk reversal strategies.
              </p>
            </div> 

            <div>
              <img src="/IV surface.png" alt="3D Volatility Surface" className="rounded-xl border shadow" /> 
              <p className="text-xs text-zinc-500 mt-1">
                <b>3D Volatility Surface</b> – Interactive surface plot mapping implied volatility across strike prices and time to expiration, revealing term structure patterns and arbitrage opportunities in multi-dimensional space.
              </p>
            </div> 
          </div> 

          {/* Risk-Neutral Probability Density Section */} 
         <div className="grid grid-cols-2 gap-3">
          <div>
            <img
              src="/Risk neutral density .png"
              alt="Risk-Neutral Probability Density"
              className="rounded-xl border shadow w-full"
            />
          </div>

          {/* ← this is the only thing that changed */}
          <div className="pt-16">   {/* or pt-6, pt-8, etc. */}
            <p className="text-xs text-zinc-500">
              <b>Risk-Neutral Probability Density</b> – Computed from options prices using Breeden-Litzenberger method. Shows market-implied probability distribution of future prices with quantile analysis for tail risk assessment.
            </p>
          </div>
        </div>

          {/* Key Features */} 
          <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-sm leading-relaxed italic">
            <li>Custom Black-Scholes & SABR model calibration engine with real-time parameter fitting</li>
            <li>Live Greeks computation (Delta, Gamma, Theta, Vega) with directional exposure heatmaps</li>
            <li>Risk-neutral density extraction for probability-weighted scenario analysis</li>
            <li>Multi-timeframe volatility surface interpolation using cubic splines</li>
          </ul>
        </div> 
      ),
      clickable: true,
    },
    {
      title: "Galactic Mapping with Machine Learning",
      venue: "James Webb Space Telescope",
      tags: ["machine learning", "astronomy", "classification"],
      desc: "Developed a novel machine learning classification model to discern galactic components in JWST images of NGC 623, with an 84% accuracy (across not a very large sample 🥲). Built to probabilistically identify features such as star clusters, dust lanes, and galactic cores across multi-band photometric data.",
      details: (
        <div className="space-y-4 text-sm">
          <p>

            Evaluated Support Vector Machines, Random Forests, and KNN to
            classify galactic components (C1–C5). JWST’s multi-band filters
            allowed for fine-grained spatial and spectral extraction. 
            Achieved an average F1-score of 0.84, with strengths in background
            and bulge detection, but challenges in outer disk classification driven by multicollinearity across sample. 
          </p>

          {/* Images with explanations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <img
                src="/filters.png"
                alt="JWST Filters"
                className="rounded-xl border shadow"
              />
              <p className="text-xs text-zinc-500 mt-1">
                <b>JWST Filters</b> – each filter isolates light at specific
                wavelengths. By combining them, we reconstruct galaxies in 3D
                color-mapped form.
              </p>
            </div>
            <div>
              <img
                src="/sites.png"
                alt="Classification Sites"
                className="rounded-xl border shadow"
              />
              <p className="text-xs text-zinc-500 mt-1">
                <b>Classification Sites</b> – selected training/testing regions
                in NGC 623, labeled into 5 galactic component classes.
              </p>
            </div>
          </div>

          {/* Table of Results */}
          <table className="w-full text-xs border border-zinc-300 rounded-md overflow-hidden">
            <thead className="bg-zinc-100">
              <tr>
                <th className="border px-2 py-1">Class</th>
                <th className="border px-2 py-1">SVM</th>
                <th className="border px-2 py-1">RF</th>
                <th className="border px-2 py-1">KNN</th>
                <th className="border px-2 py-1">Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">C1 Background</td>
                <td className="border px-2 py-1">0.91</td>
                <td className="border px-2 py-1">0.98</td>
                <td className="border px-2 py-1">0.99</td>
                <td className="border px-2 py-1">0.97</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">C2 Bulge</td>
                <td className="border px-2 py-1">0.80</td>
                <td className="border px-2 py-1">0.80</td>
                <td className="border px-2 py-1">1.00</td>
                <td className="border px-2 py-1">0.87</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">C3 HII Region</td>
                <td className="border px-2 py-1">0.85</td>
                <td className="border px-2 py-1">1.00</td>
                <td className="border px-2 py-1">0.67</td>
                <td className="border px-2 py-1">0.84</td>
              </tr>
            </tbody>
          </table>

          {/* Mock graph 
          <img
            src="/f1_comparison_chart.png"
            alt="F1 Score Comparison"
            className="rounded-xl border shadow"
          />*/}
          <p className="text-xs text-zinc-500">
            Average F1-score comparison across classifiers, highlighting
            strengths in background/bulge detection and weaknesses in outer disk.
          </p>
        </div>
      ),
      clickable: true,
    },
    {
      title: "Bird Species Classification Algorithm",
      venue: "Ontario Field Study",
      tags: ["machine learning", "bioacoustics", "classification"],
      desc:
        "Prototype CNN using mel-spectrogram inputs to support automated bird species ID in Ontario field recordings.",
      details: (
        <div className="space-y-3 text-sm">
          <p>
            Short audio clips were converted to mel-spectrograms and
            used to train a compact convolutional model. The work focused on
            handling background noise typical of field conditions and keeping
            the model lightweight for on-device inference.
          </p>
          <ul className="list-disc pl-5">
            <li>
              <strong>Dataset:</strong> curated field recordings covering local
              species and habitats, with manual labels for training and
              validation.
            </li>
            <li>
              <strong>Approach:</strong> mel-spectrogram preprocessing, data
              augmentation (time/frequency masking, noise injection), and a
              compact CNN architecture optimized for edge deployment.
            </li>
            <li>
              <strong>Evaluation:</strong> cross-validation on held-out folds
              during prototyping showed strong per-class separability; further
              field validation and larger-scale testing are ongoing.
            </li>
          </ul>
          <p className="text-xs text-zinc-500">
            Notes: wording is intentionally conservative — this is a prototype
            intended for continued validation in diverse field conditions.
          </p>
        </div>
      ),
      clickable: true,
    },
  //   {
  //   title: "Multi-Module Spectral Analysis of PAH States",
  //   venue: "NGC 2023 / Spitzer Space Telescope",
  //   tags: ["astrophysics", "spectroscopy", "signal processing"],
  //   desc: "Diagnostic framework investigating the ionization states of Polycyclic Aromatic Hydrocarbons (PAHs) within the NGC 2023 reflection nebula. Utilized cross-instrument calibration between Spitzer IRS and IRAC modules to map the transition between neutral and ionic molecular species across Photo-Dissociation Regions (PDRs).",
  //   details: (
  //     <div className="space-y-4 text-sm">
  //       <p>
  //         Characterized the spatial distribution of PAH molecules by bridging spectral data from the Short-Low (SL1/SL2) and Long-Low (LL2) IRS modules. 
  //         The research utilized the 11.2µm emission band as a primary proxy for neutral PAHs, while leveraging IRAC 8.0µm photometric data—where ~80% of emission is attributed to PAHs—to map ionic populations. 
  //         This necessitated precise spatial alignment and flux normalization across instrument apertures to account for limited Field-of-View (FOV) overlap.
  //       </p>

  //       {/* Visual Data Comparison */}
  //       <div className="grid grid-cols-2 gap-3">
  //         <div>
  //           <img
  //             src="/ngc2023_spitzer.jpg"
  //             alt="NGC 2023 IRAC 8um"
  //             className="rounded-xl border shadow"
  //           />
  //           <p className="text-xs text-zinc-500 mt-1">
  //             <b>Ionic Proxy (8.0µm)</b> – Mapping the diffuse PAH-rich shell where ionization is driven by intense stellar UV radiation.
  //           </p>
  //         </div>
  //         <div>
  //           <img
  //             src="/FOVs_IRAC_LL2_S_SL1.png"
  //             alt="Field of View Overlays"
  //             className="rounded-xl border shadow"
  //           />
  //           <p className="text-xs text-zinc-500 mt-1">
  //             <b>Instrumental Calibration</b> – Geometric overlay of SL1 (white box) and LL2 spectral slits onto photometric imaging to resolve spatial discontinuities.
  //           </p>
  //         </div>
  //       </div>

  //       {/* Physics & Instrumental Specifications */}
  //       <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
  //         <h4 className="text-xs font-bold mb-2 uppercase tracking-wider text-zinc-600">Signal Extraction & Methodology</h4>
  //         <table className="w-full text-xs border-collapse">
  //           <thead>
  //             <tr className="border-b border-zinc-300 text-left text-zinc-500">
  //               <th className="pb-1">Feature</th>
  //               <th className="pb-1">Wavelength</th>
  //               <th className="pb-1">Continuum Approach</th>
  //             </tr>
  //           </thead>
  //           <tbody className="text-zinc-700">
  //             <tr>
  //               <td className="py-1 font-medium">Neutral PAH</td>
  //               <td className="py-1">11.2µm</td>
  //               <td className="py-1">Global Polynomial Fit</td>
  //             </tr>
  //             <tr>
  //               <td className="py-1 font-medium">Bending Modes</td>
  //               <td className="py-1">8.6µm / 12.7µm</td>
  //               <td className="py-1">Local Spline Interpolation</td>
  //             </tr>
  //             <tr>
  //               <td className="py-1 font-medium">Spectral Range</td>
  //               <td className="py-1">7.3µm – 14.0µm</td>
  //               <td className="py-1">SL1 Cube Processing</td>
  //             </tr>
  //           </tbody>
  //         </table>
  //       </div>

  //       <p className="text-xs text-zinc-500 italic">
  //         Technical focus: FITS data cube analysis, local spline continuum subtraction, and WCS-based spatial cross-correlation.
  //       </p>
  //     </div>
  //   ),
  //   clickable: true,
  // },
  //   

  {
  title: "Multi-Module Spectral Analysis of PAH States",
  venue: "NGC 2023 / Spitzer Space Telescope",
  tags: ["astronomy", "spectroscopy", "signal processing"],
  desc: "Developed a diagnostic framework to map ionic and neutral Polycyclic Aromatic Hydrocarbons (PAHs) by cross-calibrating IRAC photometry with IRS spectroscopy.",
  details: (
    <div className="space-y-4 text-sm">
      {/* High-Level Overview */}
      <p>
        This research focused on how interstellar "dust" (PAH molecules) reacts to intense stellar radiation. By comparing different infrared signatures, the study mapped where these molecules lose electrons (become ionic) versus where they remain neutral. This required bridging data from different cameras on the Spitzer Space Telescope that didn't perfectly line up, effectively creating a unified multi-wavelength map of the nebula's chemical environment.
      </p>

      {/* Technical Deep Dive */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <img
            src="/ngc2023_spitzer.jpg"
            alt="NGC 2023 IRAC 8um"
            className="rounded-xl border shadow h-40 w-full object-cover"
          />
          <p className="text-xs text-zinc-500 mt-1">
            <b>Ionic Proxy (8.0µm)</b> – Using IRAC data as a representative for ionic PAHs, where ~80% of the emission in PDRs originates from these molecules.
          </p>
        </div>
        <div>
          <img
            src="/FOVs_IRAC_LL2_S_SL1.png"
            alt="Field of View Overlays"
            className="rounded-xl border shadow h-40 w-full object-cover"
          />
          <p className="text-xs text-zinc-500 mt-1">
            <b>Spatial Alignment</b> – Resolving the 30% overlap between SL1 spectral cubes (white) and LL2 observations (colors) to ensure flux consistency.
          </p>
        </div>
      </div>

      {/* Physics & Instrumental Specifications */}
      <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
        <h4 className="text-xs font-bold mb-2 uppercase tracking-wider text-zinc-600">Signal Extraction & Spectroscopy</h4>
        <ul className="list-disc ml-4 text-xs space-y-1 text-zinc-700">
          <li>
            <b>Neutral PAH Mapping:</b> Isolated the 11.2µm emission band from SL1 and SH spectral cubes to serve as a neutral molecule proxy.
          </li>
          <li>
            <b>Continuum Subtraction:</b> Implemented local spline interpolation to isolate bending modes at 8.6µm and 12.7µm from the thermal dust background.
          </li>
          <li>
            <b>Data Engineering:</b> Processed 3D FITS cubes containing spatial coordinates, wavelength arrays, and flux data (7.3µm – 14.0µm).
          </li>
        </ul>
      </div>

      <p className="text-xs text-zinc-500 italic">
        Technical focus: FITS data cube analysis, local spline continuum subtraction, and WCS-based spatial cross-correlation.
      </p>
    </div>
  ),
  clickable: true,
},
    {
      title: "CubeSat Satellite Project",
      venue: "Ukpik-1 CubeSat",
      tags: ["satellite", "radio", "engineering"],
      desc: "Worked on the development of a radio station for the Ukpik-1 CubeSat satellite project @ Western University, specializing in assembly operations and implementing a comms center for real-time data transmission.",
      details: (
        <div className="space-y-3 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Contributed to the ground segment of the Ukpik-1 CubeSat at Western University: built a
            ground communications station with RF calibration for real-time data relay, and assisted
            in satellite assembly and redundancy testing for the telemetry link.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">RF / radio</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Ground station</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Assembly & testing</span>
          </div>
        </div>
      ),
      clickable: true,
    },
];

// =========================================================
// Universal search index — pages, projects, notes, astro, concepts
// =========================================================
type SearchEntry = {
  title: string;
  subtitle: string;
  kind: "Page" | "Project" | "Research" | "Note" | "Astro" | "Concept";
  route: string;
  focus?: { astro?: string; project?: string };
  keywords: string;
};

const CONCEPTS: { label: string; note: string }[] = [
  { label: "AI / SLMs", note: "Machine learning and small on-device language models." },
  { label: "Finance", note: "Options, risk, crypto, analytics." },
  { label: "Astronomy", note: "Galaxies, nebulae, mapping." },
  { label: "Engineering", note: "Embedded, satellites, radio, hardware." },
  { label: "Astrophotography", note: "Capturing celestial objects with long exposures." },
  { label: "Trading", note: "Algorithmic and discretionary strategies." },
];

const SEARCH_INDEX: SearchEntry[] = [
  { title: "Home", subtitle: "Overview", kind: "Page", route: "home", keywords: "home start about ronak toprani" },
  { title: "Projects + Research", subtitle: "All builds & research", kind: "Page", route: "work", keywords: "projects research work builds portfolio" },
  { title: "Notes", subtitle: "Writing & astrophotography", kind: "Page", route: "blog", keywords: "notes writing blog astrophotography photos" },
  { title: "Idea Graph", subtitle: "Map of work & concepts", kind: "Page", route: "graph", keywords: "graph map ideas concepts connections" },
  { title: "Contact", subtitle: "Email & socials", kind: "Page", route: "contact", keywords: "contact email twitter x linkedin socials reach out hire" },
  { title: "aims without attachment", subtitle: "Note · Philosophy", kind: "Note", route: "blog", keywords: "taoism philosophy wu wei note writing laozi" },
  ...WORK.map((w): SearchEntry => ({
    title: w!.title,
    subtitle: w!.venue,
    kind: /research|astronom|spectros|classification|bird|galac|pah|spectral|cubesat|jwst/i.test(
      w!.venue + " " + w!.tags.join(" ")
    )
      ? "Research"
      : "Project",
    route: "work",
    focus: { project: w!.title },
    keywords: (w!.title + " " + w!.venue + " " + w!.tags.join(" ") + " " + w!.desc).toLowerCase(),
  })),
  ...ASTRO.map((a): SearchEntry => ({
    title: a.name,
    subtitle: "Astrophotography" + (a.gear ? " · " + a.gear : ""),
    kind: "Astro",
    route: "blog",
    focus: { astro: a.name },
    keywords: (a.name + " " + a.aliases.join(" ") + " " + a.desc).toLowerCase(),
  })),
  ...CONCEPTS.map((c): SearchEntry => ({
    title: c.label,
    subtitle: "Concept",
    kind: "Concept",
    route: "graph",
    keywords: (c.label + " " + c.note).toLowerCase(),
  })),
];

function searchAll(q: string): SearchEntry[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const terms = s.split(/\s+/);
  return SEARCH_INDEX.map((e) => {
    const hay = (e.title + " " + e.subtitle + " " + e.keywords).toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return { e, score: -1 };
      score += e.title.toLowerCase().includes(t) ? 3 : 1;
    }
    return { e, score };
  })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((r) => r.e);
}

function ProjectsResearch({ focusProject }: { focusProject?: string | null }) {
  const work = WORK;

  const [active, setActive] = useState<any | null>(null);
  const [cat, setCat] = useState<string>("all");

  // Deep-link: open a project modal when the universal search selects it
  useEffect(() => {
    if (!focusProject) return;
    const w = work.find((x) => x!.title === focusProject);
    if (w && w.clickable) setActive(w);
  }, [focusProject, work]);

  // Close the project modal on Escape
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const categories: { id: string; label: string; tags: string[] }[] = [
    { id: "all", label: "All", tags: [] },
    { id: "software", label: "Software", tags: ["typescript", "react", "next.js", "node", "expo", "computer vision", "local-first", "product", "data viz"] },
    { id: "finance", label: "Finance", tags: ["finance", "crypto", "trading", "fintech", "risk reversal", "data analysis"] },
    { id: "ai", label: "AI / ML", tags: ["machine learning", "local SLM", "ollama", "classification", "bioacoustics", "computer vision"] },
    { id: "research", label: "Research", tags: ["astronomy", "spectroscopy", "signal processing", "classification", "bioacoustics"] },
    { id: "hardware", label: "Hardware", tags: ["esp32", "embedded", "hardware", "satellite", "radio", "engineering", "bluetooth le", "reverse engineering"] },
  ];

  const shown = work.filter((w) => {
    if (cat === "all") return true;
    const set = categories.find((c) => c.id === cat)?.tags ?? [];
    return w!.tags.some((t) => set.includes(t));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              cat === c.id
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {shown.map((w) => (
        <div
          key={w!.title}
          className={`rounded-2xl border border-zinc-200 p-4 transition
            ${w!.clickable ? "hover:shadow-md hover:border-zinc-300 cursor-pointer" : ""}
          `}
          onClick={() => w!.clickable && setActive(w)}
          tabIndex={w!.clickable ? 0 : -1}
          aria-disabled={!w!.clickable}
          style={w!.clickable ? {} : { pointerEvents: "none" }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{w!.venue}</span>
            {w!.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-zinc-200 px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
          <h3 className="mt-1 font-medium">{w!.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{w!.desc}</p>
        </div>
      ))}

      {/* Overlay modal with animation */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-[90%] p-6 overflow-y-auto max-h-[85vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{active.title}</h2>
                  <p className="text-sm text-zinc-500">{active.venue}</p>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">{active.details}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =======
// Contact
// =======
function Contact() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <img
        src="/ronak.jpg"
        alt="Ronak Toprani"
        className="rounded-2xl border border-zinc-200 w-full max-w-3xl object-cover"
      />
      <div className="text-center max-w-xl">
        <h2 className="text-2xl font-semibold mb-2">Reach Out</h2>
        <p className="text-zinc-600 mb-1">
          hmu for collaborations, questions, or just to say hi
         
        </p>
               <div className="flex justify-center gap-8 mt-4">
        
          <a
            href="mailto:ronaktoprani@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Email"
            className="group"
          >
            {/* Gmail SVG */}
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#fff"/>
              <path d="M6 14v20c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V14c0-2.2-1.8-4-4-4H10c-2.2 0-4 1.8-4 4zm36 0l-18 13L6 14" stroke="#EA4335" strokeWidth="2"/>
            </svg>
          </a>
          <a
            href="https://twitter.com/ronak859"
            target="_blank"
            rel="noopener noreferrer"
            title="Twitter"
            className="group"
          >
            {/* Twitter SVG */}
            <img
              src="/xlogo.avif"
              alt="X Logo"
              width={32}
              height={32}
              className="border-zinc-200"
            />
          </a>
          <a
            href="https://linkedin.com/in/ronaktoprani"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="group"
          >
            {/* LinkedIn SVG */}
            <img
              src="/linkedin.png"
              alt="LinkedIn Logo"
              width={32}
              height={32}
              className=" border-zinc-200"
            />
          </a>
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-xs text-zinc-400">
            Toronto, Ontario
          </div>
          {/* <div className="text-xs text-zinc-500 pt-2">
            © 2026 Ronak Toprani™
          </div> */}
        </div>
      </div>
    </div>
  );
}

// =======
// Footer
// =======
function Footer() {
  // Add blink animation styles
  React.useEffect(() => {
    if (!document.getElementById('blink-keyframes')) {
      const style = document.createElement('style');
      style.id = 'blink-keyframes';
      style.textContent = `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const socialLinks = [
    {
      platform: "Twitter",
      url: "https://twitter.com/ronak859",
      icon: (
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.88 6.75H2.42l7.723-8.835L1.254 2.25h6.554l4.882 6.466 5.636-6.466zM17.534 20.589h1.81L6.162 3.97H4.21l13.324 16.619z" />
        </svg>
      ),
    },
    {
      platform: "LinkedIn",
      url: "https://linkedin.com/in/ronaktoprani",
      icon: (
        <img
          src="/linkedin.png"
          alt="LinkedIn"
          width={18}
          height={18}
          className="opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        />
      ),
    },
    {
      platform: "Email",
      url: "mailto:ronaktoprani@gmail.com",
      icon: (
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        >
          <rect x={2} y={4} width={20} height={16} rx={2} />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="mt-12 border-t border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left Section */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" style={{ animation: 'blink 2s ease-in-out infinite' }} />
            <span className="text-sm font-medium text-zinc-700">based in Toronto</span>
          </div>

          {/* Right Section - Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.platform}
                className="group text-zinc-600 hover:text-zinc-900 transition-colors duration-200"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}