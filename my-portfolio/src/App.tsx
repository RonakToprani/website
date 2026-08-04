import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookText,
  Atom,
  Lightbulb,
  GitBranch,
  Search,
  ExternalLink,
  User,
  Moon,
  Sun,
  Github,
  Telescope,
} from "lucide-react";
import {
  SITE,
  clockTime,
  dms,
  hms,
  moonPhase,
  moonPosition,
  nextDarkWindow,
  reportTarget,
  toHorizontal,
  type Status,
} from "./sky";



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
  // J2000 position, in degrees. Objects without one are simply left out of the
  // "Tonight's Sky" block — see the note at the bottom of it.
  ra?: number;
  dec?: number;
  // Distance in light years, and what was happening here when that light left.
  distanceLy?: number;
  lightLeft?: string;
};

export const ASTRO: AstroObj[] = [
  {
    name: "C27 (Crescent Nebula)",
    aliases: ["Crescent Nebula", "NGC 6888", "Cygnus"],
    files: ["C27(1).JPG", "C27(2).JPG"],
    desc: "An emission nebula in Cygnus, formed by stellar winds from a massive, incredibly hot star at its heart.",
    gear: "Seestar S50",
    ra: hms(20, 12, 7),
    dec: dms(38, 21, 18),
    distanceLy: 5000,
    lightLeft: "writing was being invented in Mesopotamia",
  },
  {
    name: "IC 5070 (Pelican Nebula)",
    aliases: ["Pelican Nebula", "IC5070", "Cygnus"],
    files: ["IC5070(1).JPG", "IC5070(2).JPG"],
    desc: "A bright emission nebula in Cygnus, known for its distinctive pelican shape. But tbh I don't see it 🤷‍♂️",
    gear: "Seestar S50",
    ra: hms(20, 50, 48),
    dec: dms(44, 21, 0),
    distanceLy: 1800,
    lightLeft: "the Han dynasty was falling apart",
  },
  {
    name: "M27 (Dumbbell Nebula)",
    aliases: ["Dumbbell Nebula", "NGC 6853", "Vulpecula"],
    files: ["M27(1).JPG", "M27(2).JPG"],
    desc: "A planetary nebula in Vulpecula, 1360 light-years away. One of the brightest and earliest discovered. Personal favourite.",
    gear: "Seestar S50",
    ra: hms(19, 59, 36.3),
    dec: dms(22, 43, 16),
    distanceLy: 1360,
    lightLeft: "the Tang dynasty was near its height",
  },
  {
    name: "M97 (Owl Nebula)",
    aliases: ["Owl Nebula", "NGC 3587", "Ursa Major"],
    files: ["m97.jpeg", "m97-2.jpeg"],
    desc: "A planetary nebula in Ursa Major, showing its faint structure.",
    gear: "Seestar S50",
    ra: hms(11, 14, 47.7),
    dec: dms(55, 1, 9),
    distanceLy: 2030,
    lightLeft: "the common era was just beginning",
  },
  {
    name: "M81 (Bode's Galaxy)",
    aliases: ["Bode's Galaxy", "NGC 3031", "Ursa Major"],
    files: ["m81.jpeg", "m81-2.jpeg"],
    desc: "A spiral galaxy in Ursa Major, imaged on two different nights.",
    gear: "Seestar S50",
    ra: hms(9, 55, 33.2),
    dec: dms(69, 3, 55),
    distanceLy: 11_800_000,
    lightLeft: "our lineage hadn't yet split from chimpanzees",
  },
  {
    name: "Andromeda Galaxy (M31)",
    aliases: ["Andromeda", "M31", "NGC 224"],
    files: ["andromeda.jpeg"],
    desc: "The closest major galaxy to the Milky Way, captured on a somewhat cloudy night in Toronto.",
    gear: "Canon mirrorless",
    ra: hms(0, 42, 44.3),
    dec: dms(41, 16, 9),
    distanceLy: 2_537_000,
    lightLeft: "our ancestors were Homo habilis — no Homo sapiens yet",
  },
  // ── New (July 2026) — filenames are drop-in targets; identities pending confirmation ──
  {
    name: "M13 (Great Hercules Cluster)",
    aliases: ["Hercules Cluster", "NGC 6205", "globular cluster"],
    files: ["m13.jpg", "m13-2.jpg"],
    desc: "A globular cluster in Hercules — hundreds of thousands of stars bound into a dense sphere. Two processing passes of the same night.",
    gear: "Seestar S50",
    ra: hms(16, 41, 41.2),
    dec: dms(36, 27, 36),
    distanceLy: 22_200,
    lightLeft: "the last ice age was at its peak",
  },
  {
    name: "M101 (Pinwheel Galaxy)",
    aliases: ["Pinwheel Galaxy", "NGC 5457", "Ursa Major", "grand design spiral"],
    files: ["m101.jpg", "m101-2.jpg"],
    desc: "A grand-design face-on spiral in Ursa Major, with sweeping blue arms and pink star-forming regions. Shown fully processed and as the raw stack.",
    gear: "Canon mirrorless",
    ra: hms(14, 3, 12.6),
    dec: dms(54, 20, 57),
    distanceLy: 21_000_000,
    lightLeft: "apes were first spreading across Africa, in the Miocene",
  },
  {
    name: "Faint face-on spiral",
    aliases: ["face-on spiral", "galaxy"],
    files: ["faint-spiral.jpg"],
    desc: "A dim face-on spiral pulled out of a short integration, with a couple of small companion galaxies nearby.",
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

// Where a deep link should land: a specific galaxy, a specific project, or a
// pre-filtered category on the projects page.
export type FocusTarget = { astro?: string; project?: string; category?: string };

// =======
// Layout
// =======
export default function Portfolio() {
  const [route, setRoute] = useState("home");
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Deep-link target set by the universal search (e.g. open a galaxy or a project)
  const [focus, setFocus] = useState<FocusTarget | null>(null);

  const go = (to: string, f?: FocusTarget) => {
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
                  <IdeaGraph onNavigate={go} />
                </Page>
              )}
              {route === "work" && (
                <Page key="work" title="Projects + Research" subtitle="Selected research, builds, and experiments.">
                  <ProjectsResearch focusProject={focus?.project} focusCategory={focus?.category} />
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

// Theme toggle. The initial class is set by the inline script in index.html so
// there's no white flash on load; this only has to keep up with it afterwards.
// An explicit choice is remembered; until then the OS preference wins.
function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Follow the OS until the visitor expresses a preference of their own.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) setDark(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <button
      onClick={() => {
        const next = !dark;
        setDark(next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid size-8 place-items-center rounded-xl border border-zinc-300 text-zinc-600 transition hover:bg-zinc-50"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
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
          <ThemeToggle />
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
        <BlockCard title="Latest Build" icon={<Atom className="size-4" />}>
          <span className="font-medium">Fixate</span> — a Chrome extension that <em>verifies</em> focus with local, on-device gaze detection. No backend, no data leaves the machine.
        </BlockCard>
        <BlockCard title="Also Shipping" icon={<GitBranch className="size-4" />}>
          <span className="font-medium">whoomp</span> (a local-first health app that reads biometrics on-device) and <span className="font-medium">kōdō</span> (a productivity dashboard run by local SLMs).
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


// ==================================================================
// Tonight's Sky — the one block on this site that isn't written, it's computed.
//
// Takes the targets I've already shot (the ASTRO list above), works out where
// each one actually is over Toronto at this exact moment, how high it climbs
// while the sky is dark tonight, and whether the moon is in the way. All of it
// runs locally in the browser — see src/sky.ts. Nothing here is fetched, and
// nothing here is hardcoded except the coordinates themselves.
//
// Each row also carries how long its light has been travelling, which is the
// part I find hardest to stop thinking about.
// ==================================================================

const STATUS_STYLE: Record<Status, { label: string; dot: string; pill: string }> = {
  prime: {
    label: "Prime",
    dot: "bg-emerald-500",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  workable: {
    label: "Workable",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  low: { label: "Too low", dot: "bg-zinc-400", pill: "border-zinc-200 bg-zinc-50 text-zinc-500" },
  no: { label: "Not tonight", dot: "bg-zinc-300", pill: "border-zinc-200 bg-white text-zinc-400" },
};

// "21 million" / "22,200" — light years read better without a decimal tail.
function formatLy(ly: number): string {
  if (ly >= 1_000_000) return `${+(ly / 1_000_000).toFixed(1)} million`;
  return ly.toLocaleString();
}

function TonightsSky({
  photos,
  onOpen,
}: {
  photos: AstroObj[];
  onOpen: (objIdx: number) => void;
}) {
  // Re-tick every minute. The sky rotates a quarter degree in that time, which
  // is enough to move a target across a status boundary while you're reading.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { dark, moon, rows, unplotted, oldest } = useMemo(() => {
    const dark = nextDarkWindow(now);
    const moon = { ...moonPhase(now), alt: toHorizontal(moonPosition(now), now).alt };

    const rows = photos
      .map((obj, objIdx) => ({ obj, objIdx }))
      .filter(({ obj }) => obj.ra !== undefined && obj.dec !== undefined)
      .map(({ obj, objIdx }) => ({
        obj,
        objIdx,
        report: reportTarget({ ra: obj.ra!, dec: obj.dec! }, now, dark),
      }))
      .sort((a, b) => b.report.peakAlt - a.report.peakAlt);

    return {
      dark,
      moon,
      rows,
      unplotted: photos.filter((o) => o.ra === undefined).length,
      oldest: Math.max(...photos.map((o) => o.distanceLy ?? 0)),
    };
  }, [photos, now]);

  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium flex items-center gap-2">
          <Telescope className="size-4" /> Tonight's Sky
        </h4>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          live over {SITE.label} · {clockTime(now)}
        </div>
      </div>

      <p className="mt-1 text-sm text-zinc-500">
        Where my targets actually are right now, and which ones are worth setting up for.
      </p>

      {/* Conditions strip — the two things that decide the night */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600">
          {dark ? (
            <>
              {dark.nautical ? "Nautical dark" : "Astronomical dark"} {clockTime(dark.start)} →{" "}
              {clockTime(dark.end)}
            </>
          ) : (
            "No real darkness tonight"
          )}
        </span>
        <span className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600">
          <Moon className="size-3" />
          {Math.round(moon.illumination * 100)}% {moon.name}
          {moon.alt > 0 ? " · up now" : " · below horizon"}
        </span>
      </div>

      <div className="mt-3 divide-y divide-zinc-100">
        {rows.map(({ obj, objIdx, report }) => {
          const s = STATUS_STYLE[report.status];
          return (
            <button
              key={obj.name}
              onClick={() => onOpen(objIdx)}
              className="group w-full py-2.5 text-left hover:bg-zinc-50/70 rounded-xl px-2 -mx-2 transition"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                  <span className="text-sm font-medium truncate group-hover:underline">
                    {obj.name}
                  </span>
                  <span className={`shrink-0 rounded-lg border px-1.5 py-0.5 text-[10px] ${s.pill}`}>
                    {s.label}
                  </span>
                  {report.moonWashed && (
                    <span className="shrink-0 rounded-lg border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-500">
                      moon nearby
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-xs text-zinc-500 tabular-nums">
                  {!report.peakAt ? (
                    "down all night"
                  ) : report.pastBest ? (
                    <>
                      {Math.round(report.peakAlt)}° now · {report.rising ? "climbing" : "sinking"}
                    </>
                  ) : (
                    <>
                      peaks {Math.round(report.peakAlt)}° at {clockTime(report.peakAt)}
                    </>
                  )}
                </div>
              </div>
              {obj.distanceLy && (
                <div className="mt-0.5 pl-4 text-xs text-zinc-400">
                  {formatLy(obj.distanceLy)} light years — that light left when {obj.lightLeft}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Computed in your browser from J2000 coordinates and {SITE.label}'s latitude — no API, no
        server. "Prime" means it clears 45° while the sky is dark; below ~25° there's too much
        atmosphere and city glow to bother.
        {unplotted > 0 && (
          <> {unplotted} unidentified faint fields aren't plotted until I plate-solve them.</>
        )}{" "}
        The oldest light here has been travelling {formatLy(oldest)} years.
      </div>
    </div>
  );
}

// ==================
// graphing IDEAS feature. brain map sorta
// ==================
// Idea Graph: map relationships between projects, blog posts, and research topics.
// Same cards, same links, same palette as it has always had — but the hardcoded
// coordinates are now just the seed positions for a live simulation. Every node
// is a mass on a spring: linked nodes pull together, unlinked ones push apart,
// and the whole thing falls gently toward the middle of the stage. Grab one and
// the rest rearrange around it; let go and it keeps its momentum.
//
// No physics library — it's a few hundred lines of Verlet-ish integration below.

type Body = { x: number; y: number; vx: number; vy: number; w: number; h: number; fixed: boolean };

const REP = 5200; // repulsion between any two nodes
const LEN = 132; // preferred link length
const STR = 0.022; // spring stiffness
const GRV = 0.0016; // pull toward the centre of the stage
const DAMP = 0.84; // velocity damping per frame — what makes it settle
const VMAX = 16; // speed cap, so a hard fling can't launch a card off-screen

// One search term against one haystack. Terms of 1-2 characters have to match a
// whole word: otherwise "ai" hits "Options Chain Analytics" through the "ai" in
// "Chain", and "ml" hits almost nothing you meant.
const termHit = (hay: string, term: string) => {
  if (term.length > 2) return hay.includes(term);
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(hay);
};

function IdeaGraph({ onNavigate }: { onNavigate: (to: string, f?: FocusTarget) => void }) {
  const { nodes, links } = useMemo(() => mockGraph(), []);
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Matches, plus anything directly linked to a match — the neighbours are the
  // whole point of a graph, but they're dimmed so you can tell them from hits.
  // Hidden nodes drop out of the simulation too, so the rest close the gap.
  const search = useMemo(() => {
    const q = fold(filter.trim());
    if (!q) return { hidden: new Set<string>(), context: new Set<string>(), hits: 0 };
    const terms = q.split(/\s+/);
    const keep = new Set(
      nodes
        .filter((n) => {
          const hay = fold(`${n.label} ${n.kind} ${n.note} ${n.keywords ?? ""}`);
          return terms.every((t) => termHit(hay, t));
        })
        .map((n) => n.id)
    );
    const near = new Set(keep);
    links.forEach((l) => {
      if (keep.has(l.source)) near.add(l.target);
      if (keep.has(l.target)) near.add(l.source);
    });
    return {
      hidden: new Set(nodes.filter((n) => !near.has(n.id)).map((n) => n.id)),
      context: new Set([...near].filter((id) => !keep.has(id))),
      hits: keep.size,
    };
  }, [nodes, links, filter]);
  const { hidden, context } = search;

  const stage = useRef<HTMLDivElement | null>(null);
  const nodeEl = useRef<Record<string, HTMLButtonElement | null>>({});
  const lineEl = useRef<(SVGLineElement | null)[]>([]);
  const body = useRef<Record<string, Body>>({});
  const alpha = useRef(1); // simulation "temperature" — decays to near-still
  const drag = useRef<{ id: string; ox: number; oy: number; moved: boolean; lx: number; ly: number } | null>(null);
  const suppressClick = useRef(false);
  const hiddenRef = useRef(hidden);
  const contextRef = useRef(context);

  // Seed from the coordinates the graph has always used, so it opens looking
  // exactly like the old static layout and then relaxes out of it.
  if (Object.keys(body.current).length === 0) {
    nodes.forEach((n) => {
      body.current[n.id] = { x: n.x, y: n.y, vx: 0, vy: 0, w: 140, h: 56, fixed: false };
    });
  }

  // Re-energise whenever the filter changes so the survivors visibly regroup.
  useEffect(() => {
    hiddenRef.current = hidden;
    contextRef.current = context;
    alpha.current = Math.max(alpha.current, 0.55);
  }, [hidden, context]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    // Measure the real card size once — the repulsion radius depends on it.
    nodes.forEach((n) => {
      const e = nodeEl.current[n.id];
      if (e) {
        body.current[n.id].w = e.offsetWidth || 140;
        body.current[n.id].h = e.offsetHeight || 56;
      }
    });

    const paint = () => {
      for (const n of nodes) {
        const b = body.current[n.id];
        const e = nodeEl.current[n.id];
        if (!e) continue;
        // Rounded: at rest the solver leaves a sub-pixel jitter, and fractional
        // transforms make the card text shimmer as it re-rasterises.
        e.style.transform = `translate(${Math.round(b.x - b.w / 2)}px, ${Math.round(b.y - b.h / 2)}px)`;
        e.style.display = hiddenRef.current.has(n.id) ? "none" : "";
        // Neighbours of a match are shown for context, but faded so it's obvious
        // which cards actually matched what you typed.
        e.style.opacity = contextRef.current.has(n.id) ? "0.4" : "";
      }
      links.forEach((l, i) => {
        const ln = lineEl.current[i];
        if (!ln) return;
        const s = body.current[l.source];
        const t = body.current[l.target];
        ln.style.display =
          hiddenRef.current.has(l.source) || hiddenRef.current.has(l.target) ? "none" : "";
        ln.setAttribute("x1", String(s.x));
        ln.setAttribute("y1", String(s.y));
        ln.setAttribute("x2", String(t.x));
        ln.setAttribute("y2", String(t.y));
      });
    };

    const step = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const a = alpha.current;
      const live = nodes.filter((n) => !hiddenRef.current.has(n.id));

      // Everything pushes everything else away, harder once cards actually overlap.
      for (let i = 0; i < live.length; i++) {
        const p = body.current[live[i].id];
        for (let j = i + 1; j < live.length; j++) {
          const q = body.current[live[j].id];
          let dx = q.x - p.x;
          let dy = q.y - p.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 4) {
            dx = 1;
            dy = 1;
            d2 = 4;
          }
          const d = Math.sqrt(d2);
          const want = Math.max(p.w, p.h) * 0.62 + Math.max(q.w, q.h) * 0.62;
          const f = ((REP * a) / d2) * (d < want ? 2.2 : 1);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          p.vx -= fx;
          p.vy -= fy;
          q.vx += fx;
          q.vy += fy;
        }
      }

      // Links behave like springs with a preferred length.
      for (const l of links) {
        if (hiddenRef.current.has(l.source) || hiddenRef.current.has(l.target)) continue;
        const s = body.current[l.source];
        const t = body.current[l.target];
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - LEN) * STR * a;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      }

      // Gravity toward the middle, squashed vertically because the stage is wide.
      for (const n of live) {
        const b = body.current[n.id];
        b.vx -= (b.x - W / 2) * GRV * a;
        b.vy -= (b.y - H / 2) * GRV * a * 1.5;
      }

      // Integrate, damp, and bounce softly off the edges.
      for (const n of live) {
        const b = body.current[n.id];
        if (b.fixed) {
          b.vx = 0;
          b.vy = 0;
          continue;
        }
        b.vx *= DAMP;
        b.vy *= DAMP;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > VMAX) {
          b.vx = (b.vx / sp) * VMAX;
          b.vy = (b.vy / sp) * VMAX;
        }
        b.x += b.vx;
        b.y += b.vy;
        const mx = b.w / 2 + 6;
        const my = b.h / 2 + 6;
        if (b.x < mx) {
          b.x = mx;
          b.vx *= -0.4;
        }
        if (b.x > W - mx) {
          b.x = W - mx;
          b.vx *= -0.4;
        }
        if (b.y < my) {
          b.y = my;
          b.vy *= -0.4;
        }
        if (b.y > H - my) {
          b.y = H - my;
          b.vy *= -0.4;
        }
      }

      // Soft repulsion alone isn't enough: two well-connected cards (AI / SLMs
      // and Finance, say) have enough springs pulling them together to sit on
      // top of each other at equilibrium. So finish each frame by hard-pushing
      // any overlapping pair apart along whichever axis needs the least travel.
      // A card being dragged doesn't move — it shoves the others instead.
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < live.length; i++) {
          const p = body.current[live[i].id];
          for (let j = i + 1; j < live.length; j++) {
            const q = body.current[live[j].id];
            const ox = (p.w + q.w) / 2 + 10 - Math.abs(p.x - q.x);
            const oy = (p.h + q.h) / 2 + 8 - Math.abs(p.y - q.y);
            if (ox <= 0 || oy <= 0) continue;
            const ps = p.fixed ? 0 : q.fixed ? 1 : 0.5;
            const qs = q.fixed ? 0 : p.fixed ? 1 : 0.5;
            if (ox < oy) {
              const dir = p.x < q.x ? -1 : 1;
              p.x += dir * ox * ps;
              q.x -= dir * ox * qs;
            } else {
              const dir = p.y < q.y ? -1 : 1;
              p.y += dir * oy * ps;
              q.y -= dir * oy * qs;
            }
          }
        }
      }

      alpha.current = Math.max(0.006, a * 0.988);
    };

    // Reduced motion: settle it off-screen so the page opens already at rest.
    // The loop still runs, but at resting alpha nothing moves unless dragged.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      for (let i = 0; i < 400; i++) step();
    }

    let raf = 0;
    const frame = () => {
      step();
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [nodes, links]);

  // Grab, drag, fling. Pointer events so it works the same with a finger.
  const onDown = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const b = body.current[id];
    const r = stage.current!.getBoundingClientRect();
    drag.current = {
      id,
      ox: e.clientX - r.left - b.x,
      oy: e.clientY - r.top - b.y,
      moved: false,
      lx: b.x,
      ly: b.y,
    };
    b.fixed = true;
    alpha.current = 0.9;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== id) return;
    const b = body.current[id];
    const r = stage.current!.getBoundingClientRect();
    const nx = e.clientX - r.left - d.ox;
    const ny = e.clientY - r.top - d.oy;
    if (Math.abs(nx - b.x) + Math.abs(ny - b.y) > 2) d.moved = true;
    d.lx = b.x;
    d.ly = b.y;
    b.x = nx;
    b.y = ny;
  };

  const onUp = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== id) return;
    const b = body.current[id];
    b.fixed = false;
    // Hand the card the velocity it had in the last frame of the drag.
    b.vx = (b.x - d.lx) * 0.9;
    b.vy = (b.y - d.ly) * 0.9;
    alpha.current = 0.9;
    suppressClick.current = d.moved; // a drag shouldn't also count as a click
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Scatter everything and let it fall back together.
  const shake = () => {
    for (const n of nodes) {
      const b = body.current[n.id];
      b.vx += (Math.random() - 0.5) * 26;
      b.vy += (Math.random() - 0.5) * 26;
    }
    alpha.current = 1;
  };

  const open = (n: GraphNode) => {
    if (!n.to) return;
    onNavigate(n.to.route, { project: n.to.project, category: n.to.category });
  };

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
        <button onClick={shake} className="text-sm text-zinc-600 underline shrink-0">Shake</button>
        {active && (
          <button onClick={() => setActive(null)} className="text-sm text-zinc-600 underline shrink-0">Clear selection</button>
        )}
      </div>

      {filter.trim() && (
        <div className="text-xs text-zinc-500">
          {search.hits === 0 ? (
            <>No nodes match “{filter.trim()}”. Try a project, a technique (esp32, ollama, bioacoustics), or a field.</>
          ) : (
            <>
              {search.hits} match{search.hits === 1 ? "" : "es"}
              {context.size > 0 && <> · {context.size} connected, shown faded</>}
            </>
          )}
        </div>
      )}

      <div className="h-[480px] rounded-3xl border border-zinc-200 overflow-x-auto overflow-y-hidden">
        <div className="relative h-full min-w-[760px]" ref={stage}>
        {/* links */}
        <svg className="absolute inset-0 w-full h-full">
          {links.map((l, idx) => (
            <line
              key={idx}
              ref={(e) => { lineEl.current[idx] = e; }}
              stroke={active && (l.source === active || l.target === active) ? "#a1a1aa" : "#e6e6e6"}
              strokeWidth={2}
            />
          ))}
        </svg>
        {/* nodes */}
        {nodes.map((n) => (
          <button
            key={n.id}
            ref={(e) => { nodeEl.current[n.id] = e; }}
            onPointerDown={onDown(n.id)}
            onPointerMove={onMove(n.id)}
            onPointerUp={onUp(n.id)}
            onPointerCancel={onUp(n.id)}
            onClick={() => {
              if (suppressClick.current) { suppressClick.current = false; return; }
              setActive(n.id);
            }}
            onDoubleClick={() => open(n)}
            style={{ left: 0, top: 0, touchAction: "none" }}
            className={`absolute w-[140px] rounded-2xl border px-3 py-2 text-left shadow-sm select-none cursor-grab active:cursor-grabbing transition-opacity duration-200 ${
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
            <ActiveCard id={active} onSelect={setActive} onOpen={open} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-zinc-500">
      a simplified representation of my work and ideas. It’s not exhaustive, but I always find graphs help explain things.
      Drag a node and the rest rearrange around it — everything's on springs. Click to select, double-click to jump to it on the site.
      </div>
    </div>
  );
}

// Where each node lives on the rest of the site.
const OPEN_LABEL: Record<string, string> = {
  work: "Open in Projects + Research",
  blog: "Open in Notes",
};

function ActiveCard({
  id,
  onSelect,
  onOpen,
}: {
  id: string;
  onSelect: (id: string) => void;
  onOpen: (n: GraphNode) => void;
}) {
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
      {node.to && (
        <button
          onClick={() => onOpen(node)}
          className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-900 underline"
        >
          {OPEN_LABEL[node.to.route] ?? "Open"} <ExternalLink className="size-3" />
        </button>
      )}
      {related.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-zinc-500 mb-1">Related</div>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className="rounded-xl border border-zinc-200 px-2 py-1 text-xs hover:border-zinc-400"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// A node on the Idea Graph. `to` is where double-clicking it lands you: a
// specific project modal, or the projects page pre-filtered to a category.
export type GraphNode = {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  note: string;
  // Extra terms the search should match. The label alone is too narrow — nobody
  // searching "ollama", "esp32" or "bioacoustics" would find anything otherwise.
  keywords?: string;
  to?: { route: string; project?: string; category?: string };
};

function mockGraph() {
  // `to.project` must match the WORK entry title exactly — that's what the
  // deep-link lookup on the projects page compares against.
  const nodes: GraphNode[] = [
    // Builds / products (top band)
    { id: "fixate", label: "Fixate", kind: "Project", x: 110, y: 70, note: "Local-CV Chrome extension that verifies real focus time.", keywords: "chrome extension mv3 computer vision gaze eye tracking focus local cv productivity blocking", to: { route: "work", project: "Fixate" } },
    { id: "whoomp", label: "whoomp", kind: "Project", x: 290, y: 70, note: "Local-first health app: reads biometrics over BLE, computes recovery on-device.", keywords: "health wearable biometrics ble bluetooth low energy recovery sleep hrv strain whoop local-first reverse engineering", to: { route: "work", project: "whoomp" } },
    { id: "kodo", label: "kōdō", kind: "Project", x: 470, y: 70, note: "Productivity dashboard driven by local SLMs.", keywords: "kodo productivity dashboard local slm ollama llm on-device agent", to: { route: "work", project: "kōdō" } },
    { id: "cryptoradar", label: "CryptoRadar", kind: "Project", x: 650, y: 70, note: "Crypto regulatory + market intelligence terminal.", keywords: "crypto cryptocurrency regulation regulatory market intelligence terminal bitcoin news feed", to: { route: "work", project: "CryptoRadar" } },
    { id: "options", label: "Options Chain Analytics", kind: "Project", x: 110, y: 150, note: "Analytics for historical options chain data.", keywords: "options chain volatility skew risk reversal derivatives greeks dash plotly analytics trading data viz", to: { route: "work", project: "Dash Options chain Platform" } },
    { id: "tradingbot", label: "XRP Trading Bot", kind: "Project", x: 290, y: 150, note: "Algorithmic trading bot pairing signals with a local SLM.", keywords: "xrp ripple algo algorithmic trading bot crypto signals backtest slm", to: { route: "work", project: "XRP algo trading bot" } },
    { id: "mochi", label: "Mochi desk robot", kind: "Project", x: 470, y: 150, note: "ESP32 desk companion running a small language model.", keywords: "esp32 embedded microcontroller desk robot companion slm hardware 3d printed", to: { route: "work", project: "Mochi desk robot" } },
    { id: "cubesat", label: "CubeSat (Ukpik-1)", kind: "Project", x: 650, y: 150, note: "Radio ground station for the Ukpik-1 CubeSat.", keywords: "cubesat ukpik-1 satellite radio ground station rf telemetry space engineering", to: { route: "work", project: "CubeSat Satellite Project" } },
    // Research (middle band)
    { id: "galaxy", label: "Galactic Mapping ML", kind: "Research", x: 200, y: 235, note: "ML classification for galactic components (JWST).", keywords: "galaxy galactic jwst machine learning ml cnn classification morphology dust lanes astronomy", to: { route: "work", project: "Galactic Mapping with Machine Learning" } },
    { id: "spectral", label: "Spectral Emission Study", kind: "Research", x: 400, y: 235, note: "PAH spectroscopy of NGC 2023 (Spitzer).", keywords: "pah polycyclic aromatic hydrocarbon spectroscopy ngc 2023 spitzer nebula infrared spectra ionisation astronomy", to: { route: "work", project: "Multi-Module Spectral Analysis of PAH States" } },
    { id: "birds", label: "Bird Species Classification", kind: "Research", x: 600, y: 235, note: "Bioacoustics CNN for bird species ID.", keywords: "bioacoustics bird audio spectrogram cnn machine learning ml classification sound", to: { route: "work", project: "Bird Species Classification Algorithm" } },
    // Concepts — these open the projects page filtered to the matching category
    { id: "ml", label: "AI / SLMs", kind: "Concept", x: 140, y: 325, note: "Machine learning and small on-device language models.", keywords: "ai ml machine learning slm llm small language model on-device local inference neural network", to: { route: "work", category: "ai" } },
    { id: "finance", label: "Finance", kind: "Concept", x: 320, y: 325, note: "Options, risk, crypto, analytics.", keywords: "finance markets options risk crypto quant quantitative analytics trading", to: { route: "work", category: "finance" } },
    { id: "astro", label: "Astronomy", kind: "Concept", x: 500, y: 325, note: "Galaxies, nebulae, mapping.", keywords: "astronomy astrophysics galaxies nebulae space telescope deep sky cosmology", to: { route: "work", category: "research" } },
    { id: "engineering", label: "Engineering", kind: "Concept", x: 660, y: 325, note: "Embedded, satellites, radio, hardware.", keywords: "engineering embedded hardware electronics satellites radio firmware", to: { route: "work", category: "hardware" } },
    // Hobbies
    { id: "trading", label: "Trading", kind: "Hobbies", x: 180, y: 410, note: "Algorithmic and discretionary trading strategies.", keywords: "trading algorithmic discretionary markets strategies portfolio", to: { route: "work", category: "finance" } },
    { id: "astrophotography", label: "Astrophotography", kind: "Hobbies", x: 520, y: 410, note: "Capturing celestial objects with long exposures.", keywords: "astrophotography telescope seestar canon long exposure stacking deep sky imaging nebula galaxy", to: { route: "blog" } },
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
        "Fixate",
        "whoomp",
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

      <section id="astro-section">
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

      <TonightsSky photos={astroPhotos} onOpen={(objIdx) => setGallery({ objIdx, imgIdx: 0 })} />
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
// Live site preview — a browser frame that loads the real deployment.
//
// Two things make this behave rather than look like a broken screenshot:
//
// 1. The dashboard is dense and desktop-shaped, so the frame renders at a full
//    1440px and is scaled down to whatever width the modal gives it. Sizing the
//    iframe to the card instead would trigger the mobile layout, which looks
//    nothing like the thing being shown off.
// 2. It doesn't autoload. Opening a project modal shouldn't fire a request to a
//    third-party origin you never asked for — so the real load is one click
//    away, and until then it's just a frame.
//
// If a deployment ever refuses to be framed (X-Frame-Options / CSP
// frame-ancestors) the load event never arrives, so a timer falls back to an
// "open in a new tab" prompt rather than leaving a dead white rectangle.
// =========================================================
const FRAME_W = 1440;
const FRAME_H = 900;

// CryptoRadar's public deployment.
const CRYPTORADAR_URL = "https://cr-monitordash.vercel.app/";
const GITHUB_URL = "https://github.com/RonakToprani";
// The "in" glyph, shared by the contact page and the footer.
const LINKEDIN_MARK =
  "M4.98 3.5C4.98 4.88 3.87 6 2.5 6S.02 4.88.02 3.5C.02 2.12 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.25 8h4.5v12H.25V8zm7.5 0h4.31v1.64h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V20h-4.5v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V20h-4.5V8z";
const FIXATE_REPO = "https://github.com/RonakToprani/fixate";

function LivePreview({ url, title }: { url: string; title: string }) {
  const host = useMemo(() => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  }, [url]);

  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!live || ready) return;
    const t = setTimeout(() => setBlocked(true), 8000);
    return () => clearTimeout(t);
  }, [live, ready]);

  const scale = w ? w / FRAME_W : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
        </div>
        <div className="flex-1 truncate rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-center text-[11px] text-zinc-500">
          {host}
        </div>
        {live && ready && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-500">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            live
          </span>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-zinc-400 hover:text-zinc-900 transition"
          aria-label={`Open ${title} in a new tab`}
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div
        ref={box}
        className="relative overflow-hidden bg-zinc-50"
        style={{ height: scale ? FRAME_H * scale : 280 }}
      >
        {!live ? (
          <button
            onClick={() => setLive(true)}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            <span className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm transition group-hover:border-zinc-500">
              Load the live dashboard
            </span>
            <span className="text-xs text-zinc-500">the real deployment, running right here</span>
          </button>
        ) : blocked && !ready ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm text-zinc-600">This deployment won’t load inside a frame.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-white transition"
            >
              Open it in a new tab <ExternalLink className="size-3.5" />
            </a>
          </div>
        ) : (
          <>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                loading the dashboard…
              </div>
            )}
            <iframe
              src={url}
              title={title}
              onLoad={() => setReady(true)}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute left-0 top-0 origin-top-left border-0"
              style={{
                width: FRAME_W,
                height: FRAME_H,
                transform: `scale(${scale})`,
                opacity: ready ? 1 : 0,
                transition: "opacity .35s ease",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

// =========================================================
// Fixate session receipt.
//
// The whole argument for Fixate is that focus time is *attested* rather than
// self-reported — so the most honest way to show it is the artefact itself:
// one session, minute by minute, including the bits where attention wandered.
// A screenshot of a dashboard wouldn't make that point; a receipt does.
//
// The session below is a worked example, not a recording of a real one.
// =========================================================
const RECEIPT = {
  label: "Deep work",
  from: "09:12",
  to: "10:42",
  // Alternating stretches of held vs. broken attention, in minutes.
  segments: [
    { kind: "on", min: 14 },
    { kind: "off", min: 1 },
    { kind: "on", min: 22 },
    { kind: "off", min: 2 },
    { kind: "on", min: 9 },
    { kind: "off", min: 1 },
    { kind: "on", min: 31 },
    { kind: "off", min: 2 },
    { kind: "on", min: 8 },
  ],
  blockedAt: [37, 60, 75], // minutes in, where a blocked site was attempted
};

function FixateReceipt() {
  const total = RECEIPT.segments.reduce((s, x) => s + x.min, 0);
  const held = RECEIPT.segments.filter((s) => s.kind === "on").reduce((s, x) => s + x.min, 0);
  const longest = Math.max(...RECEIPT.segments.filter((s) => s.kind === "on").map((s) => s.min));
  const lapses = RECEIPT.segments.filter((s) => s.kind === "off").length;

  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-medium">{RECEIPT.label} — session receipt</div>
        <div className="text-[11px] uppercase tracking-wide text-zinc-400">example</div>
      </div>

      {/* the session itself, minute by minute */}
      <div className="relative mt-3">
        <div className="flex h-7 w-full overflow-hidden rounded-lg">
          {RECEIPT.segments.map((s, i) => (
            <div
              key={i}
              style={{ width: `${(s.min / total) * 100}%` }}
              title={`${s.min} min ${s.kind === "on" ? "focused" : "away"}`}
              // Held attention is the solid, high-contrast one in both themes —
              // it must never read as the empty part of the bar.
              className={
                s.kind === "on" ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
              }
            />
          ))}
        </div>
        {/* attempts to reach a blocked site, stamped on the timeline */}
        {RECEIPT.blockedAt.map((m) => (
          <div
            key={m}
            style={{ left: `${(m / total) * 100}%` }}
            title={`blocked site attempted at ${m} min`}
            className="absolute -top-1 h-9 w-px bg-amber-500"
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-zinc-400">
        <span>{RECEIPT.from}</span>
        <span>{RECEIPT.to}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-2 sm:grid-cols-4">
        {[
          { v: `${held}m`, k: "attention held" },
          { v: `${longest}m`, k: "longest stretch" },
          { v: lapses, k: "look-aways" },
          { v: RECEIPT.blockedAt.length, k: "sites blocked" },
        ].map((s) => (
          <div key={s.k}>
            <div className="text-lg font-medium tabular-nums leading-none">{s.v}</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-zinc-900 dark:bg-zinc-100" /> focused
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-zinc-200 dark:bg-zinc-700" /> looked away
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-amber-500" /> blocked site attempted
        </span>
        <span className="ml-auto">computed on-device · nothing uploaded</span>
      </div>
    </div>
  );
}

// =========================================================
// Projects + Research — single source of truth (shared with search)
// =========================================================
const WORK = [
    {
      title: "Fixate",
      venue: "Chrome Extension (MV3) · 2026",
      tags: ["typescript", "computer vision", "local-first", "product"],
      desc:
        "A Chrome extension (MV3) that verifies focus sessions with on-device computer vision. Pairs webcam gaze estimation (eye-blendshapes + head pose, with hysteresis to avoid false flags) with site-blocking via declarativeNetRequest, and logs per-session focus metrics locally. No backend.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Fixate calibrates a personal gaze baseline at the start of each session, then runs
            inference on the webcam feed locally to detect when attention drifts off-screen, blocks
            a chosen set of distracting sites, and flags when the browser loses focus. Each session
            produces an attributed, verifiable record of focus time rather than a self-reported one.
          </p>
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
          <FixateReceipt />
          <ul className="list-disc pl-6 space-y-1 text-zinc-600 text-xs leading-relaxed">
            <li><b>Site blocking</b> via <code>declarativeNetRequest</code> for the session's duration</li>
            <li><b>Leaving-Chrome detection</b> through <code>windows.onFocusChanged</code></li>
            <li><b>Runs in the background</b> — a hidden document, live dashboard in the toolbar popout</li>
            <li><b>Verified history</b> — accumulates focus hours, clean streaks, and one pattern insight</li>
          </ul>
          <a
            href={FIXATE_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition"
          >
            <Github className="size-3.5" /> View on GitHub
          </a>
        </div>
      ),
      clickable: true,
    },
    {
      title: "whoomp",
      venue: "On-device health app · iOS",
      tags: ["local-first", "on-device", "bluetooth le", "react native"],
      desc:
        "A local-first iOS app (React Native / Expo) that reads live biometrics from a wearable over Bluetooth LE and computes HRV, recovery, and strain on-device. Decodes the raw framed sensor stream at the byte level and persists sessions locally with SQLite — no cloud or account.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            whoomp connects to a wearable over Bluetooth LE, decodes its raw sensor stream, and
            runs the HRV / recovery / strain pipeline directly on the phone. There is no backend
            service — biometric data is captured, processed, and stored entirely on-device. The
            harder parts were on the signal side: reading and framing the BLE data correctly, then
            turning it into stable derived metrics.
          </p>
          <figure className="space-y-1.5">
            <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-black mx-auto w-full max-w-[260px]">
              <video
                src="/whoomp.mp4"
                controls
                loop
                muted
                autoPlay
                playsInline
                preload="metadata"
                className="w-full block"
              />
            </div>
            <figcaption className="text-xs text-zinc-500 text-center">
              Demo — live biometrics streaming off the wearable over Bluetooth into the on-device dashboard.
            </figcaption>
          </figure>
          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="font-medium mb-1">Signal &amp; systems work</div>
            <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
              <li>Talks directly to the wearable's sensors over a custom Bluetooth LE service</li>
              <li>Decodes the raw, framed data stream at the byte level (<code>CRC-32</code> checked)</li>
              <li>Parses real-time biometric packets into a continuous live signal</li>
              <li>Computes HRV, recovery, and strain fully on-device — no server round-trip</li>
            </ul>
          </div>

          {/* Methodology — stress */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2 text-xs text-zinc-600 leading-relaxed">
                <div className="font-medium text-sm text-zinc-900">How the stress score works</div>
                <p>
                  Stress is inferred from heart rate sitting <b>above your resting baseline while
                  the accelerometer shows you're still</b> — motion is explicitly excluded, so a
                  workout registers as strain, not stress. This gating is the key to not confusing
                  physical exertion with physiological stress.
                </p>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-[11px] text-zinc-700 overflow-x-auto">
                  stress(t) = f( HR(t) − HR_rest ) · 𝟙[ motion(t) &lt; θ ]
                </div>
                <p>
                  Each moment is binned <b>Low / Med / High</b> by how far HR is elevated (and how
                  compressed HRV is), and the day is aggregated into a single 0–100 score — lower is
                  calmer. Plotting it across the day, over the sleep window, shows when the load
                  actually landed.
                </p>
              </div>
              <div>
                <img
                  src="/whoompstress.jpg"
                  alt="whoomp stress-through-the-day methodology"
                  className="rounded-lg border border-zinc-200 w-full max-w-[220px] mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Methodology — sleep staging */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2 text-xs text-zinc-600 leading-relaxed">
                <div className="font-medium text-sm text-zinc-900">How sleep is staged</div>
                <p>
                  Sleep stages — awake, REM, light, and deep — are inferred per epoch by fusing
                  accelerometer <b>actigraphy</b> (movement gates awake vs. asleep) with <b>heart
                  rate</b> and <b>HRV</b>. Deep sleep shows a low, stable HR and high parasympathetic
                  tone; REM shows waking-like HR with high autonomic variability. Labels are smoothed
                  with a transition model so stages don't flicker between epochs.
                </p>
                <p>
                  The night rolls up into <b>Restorative</b> time (REM + deep), per-stage durations,
                  and a <b>Sleep Need</b> target built from your baseline plus accrued
                  <b> sleep debt</b> and same-day <b>strain</b>.
                </p>
              </div>
              <div>
                <img
                  src="/whoompsleep.jpg"
                  alt="whoomp sleep staging and sleep-need methodology"
                  className="rounded-lg border border-zinc-200 w-full max-w-[170px] mx-auto"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">Expo (SDK 52+)</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">react-native-ble-plx</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">expo-sqlite</span>
            <span className="rounded-lg border border-zinc-200 px-2 py-0.5">EAS Build</span>
          </div>
          <p className="text-xs text-zinc-500 italic">
            A local-first systems project: Bluetooth LE, byte-level signal decoding, and an on-device
            health engine — wrapped in a clean dashboard.
          </p>
        </div>
      ),
      clickable: true,
    },
    {
      title: "kōdō",
      venue: "Personal Dashboard · Local SLMs",
      tags: ["node", "local SLM", "ollama", "sqlite"],
      desc:
        "A local-first productivity dashboard that classifies task priority and estimates effort using two small language models running in parallel through Ollama. Adds natural-language date parsing, a calendar view, and SQLite-backed cross-device sync. Node/Express, no build step.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Input is a single text box. A submitted note — e.g. <em>"call bank tmr, fix login bug,
            brunch this weekend"</em> — is cleaned into a title, classified into a priority tier by
            one local model, and given an effort estimate by a second model running concurrently;
            dated phrases are parsed and placed on a calendar. All inference runs locally through
            Ollama, so there are no API costs or network round-trips.
          </p>
          <figure className="space-y-1.5">
            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-black">
              <video
                src="/kodo.mp4"
                controls
                loop
                muted
                autoPlay
                playsInline
                preload="metadata"
                className="w-full block"
              />
            </div>
            <figcaption className="text-xs text-zinc-500">
              Demo — brain-dump input, local-SLM prioritization and time estimates, and the calendar filling in.
            </figcaption>
          </figure>
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
          <a
            href="https://github.com/RonakToprani/kodo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition"
          >
            View on GitHub <ExternalLink className="size-3.5" />
          </a>
        </div>
      ),
      clickable: true,
    },
    {
      title: "CryptoRadar",
      venue: "Market & Compliance Terminal",
      tags: ["next.js", "react", "fintech", "data viz"],
      desc:
        "A real-time dashboard (Next.js 16 / React 19 / Recharts) that aggregates crypto market data and Americas regulatory signals into a single view — live market stats, ETF flows, a compliance calendar, and CBDC / stablecoin trackers, fed by public APIs and RSS.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            CryptoRadar combines two data domains that are usually tracked separately — market
            activity and regulatory developments — into one dashboard. The market side pulls live
            prices, ETF flows, and correlations; the regulatory side tracks policy status, compliance
            dates, and CBDC / stablecoin activity across the Americas. The dense, single-screen
            layout is inspired by real-time world-monitor dashboards.
          </p>

          <LivePreview url={CRYPTORADAR_URL} title="CryptoRadar — live dashboard" />

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
          <a
            href={CRYPTORADAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition"
          >
            Open the live site <ExternalLink className="size-3.5" />
          </a>
        </div>
      ),
      clickable: true,
    },
    {
      title: "Mochi desk robot",
      venue: "Embedded / Robotics · ESP32",
      tags: ["esp32", "embedded", "local SLM", "hardware"],
      desc:
        "An ESP32-based desk companion that runs a small language model on-device behind an animated LVGL touchscreen face. Firmware written in C++ / PlatformIO, iterated across several hardware revisions.",
      details: (
        <div className="space-y-4 text-sm max-w-3xl mx-auto">
          <p className="text-zinc-700 leading-relaxed">
            Mochi is an ESP32-based desk robot with a touchscreen display and an animated face,
            driven by a small language model. It's an exploration of embedded firmware and display
            pipelines — fitting model-driven behaviour and a responsive LVGL UI onto constrained
            hardware — across several board and firmware revisions.
          </p>
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
        "A Python trading bot for XRP that combines classical quantitative signals with a locally-hosted small language model for short-horizon predictive modeling. In development.",
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
  { title: "Tonight's Sky", subtitle: "Live · What's up over Toronto", kind: "Page", route: "blog", keywords: "tonight sky live observing targets altitude moon phase dark astronomical twilight telescope toronto what to shoot" },
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

// Fold accents so "kodo" matches "kōdō", "andromeda" matches accented text, etc.
const fold = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function searchAll(q: string): SearchEntry[] {
  const s = fold(q.trim());
  if (!s) return [];
  const terms = s.split(/\s+/);
  return SEARCH_INDEX.map((e) => {
    const hay = fold(e.title + " " + e.subtitle + " " + e.keywords);
    const titleHay = fold(e.title);
    let score = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return { e, score: -1 };
      score += titleHay.includes(t) ? 3 : 1;
    }
    return { e, score };
  })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((r) => r.e);
}

function ProjectsResearch({
  focusProject,
  focusCategory,
}: {
  focusProject?: string | null;
  focusCategory?: string | null;
}) {
  const work = WORK;

  const [active, setActive] = useState<any | null>(null);
  const [cat, setCat] = useState<string>("all");

  // Deep-link: open a project modal when the universal search selects it
  useEffect(() => {
    if (!focusProject) return;
    const w = work.find((x) => x!.title === focusProject);
    if (w && w.clickable) setActive(w);
  }, [focusProject, work]);

  // Deep-link: a concept node on the Idea Graph lands here pre-filtered
  useEffect(() => {
    if (focusCategory) setCat(focusCategory);
  }, [focusCategory]);

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
            {/* Gmail. The white backing plate this used to have was invisible on
                a white page and a bright block on a dark one, so it's gone —
                the red envelope reads correctly against both. */}
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
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
            {/* X mark, drawn rather than the flat black xlogo.avif — as an image
                it was a black-on-black square in dark mode, and inverting a
                bitmap is a guess. currentColor just follows the theme. */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-label="X" role="img">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/ronaktoprani"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="group"
          >
            {/* LinkedIn, same story as above — the PNG was black-on-transparent */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-label="LinkedIn" role="img">
              <path d={LINKEDIN_MARK} />
            </svg>
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="group"
          >
            {/* GitHub mark — drawn rather than an image so it follows the theme */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.02 11.02 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
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
        // linkedin.png is a solid-black mark with alpha, so it disappeared
        // entirely against a dark background. Drawn instead, in currentColor.
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        >
          <path d={LINKEDIN_MARK} />
        </svg>
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