import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookText,
  Atom,
  Lightbulb,
  GitBranch,
  Search,
  Command,
  Clock,
  ExternalLink,
  User,
} from "lucide-react";

type WorkItem = {
  title: string;
  venue: string;
  tags: string[];
  desc: string;
  details?: JSX.Element; // optional expanded content
};

// =======
// Layout
// =======
export default function Portfolio() {
  const [route, setRoute] = useState("home");
  const [paletteOpen, setPaletteOpen] = useState(false);

  // keyboard: "k" or "/" opens command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
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
          <Sidebar route={route} setRoute={setRoute} />
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
                <Page key="notes" title="Notes" subtitle="Short notes with bad grammar.">
                  <Notes />
                </Page>
              )}
              {route === "graph" && (
                <Page key="graph" title="Idea Graph" subtitle="A current map linking projects, papers, and concepts.">
                  <IdeaGraph />
                </Page>
              )}
              {route === "work" && (
                <Page key="work" title="Projects + Research" subtitle="Selected research, builds, and experiments.">
                  <ProjectsResearch />
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
        onNavigate={(to) => setRoute(to)}
      />
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
          I’m <span className="font-medium">Ronak Toprani</span> — I currently spend my days working on tech in finance, love physics and philosophy, and build cool things sometimes. this is my portfolio.
        </p>
         <img
          src="/home.jpeg"
          alt="Ronak Toprani"
          className="rounded-2xl border border-zinc-200 w-full max-w-xl mx-auto"
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <BlockCard title="Latest Project" icon={<Atom className="size-4" />}>
         Options Analytics dashboard: analysis on historical options chains for equities. Risk reversal, volatility smile + skew. 
        </BlockCard>
        <BlockCard title="Recent Research" icon={<GitBranch className="size-4" />}>
          Galactic mapping with machine learning, spectral emission studies, and CubeSat communications.
        </BlockCard>
        <BlockCard title="Recent Note" icon={<BookText className="size-4" />}>
          Shared new astrophotography: see my images of the C27 Crescent Nebula and more in the Notes section.
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

      <div className="relative h-[420px] rounded-3xl border border-zinc-200 overflow-hidden">
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
    // Projects
    { id: "options", label: "Options Chain Analytics Platform", kind: "Project", x: 120, y: 90, note: "Analytics for historical options chain data." },
    { id: "galaxy", label: "Galactic Mapping ML", kind: "Research", x: 360, y: 70, note: "ML classification for galactic components." },
    { id: "birds", label: "Bird Species Classification", kind: "Project", x: 620, y: 110, note: "Bioacoustics ML for bird species." },
    { id: "spectral", label: "Spectral Emission Study", kind: "Research", x: 270, y: 190, note: "Spectroscopy of NGC 2023." },
    { id: "cubesat", label: "CubeSat Satellite Project", kind: "Project", x: 475, y: 240, note: "Radio station for Ukpik-1 CubeSat." },
    // Concepts
    { id: "ml", label: "Machine Learning", kind: "Concept", x: 160, y: 340, note: "Classification, analysis, prediction." },
    { id: "finance", label: "Finance", kind: "Concept", x: 320, y: 340, note: "Options, risk, analytics." },
    { id: "astro", label: "Astronomy", kind: "Concept", x: 480, y: 340, note: "Galaxies, nebulae, mapping." },
    { id: "engineering", label: "Engineering", kind: "Concept", x: 640, y: 340, note: "Satellites, radio, hardware." },
      // Hobbies
    { id: "trading", label: "Trading", kind: "Hobbies", x: 100, y: 240, note: "Algorithmic and discretionary trading strategies." },
    { id: "astrophotography", label: "Astrophotography", kind: "Hobbies", x: 660, y: 240, note: "Capturing celestial objects with long exposures." },
  ];
  const links = [
    { source: "options", target: "finance" },
    { source: "options", target: "ml" },
    { source: "galaxy", target: "ml" },
    { source: "galaxy", target: "astro" },
    { source: "birds", target: "ml" },
    { source: "spectral", target: "astro" },
    { source: "spectral", target: "ml" },
    { source: "cubesat", target: "engineering" },
    { source: "cubesat", target: "astro" },
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
function CommandPalette({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (to: string) => void }) {
  const [input, setInput] = useState("");
  const items = [
    { id: "home", label: "Go to Home" },
    { id: "work", label: "Open Projects + Research" },
    { id: "blog", label: "Open Notes" },
    // { id: "contact", label: "Go to Contact" },
    { id: "contact", label: "Connect with me" },
  ];
  
  const hiddenItems = [
    { id: "graph", label: "Open Idea Graph" },
    { id: "blog", label: "Notes: Astrophotography" },
    { id: "blog", label: "Notes: Machine Learning" },
    { id: "contact", label: "Contact: Email" },
    { id: "contact", label: "Socials" },
  ];
  const allItems = [...items, ...hiddenItems];

  // Only show all items if input is truly empty (not just whitespace)
  const trimmedInput = input.trim();
  let filtered: typeof allItems;
  if (!trimmedInput) {
    filtered = items;
  } else {
    // Remove duplicates by id
    const seen = new Set<string>();
    filtered = allItems
      .filter((i) => i.label.toLowerCase().includes(trimmedInput.toLowerCase()))
      .filter((i) => {
        if (seen.has(i.id + i.label)) return false;
        seen.add(i.id + i.label);
        return true;
      });
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="relative mx-auto mt-24 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-2 pb-2">
          <Command className="size-4 text-zinc-400" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command or search…"
            className="w-full py-2 text-sm focus:outline-none"
          />
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {filtered.map((i) => (
            <button
              key={i.id + i.label}
              onClick={() => {
                onNavigate(i.id);
                onClose();
                setInput("");
              }}
              className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-zinc-50"
            >
              {i.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-zinc-500 px-3 py-2">No results.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// =====
// Notes
// =====
function Notes() {
  const posts = [
    { title: "taoist philosophy", date: "Aug 12, 2025", summary: "embracing the paradox and letting go of control." },
    { title: "NA", date: " ", summary: "...." },
    { title: "NA", date: " ", summary: "..." },
  ];

  const astroPhotos = [
     {
      name: "C27 (Crescent Nebula)",
      files: ["C27(1).JPG", "C27(2).JPG"],
      desc: "An emission nebula in Cygnus, formed by stellar winds from a massive, incredibly hot star at its heart.",
    },
    {
      name: "IC 5070 (Pelican Nebula)",
      files: ["IC5070(1).JPG", "IC5070(2).JPG"],
      desc: "A bright emission nebula in Cygnus, known for its distinctive pelican shape. But tbh I don't see it 🤷‍♂️",
    },
    {
      name: "M27 (Dumbbell Nebula)",
      files: ["M27(1).JPG", "M27(2).JPG"],
      desc: "A planetary nebula in Vulpecula, 1360 light-years away. One of the brightest and earliest discovered. Personal favourite. ",
    },
    {
      name: "M97 (Owl Nebula)",
      files: ["m97.jpeg", "m97-2.jpeg"],
      desc: "A planetary nebula in Ursa Major, showing its faint structure.",
    },
    {
      name: "M81 (Bode's Galaxy)",
      files: ["m81.jpeg", "m81-2.jpeg"],
      desc: "A spiral galaxy in Ursa Major, imaged on two different nights.",
    },
    {
      name: "Andromeda Galaxy",
      files: ["andromeda.jpeg"],
      desc: "The closest major galaxy to the Milky Way, captured on a somewhat cloudy night in Toronto.",
    },
  ];

  // Gallery modal state
  const [gallery, setGallery] = useState<{
    objIdx: number;
    imgIdx: number;
  } | null>(null);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        {posts.map((p) => (
          <article key={p.title} className="rounded-2xl border border-zinc-200 p-4">
            <div className="text-xs text-zinc-500">{p.date}</div>
            <h3 className="font-medium mt-1">{p.title}</h3>
            <p className="text-sm text-zinc-600 mt-1">{p.summary}</p>
            <a href="#" className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-900">
              Read <ExternalLink className="size-3" />
            </a>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Astrophotography</h2>
        <p className="text-sm text-zinc-500 mb-4">
        These photos are either taken with a Seestar S50 telescope or a canon mirrorless camera. In both cases, images are taken with long exposures and stacked.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {astroPhotos.map((obj, objIdx) => (
            <div key={obj.name} className="rounded-2xl border border-zinc-200 p-4 bg-white">
              <div className="font-medium mb-1">{obj.name}</div>
              <div className="flex gap-2 mb-2">
                {obj.files.map((file, imgIdx) => (
                  <button
                    key={file}
                    onClick={() => setGallery({ objIdx, imgIdx })}
                    className="focus:outline-none"
                  >
                    <img
                      src={`/${file}`}
                      alt={obj.name}
                      className="rounded-lg border border-zinc-100 object-cover h-32 w-32 hover:scale-105 transition"
                    />
                  </button>
                ))}
              </div>
              <div className="text-sm text-zinc-600">{obj.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {gallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setGallery(null)}
          >
            <div
              className="relative bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`/${astroPhotos[gallery.objIdx].files[gallery.imgIdx]}`}
                alt={astroPhotos[gallery.objIdx].name}
                className="max-w-[80vw] max-h-[70vh] rounded-xl border border-zinc-200"
              />
              <div className="mt-4 text-center">
                <div className="font-medium">{astroPhotos[gallery.objIdx].name}</div>
                <div className="text-sm text-zinc-600">{astroPhotos[gallery.objIdx].desc}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-3 py-1 rounded-lg border bg-zinc-50 text-sm"
                  disabled={gallery.imgIdx === 0}
                  onClick={() =>
                    setGallery((g) =>
                      g && g.imgIdx > 0 ? { objIdx: g.objIdx, imgIdx: g.imgIdx - 1 } : g
                    )
                  }
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1 rounded-lg border bg-zinc-50 text-sm"
                  disabled={gallery.imgIdx === astroPhotos[gallery.objIdx].files.length - 1}
                  onClick={() =>
                    setGallery((g) =>
                      g && g.imgIdx < astroPhotos[g.objIdx].files.length - 1
                        ? { objIdx: g.objIdx, imgIdx: g.imgIdx + 1 }
                        : g
                    )
                  }
                >
                  Next
                </button>
                <button
                  className="px-3 py-1 rounded-lg border bg-zinc-50 text-sm"
                  onClick={() => setGallery(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TimeMachine />
    </div>
  );
}
function ProjectsResearch() {
    /*const [showGraph, setShowGraph] = useState(false);*/
  const work = [
    {
      title: "Options Chain Analytics Dashboard",
      venue: "Finance / Derivatives",
      tags: ["python", "finance", "data analysis", "risk reversal"],
      desc: "Built a analytics dashboard for analyzing historical options chain data, focusing on risk reversal strategies, volatility skew, and time-series visualization. Built to aid my own trading strategies.",
      details: (
        <div className="space-y-4 text-sm">
          <p>
            This dashboard integrates historical options data with custom models
            for volatility skew, Greeks, and risk reversal spreads. Interactive
            charts allow traders to explore how skew evolves over time.
          </p>
          <img
            src="/vol_surface_mock.png"
            alt="Volatility Surface"
            className="rounded-xl border shadow"
          />
          <p className="text-xs text-zinc-500">
            Example volatility surface showing implied vol across strike and
            maturity.
          </p>
          <ul className="list-disc pl-4">
            <li>Custom-built Black-Scholes & SABR model calibration module</li>
            <li>Live updating Greeks dashboard</li>
            <li>Strategy backtester for risk reversals</li>
          </ul>
        </div>
      ),
      clickable: false,
    },
    {
      title: "Galactic Mapping with Machine Learning",
      venue: "James Webb Space Telescope",
      tags: ["machine learning", "astronomy", "classification"],
      desc: "Developed a novel machine learning classification model to discern galactic components in James Webb Space Telescope images of NGC 623, achieving an 84% accuracy rate. Built to probabilistically identify features such as star clusters, dust lanes, and galactic cores.",
      details: (
        <div className="space-y-4 text-sm">
          <p>
            We evaluated Support Vector Machines, Random Forests, and KNN to
            classify galactic components (C1–C5). JWST’s multi-band filters
            allowed us to extract fine-grained spatial and spectral information.
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
                <td className="border px-2 py-1">1.00</td>
                <td className="border px-2 py-1">1.00</td>
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
      desc: "Created an algorithm that maps sounds produced by birds in Ontario to classify their species, combining sound analysis with machine learning techniques.",
      details: (
        <div className="space-y-3 text-sm">
          <p>
            Leveraged spectrogram analysis + CNNs to classify 30 species with
            90% accuracy. System runs on low-power edge devices for real-time
            field use.
          </p>
          <img
            src="/bird_spectrogram.png"
            alt="Bird Spectrogram"
            className="rounded-xl border shadow"
          />
          <p className="text-xs text-zinc-500">
            Example spectrogram showing distinct frequency signatures of two
            species.
          </p>
          <img
            src="/accuracy_chart.png"
            alt="Model Accuracy"
            className="rounded-xl border shadow"
          />
          <p className="text-xs text-zinc-500">
            Cross-validation accuracy across models.
          </p>
        </div>
      ),
      clickable: false,
    },
    {
      title: "Spectral Emission Study",
      venue: "NGC 2023 / Spitzer Space Telescope",
      tags: ["python", "spectroscopy", "data analysis"],
      desc: "Conducted a spectral emission study of NGC 2023 using Python tools to analyze data from the Spitzer Space Telescope, enhancing accuracy by normalizing data against higher wavelength data.",
      details: (
        <div className="space-y-3 text-sm">
          <p>
            Identified key infrared emission features from PAHs and dust grains.
            Normalization against higher wavelengths improved signal-to-noise.
          </p>
          <img
            src="/spectrum_mock.png"
            alt="Spectral Emission"
            className="rounded-xl border shadow"
          />
          <p className="text-xs text-zinc-500">
            IR spectrum with annotated emission peaks.
          </p>
        </div>
      ),
      clickable: false,
    },
    {
      title: "CubeSat Satellite Project",
      venue: "Ukpik-1 CubeSat",
      tags: ["satellite", "radio", "engineering"],
      desc: "Worked on the development of a radio station for the Ukpik-1 CubeSat satellite project @ Western University, specializing in assembly operations and implementing a comms center for real-time data transmission.",
      details: (
        <div className="space-y-3 text-sm">
          <p>
            Built a ground comms station with RF calibration for real-time data
            relay. Assisted in CubeSat assembly + redundancy testing.
          </p>
          <img
            src="/cubesat_mock.png"
            alt="CubeSat Project"
            className="rounded-xl border shadow"
          />
          <p className="text-xs text-zinc-500">
            Ground station link to Ukpik-1 telemetry stream.
          </p>
        </div>
      ),
      clickable: false,
    },
  ];

  const [active, setActive] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      {work.map((w) => (
        <div
          key={w.title}
          className={`rounded-2xl border border-zinc-200 p-4 transition
            ${w.clickable ? "hover:shadow-md hover:border-zinc-300 cursor-pointer" : ""}
          `}
          onClick={() => w.clickable && setActive(w)}
          tabIndex={w.clickable ? 0 : -1}
          aria-disabled={!w.clickable}
          style={w.clickable ? {} : { pointerEvents: "none" }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{w.venue}</span>
            {w.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-zinc-200 px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
          <h3 className="mt-1 font-medium">{w.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{w.desc}</p>
        </div>
      ))}

      {/* Overlay modal with animation */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm "
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
          always down to riff on new ideas, collab, or just chat
         
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
              className=" border-zinc-200"
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

        <div className="mt-6 text-xs text-zinc-400">
         Toronto, Ontario  
          <br />
        </div>
      </div>
    </div>
  );
}