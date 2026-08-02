// =========================================================
// sky.ts — small, dependency-free positional astronomy.
//
// Everything here is a pure function of (time, place). It's what lets the
// "Tonight's Sky" block on the Notes page compute, live in the browser,
// which of my targets are actually above the horizon right now.
//
// Accuracy: sun ~0.01°, moon ~0.3°, sidereal time ~arcseconds. Far better
// than needed to answer "is it up, how high does it get, is the moon in
// the way" — the questions that actually decide whether I set up or not.
// Sources: Astronomical Almanac low-precision sun; Meeus ch. 47 truncated moon.
// =========================================================

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// Where I shoot from.
export const SITE = { lat: 43.6532, lon: -79.3832, label: "Toronto" };

// Sun altitude below which the sky is properly dark (astronomical twilight).
const DARK_ALT = -18;
// Fallback for the few weeks a year when true astronomical dark is marginal.
const NAUTICAL_ALT = -12;

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const norm180 = (x: number) => norm360(x + 180) - 180;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export type Equatorial = { ra: number; dec: number };
export type Horizontal = { alt: number; az: number };

// Days since the J2000.0 epoch.
function daysSinceJ2000(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5 - 2451545.0;
}

// Greenwich mean sidereal time, in degrees.
function gmst(date: Date): number {
  return norm360(280.46061837 + 360.98564736629 * daysSinceJ2000(date));
}

// Mean obliquity of the ecliptic.
function obliquity(d: number): number {
  return 23.439 - 0.0000004 * d;
}

function eclipticToEquatorial(lonDeg: number, latDeg: number, d: number): Equatorial {
  const eps = obliquity(d) * DEG;
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const ra = Math.atan2(
    Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps),
    Math.cos(lon)
  );
  const dec = Math.asin(
    clamp(Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon), -1, 1)
  );
  return { ra: norm360(ra * RAD), dec: dec * RAD };
}

/** Where an object sits in the local sky: altitude above the horizon, azimuth from north. */
export function toHorizontal(eq: Equatorial, date: Date, lat = SITE.lat, lon = SITE.lon): Horizontal {
  const ha = norm180(gmst(date) + lon - eq.ra) * DEG;
  const dec = eq.dec * DEG;
  const phi = lat * DEG;
  const alt = Math.asin(
    clamp(Math.sin(dec) * Math.sin(phi) + Math.cos(dec) * Math.cos(phi) * Math.cos(ha), -1, 1)
  );
  // Azimuth from the south, then rotated to the conventional north-based bearing.
  const az = Math.atan2(
    Math.sin(ha),
    Math.cos(ha) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
  );
  return { alt: alt * RAD, az: norm360(az * RAD + 180) };
}

/** Sun position. Also returns ecliptic longitude, which the moon phase needs. */
export function sunPosition(date: Date): Equatorial & { eclipticLon: number } {
  const d = daysSinceJ2000(date);
  const L = norm360(280.46 + 0.9856474 * d); // mean longitude
  const g = norm360(357.528 + 0.9856003 * d) * DEG; // mean anomaly
  const lon = norm360(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  return { ...eclipticToEquatorial(lon, 0, d), eclipticLon: lon };
}

/** Moon position, plus the ecliptic longitude used for phase. */
export function moonPosition(date: Date): Equatorial & { eclipticLon: number } {
  const d = daysSinceJ2000(date);
  const Lp = norm360(218.316 + 13.176396 * d); // mean longitude
  const M = norm360(134.963 + 13.064993 * d) * DEG; // mean anomaly
  const F = norm360(93.272 + 13.2293 * d) * DEG; // argument of latitude
  const lon = norm360(Lp + 6.289 * Math.sin(M));
  const lat = 5.128 * Math.sin(F);
  return { ...eclipticToEquatorial(lon, lat, d), eclipticLon: lon };
}

/** Illuminated fraction of the moon's disc, plus the usual phase name. */
export function moonPhase(date: Date): { illumination: number; name: string } {
  const elong = norm360(moonPosition(date).eclipticLon - sunPosition(date).eclipticLon);
  const illumination = (1 - Math.cos(elong * DEG)) / 2;
  const names = [
    "new moon",
    "waxing crescent",
    "first quarter",
    "waxing gibbous",
    "full moon",
    "waning gibbous",
    "last quarter",
    "waning crescent",
  ];
  // Each named phase owns a 45°-wide slice of the synodic cycle, centred on its name.
  const name = names[Math.floor(norm360(elong + 22.5) / 45)];
  return { illumination, name };
}

/** Great-circle angle between two points on the sky, in degrees. */
export function separation(a: Equatorial, b: Equatorial): number {
  const d1 = a.dec * DEG;
  const d2 = b.dec * DEG;
  const dra = (a.ra - b.ra) * DEG;
  const cos = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dra);
  return Math.acos(clamp(cos, -1, 1)) * RAD;
}

export type DarkWindow = { start: Date; end: Date; nautical: boolean } | null;

/**
 * The next stretch of usable darkness. Scans forward in 5-minute steps from
 * `now`; if the sun never clears -18° (high-summer nights up here get close),
 * retries at nautical twilight and says so.
 */
export function nextDarkWindow(now: Date, lat = SITE.lat, lon = SITE.lon): DarkWindow {
  const STEP = 5 * 60 * 1000;
  const HORIZON = (30 * 60 * 60 * 1000) / STEP; // scan 30h so there's always a night ahead

  const scan = (threshold: number) => {
    let start: Date | null = null;
    for (let i = 0; i <= HORIZON; i++) {
      const t = new Date(now.getTime() + i * STEP);
      const dark = toHorizontal(sunPosition(t), t, lat, lon).alt < threshold;
      if (dark && !start) start = t;
      if (!dark && start) return { start, end: t };
    }
    return null;
  };

  const astro = scan(DARK_ALT);
  if (astro) return { ...astro, nautical: false };
  const naut = scan(NAUTICAL_ALT);
  return naut ? { ...naut, nautical: true } : null;
}

export type Status = "prime" | "workable" | "low" | "no";

export type TargetReport = {
  /** Altitude right now, degrees. Negative means below the horizon. */
  altNow: number;
  /** Highest the target gets during tonight's dark window. */
  peakAlt: number;
  peakAt: Date | null;
  status: Status;
  /** True when a bright moon sits close enough to wash the target out at its peak. */
  moonWashed: boolean;
  /** Climbing or sinking right now — decides whether it's worth waiting. */
  rising: boolean;
  /** The target already transited; its best moment tonight is now, not later. */
  pastBest: boolean;
};

/**
 * How a target actually behaves tonight: where it is now, how high it climbs
 * while the sky is dark, and whether the moon is going to ruin it.
 *
 * Thresholds are the ones I use in practice — below ~25° you're shooting
 * through too much atmosphere and Toronto's light dome, so it's not worth
 * setting up for.
 */
export function reportTarget(
  eq: Equatorial,
  now: Date,
  dark: DarkWindow,
  lat = SITE.lat,
  lon = SITE.lon
): TargetReport {
  const altNow = toHorizontal(eq, now, lat, lon).alt;

  let peakAlt = -90;
  let peakAt: Date | null = null;
  if (dark) {
    const STEP = 5 * 60 * 1000;
    for (let t = dark.start.getTime(); t <= dark.end.getTime(); t += STEP) {
      const at = new Date(t);
      const alt = toHorizontal(eq, at, lat, lon).alt;
      if (alt > peakAlt) {
        peakAlt = alt;
        peakAt = at;
      }
    }
  }

  let moonWashed = false;
  if (peakAt) {
    const moon = moonPosition(peakAt);
    const { illumination } = moonPhase(peakAt);
    const moonUp = toHorizontal(moon, peakAt, lat, lon).alt > 0;
    moonWashed = moonUp && illumination > 0.35 && separation(eq, moon) < 60;
  }

  const status: Status =
    peakAlt >= 45 ? "prime" : peakAlt >= 25 ? "workable" : peakAlt > 5 ? "low" : "no";

  const soon = new Date(now.getTime() + 30 * 60 * 1000);
  const rising = toHorizontal(eq, soon, lat, lon).alt > altNow;
  // If the best moment is within a quarter hour of now, the target has already
  // transited (or is transiting) — "peaks at 12:36am" when it *is* 12:36am is
  // technically true and useless. Say "falling" instead.
  const pastBest = !!peakAt && peakAt.getTime() - now.getTime() < 15 * 60 * 1000;

  return { altNow, peakAlt, peakAt, status, moonWashed, rising, pastBest };
}

/** Rise/set-agnostic helper: is this thing up right now? */
export const isUp = (eq: Equatorial, now: Date) => toHorizontal(eq, now).alt > 0;

/** "10:42 PM" in the viewer's own locale. */
export const clockTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** Convert "20h 12m 07s" style coordinates to the decimal degrees used above. */
export const hms = (h: number, m: number, s: number) => (h + m / 60 + s / 3600) * 15;
export const dms = (d: number, m: number, s: number) =>
  Math.sign(d) * (Math.abs(d) + m / 60 + s / 3600);
