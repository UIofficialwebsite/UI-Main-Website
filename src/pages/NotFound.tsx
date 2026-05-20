import { useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

// WebAudio-synthesized SFX. No asset files — each effect is built from
// oscillators / noise buffers so the bundle stays light. AudioContext is
// created lazily on the first sound (browsers require a user gesture to
// resume; the player always interacts before sounds play).
const MUTE_KEY = "ui-404-muted";
const sfx = (() => {
  let ctx: AudioContext | null = null;
  let muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* localStorage blocked — leave default */
  }
  const getCtx = (): AudioContext | null => {
    if (muted || typeof window === "undefined") return null;
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  };
  const tone = (
    c: AudioContext,
    t: number,
    type: OscillatorType,
    fromHz: number,
    toHz: number,
    dur: number,
    peakGain: number
  ) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(fromHz, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peakGain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  return {
    isMuted: () => muted,
    setMuted: (m: boolean) => {
      muted = m;
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch {
        /* localStorage blocked — fine */
      }
    },
    jump: () => {
      const c = getCtx();
      if (!c) return;
      tone(c, c.currentTime, "sine", 620, 920, 0.11, 0.18);
    },
    duck: () => {
      const c = getCtx();
      if (!c) return;
      tone(c, c.currentTime, "square", 300, 150, 0.09, 0.08);
    },
    milestone: () => {
      const c = getCtx();
      if (!c) return;
      const t0 = c.currentTime;
      // C5–E5–G5 quick triad
      tone(c, t0, "triangle", 523.25, 523.25, 0.16, 0.12);
      tone(c, t0 + 0.05, "triangle", 659.25, 659.25, 0.16, 0.12);
      tone(c, t0 + 0.1, "triangle", 783.99, 783.99, 0.2, 0.14);
    },
    crash: () => {
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime;
      // Noise burst — feels like a dust impact.
      const dur = 0.4;
      const buf = c.createBuffer(
        1,
        Math.floor(c.sampleRate * dur),
        c.sampleRate
      );
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const noise = c.createBufferSource();
      noise.buffer = buf;
      const nGain = c.createGain();
      nGain.gain.setValueAtTime(0.22, t);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      noise.connect(nGain).connect(c.destination);
      noise.start(t);
      // Low square fall — the "ow" underneath.
      tone(c, t, "square", 280, 60, 0.35, 0.22);
    },
  };
})();

// Chrome-dino-style runner. Logical coordinates are in a fixed 620×160 grid;
// every entity is positioned via percentages so the canvas scales fluidly
// inside its rounded card while collision math stays in pixel units.
const GAME_W = 620;
// Sky needs room for the full jump arc (~160 units) above the dog.
// GAME_H/GROUND_Y are sized so dinoTop stays >= 0 at the apex.
const GAME_H = 240;
const GROUND_Y = 210;
const DINO_X = 36;
const DINO_W = 44;
const DINO_H = 47;
const DUCK_W = 60;
const DUCK_H = 28;
const GRAVITY = 0.0021;
const JUMP_V = 0.82;
const FAST_FALL_V = 0.6;
const HS_KEY = "ui-404-dino-highscore";
const NIGHT_EVERY = 500; // score points between day↔night flips

// Day/night palettes — flips every NIGHT_EVERY points. Obstacles inherit `ink`
// via CSS currentColor, so we only need to set the wrapper's color to swap them.
const dayPalette = {
  sky: "#fefdf9",
  ink: "#535353",
  ground: "#a8a29e",
  groundTick: "#cbd5e1",
  cloud: "#ffffff",
  cloudShadow: "#e2e8f0",
  hillBack: "#fde68a",
  hillFront: "#fcd34d",
  textPrimary: "#0f172a",
  textMuted: "#64748b",
} as const;

const nightPalette = {
  sky: "#0b1220",
  ink: "#cbd5e1",
  ground: "#475569",
  groundTick: "#334155",
  cloud: "#94a3b8",
  cloudShadow: "#64748b",
  hillBack: "#1e293b",
  hillFront: "#0f172a",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
} as const;

type ObsKind = "cactus-s" | "cactus-m" | "cactus-l" | "bird-low" | "bird-high";

interface Cloud {
  id: number;
  x: number;
  y: number;
  w: number;
  speed: number;
}
interface Hill {
  id: number;
  x: number;
  w: number;
  h: number;
  layer: 0 | 1;
}
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // ms remaining
  size: number;
}

const OBS_DIMS: Record<ObsKind, { w: number; h: number; topY: number }> = {
  "cactus-s": { w: 17, h: 35, topY: GROUND_Y - 35 },
  "cactus-m": { w: 25, h: 50, topY: GROUND_Y - 50 },
  "cactus-l": { w: 50, h: 35, topY: GROUND_Y - 35 },
  "bird-low": { w: 46, h: 40, topY: GROUND_Y - 42 },
  "bird-high": { w: 46, h: 30, topY: GROUND_Y - 78 },
};

interface Obstacle {
  id: number;
  kind: ObsKind;
  x: number;
}

let cloudId = 0;
let hillId = 0;
let particleId = 0;

const seedClouds = (): Cloud[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: ++cloudId,
    x: (GAME_W / 5) * i + Math.random() * 40,
    y: 14 + Math.random() * 90,
    w: 26 + Math.random() * 18,
    speed: 0.05 + Math.random() * 0.04,
  }));

const seedHills = (): Hill[] => {
  const arr: Hill[] = [];
  let x = 0;
  while (x < GAME_W + 80) {
    arr.push({
      id: ++hillId,
      x,
      w: 80 + Math.random() * 70,
      h: 14 + Math.random() * 14,
      layer: arr.length % 2 === 0 ? 0 : 1,
    });
    x += 90 + Math.random() * 60;
  }
  return arr;
};

const pickKind = (speed: number): ObsKind => {
  const birdsAllowed = speed > 0.42;
  const r = Math.random();
  if (r < 0.34) return "cactus-s";
  if (r < 0.58) return "cactus-m";
  if (r < 0.72) return "cactus-l";
  if (!birdsAllowed) return "cactus-s";
  return r < 0.86 ? "bird-low" : "bird-high";
};

// Colourful cute-dog runner. Palette: tan body with cream belly, chocolate
// ears + paw pads, red collar with a gold tag, tiny pink tongue. Hitbox
// dimensions match the previous sprite so collision tuning carries over.
const DOG_BODY = "#E8B17C";
const DOG_BELLY = "#F6DEB9";
const DOG_DARK = "#8B5A2B";
const DOG_PAW = "#3F2A1A";
const DOG_EYE = "#1F2937";
const DOG_NOSE = "#1F2937";
const DOG_COLLAR = "#DC2626";
const DOG_TAG = "#F59E0B";
const DOG_TONGUE = "#F472B6";

const DogSprite = ({
  ducking,
  legFrame,
  dead,
  airborne,
}: {
  ducking: boolean;
  legFrame: 0 | 1;
  dead: boolean;
  airborne: boolean;
}) => {
  const lf: 0 | 1 = airborne ? 0 : legFrame;
  // On game-over swap eyes for cross-marks and tilt the dog so it reads
  // as "knocked out" rather than just frozen.
  if (ducking) {
    return (
      <svg viewBox="0 0 60 28" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
        {/* tail */}
        <rect x="0" y="13" width="6" height="4" fill={DOG_BODY} />
        <rect x="0" y="13" width="3" height="4" fill={DOG_DARK} />
        {/* body */}
        <rect x="6" y="10" width="36" height="11" fill={DOG_BODY} />
        <rect x="6" y="17" width="36" height="4" fill={DOG_BELLY} />
        {/* head */}
        <rect x="42" y="8" width="14" height="12" fill={DOG_BODY} />
        {/* floppy ear flapping back */}
        <rect x="40" y="6" width="6" height="7" fill={DOG_DARK} />
        {/* muzzle */}
        <rect x="52" y="14" width="8" height="5" fill={DOG_BELLY} />
        {/* nose */}
        <rect x="56" y="14" width="4" height="3" fill={DOG_NOSE} />
        {/* eye */}
        {dead ? (
          <>
            <rect x="48" y="10" width="3" height="1" fill={DOG_EYE} transform="rotate(45 49.5 10.5)" />
            <rect x="48" y="10" width="3" height="1" fill={DOG_EYE} transform="rotate(-45 49.5 10.5)" />
          </>
        ) : (
          <>
            <rect x="48" y="10" width="2" height="2" fill={DOG_EYE} />
            <rect x="49" y="10" width="1" height="1" fill="#ffffff" />
          </>
        )}
        {/* collar + tag */}
        <rect x="41" y="14" width="2" height="5" fill={DOG_COLLAR} />
        <rect x="40" y="18" width="3" height="2" fill={DOG_TAG} />
        {/* legs */}
        {lf === 0 ? (
          <>
            <rect x="14" y="21" width="3" height="5" fill={DOG_BODY} />
            <rect x="13" y="26" width="5" height="2" fill={DOG_PAW} />
            <rect x="34" y="21" width="3" height="6" fill={DOG_BODY} />
            <rect x="33" y="26" width="5" height="2" fill={DOG_PAW} />
          </>
        ) : (
          <>
            <rect x="14" y="21" width="3" height="6" fill={DOG_BODY} />
            <rect x="13" y="26" width="5" height="2" fill={DOG_PAW} />
            <rect x="34" y="21" width="3" height="4" fill={DOG_BODY} />
            <rect x="33" y="25" width="5" height="2" fill={DOG_PAW} />
          </>
        )}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 44 47" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      {/* tail — curled, lighter tip */}
      <rect x="2" y="20" width="4" height="6" fill={DOG_DARK} />
      <rect x="4" y="16" width="4" height="6" fill={DOG_BODY} />
      <rect x="6" y="14" width="4" height="4" fill={DOG_BODY} />
      {/* body */}
      <rect x="6" y="22" width="22" height="14" fill={DOG_BODY} />
      <rect x="8" y="30" width="20" height="6" fill={DOG_BELLY} />
      {/* head */}
      <rect x="22" y="10" width="16" height="14" fill={DOG_BODY} />
      {/* back ear */}
      <rect x="22" y="6" width="6" height="8" fill={DOG_DARK} />
      {/* front floppy ear */}
      <rect x="30" y="6" width="6" height="10" fill={DOG_DARK} />
      <rect x="34" y="14" width="4" height="3" fill={DOG_DARK} />
      {/* cheek/blush — a soft warm spot, gives the cute factor */}
      <rect x="28" y="20" width="3" height="2" fill="#F8B4B4" opacity="0.7" />
      {/* muzzle */}
      <rect x="32" y="18" width="10" height="6" fill={DOG_BELLY} />
      {/* nose */}
      <rect x="38" y="18" width="4" height="3" fill={DOG_NOSE} />
      {/* eye / X on death */}
      {dead ? (
        <>
          <rect x="32" y="14" width="4" height="1" fill={DOG_EYE} transform="rotate(45 34 14.5)" />
          <rect x="32" y="14" width="4" height="1" fill={DOG_EYE} transform="rotate(-45 34 14.5)" />
        </>
      ) : (
        <>
          <rect x="32" y="14" width="3" height="3" fill={DOG_EYE} />
          <rect x="33" y="14" width="1" height="1" fill="#ffffff" />
        </>
      )}
      {/* tongue */}
      <rect x="36" y="22" width="3" height="2" fill={DOG_TONGUE} />
      {/* collar + tag */}
      <rect x="22" y="22" width="3" height="4" fill={DOG_COLLAR} />
      <rect x="22" y="26" width="2" height="2" fill={DOG_TAG} />
      {/* legs — alternating run cycle */}
      {lf === 0 ? (
        <>
          <rect x="22" y="36" width="4" height="8" fill={DOG_BODY} />
          <rect x="21" y="44" width="6" height="3" fill={DOG_PAW} />
          <rect x="8" y="36" width="4" height="6" fill={DOG_BODY} />
          <rect x="7" y="42" width="6" height="3" fill={DOG_PAW} />
        </>
      ) : (
        <>
          <rect x="22" y="36" width="4" height="6" fill={DOG_BODY} />
          <rect x="21" y="42" width="6" height="3" fill={DOG_PAW} />
          <rect x="8" y="36" width="4" height="8" fill={DOG_BODY} />
          <rect x="7" y="44" width="6" height="3" fill={DOG_PAW} />
        </>
      )}
    </svg>
  );
};

// Obstacle sprites use currentColor so day/night palette can recolor them
// via the parent's CSS `color`. White accents (bird eye) stay hard-coded.
const CactusSmall = () => (
  <svg viewBox="0 0 17 35" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
    <rect x="6" y="0" width="5" height="35" fill="currentColor" />
    <rect x="0" y="10" width="6" height="3" fill="currentColor" />
    <rect x="0" y="13" width="3" height="6" fill="currentColor" />
    <rect x="11" y="6" width="6" height="3" fill="currentColor" />
    <rect x="14" y="9" width="3" height="5" fill="currentColor" />
  </svg>
);

const CactusMedium = () => (
  <svg viewBox="0 0 25 50" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
    <rect x="10" y="0" width="6" height="50" fill="currentColor" />
    <rect x="0" y="15" width="10" height="4" fill="currentColor" />
    <rect x="0" y="19" width="4" height="11" fill="currentColor" />
    <rect x="16" y="10" width="9" height="4" fill="currentColor" />
    <rect x="21" y="14" width="4" height="9" fill="currentColor" />
  </svg>
);

const CactusCluster = () => (
  <svg viewBox="0 0 50 35" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
    <rect x="5" y="3" width="5" height="32" fill="currentColor" />
    <rect x="0" y="12" width="5" height="3" fill="currentColor" />
    <rect x="10" y="10" width="5" height="3" fill="currentColor" />
    <rect x="22" y="6" width="5" height="29" fill="currentColor" />
    <rect x="17" y="14" width="5" height="3" fill="currentColor" />
    <rect x="27" y="11" width="5" height="3" fill="currentColor" />
    <rect x="40" y="0" width="5" height="35" fill="currentColor" />
    <rect x="35" y="10" width="5" height="3" fill="currentColor" />
    <rect x="45" y="6" width="5" height="3" fill="currentColor" />
  </svg>
);

const Bird = ({ flap }: { flap: 0 | 1 }) => (
  <svg
    viewBox={flap === 0 ? "0 0 46 34" : "0 0 46 40"}
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMax meet"
  >
    {/* body */}
    <rect x="14" y={flap === 0 ? "18" : "12"} width="20" height="6" fill="currentColor" />
    {/* head + beak */}
    <rect x="32" y={flap === 0 ? "14" : "8"} width="8" height="6" fill="currentColor" />
    <rect x="40" y={flap === 0 ? "16" : "10"} width="6" height="3" fill="currentColor" />
    {/* eye */}
    <rect x="36" y={flap === 0 ? "16" : "10"} width="2" height="2" fill="#ffffff" />
    {/* tail */}
    <rect x="10" y={flap === 0 ? "20" : "14"} width="4" height="3" fill="currentColor" />
    {/* wings */}
    {flap === 0 ? (
      <>
        <rect x="16" y="24" width="14" height="4" fill="currentColor" />
        <rect x="18" y="28" width="12" height="3" fill="currentColor" />
        <rect x="20" y="31" width="8" height="3" fill="currentColor" />
      </>
    ) : (
      <>
        <rect x="14" y="2" width="14" height="3" fill="currentColor" />
        <rect x="16" y="5" width="12" height="3" fill="currentColor" />
      </>
    )}
  </svg>
);

const ObstacleSprite = ({ kind, flap }: { kind: ObsKind; flap: 0 | 1 }) => {
  switch (kind) {
    case "cactus-s":
      return <CactusSmall />;
    case "cactus-m":
      return <CactusMedium />;
    case "cactus-l":
      return <CactusCluster />;
    case "bird-low":
    case "bird-high":
      return <Bird flap={flap} />;
  }
};

const DinoGame = () => {
  const [status, setStatus] = useState<"idle" | "running" | "over">("idle");
  const [dinoY, setDinoY] = useState(0);
  const [ducking, setDucking] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [legFrame, setLegFrame] = useState<0 | 1>(0);
  const [flap, setFlap] = useState<0 | 1>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(HS_KEY) || "0", 10) || 0;
    } catch {
      return 0;
    }
  });
  const [clouds, setClouds] = useState<Cloud[]>(seedClouds);
  const [hills, setHills] = useState<Hill[]>(seedHills);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false);

  const statusRef = useRef(status);
  const dinoYRef = useRef(0);
  const vyRef = useRef(0);
  const duckingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(0.34);
  const scoreRef = useRef(0);
  const lastFrameRef = useRef(0);
  const sinceSpawnRef = useRef(0);
  const spawnGapRef = useRef(1400);
  const legAccRef = useRef(0);
  const flapAccRef = useRef(0);
  const idRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const cloudsRef = useRef<Cloud[]>(clouds);
  const hillsRef = useRef<Hill[]>(hills);
  const particlesRef = useRef<Particle[]>([]);
  const lastMilestoneRef = useRef(0);
  const [muted, setMuted] = useState(() => sfx.isMuted());

  // Day/night palette derived from score — flips every NIGHT_EVERY points.
  const palette = useMemo(
    () => (Math.floor(score / NIGHT_EVERY) % 2 === 1 ? nightPalette : dayPalette),
    [score]
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const start = useCallback(() => {
    setScore(0);
    setObstacles([]);
    setDucking(false);
    setDinoY(0);
    setParticles([]);
    setShake(false);
    obstaclesRef.current = [];
    particlesRef.current = [];
    duckingRef.current = false;
    dinoYRef.current = 0;
    vyRef.current = 0;
    speedRef.current = 0.34;
    scoreRef.current = 0;
    lastFrameRef.current = performance.now();
    sinceSpawnRef.current = 0;
    spawnGapRef.current = 1400;
    legAccRef.current = 0;
    flapAccRef.current = 0;
    lastMilestoneRef.current = 0;
    // fresh backdrop so the parallax doesn't carry over from a previous run
    const freshClouds = seedClouds();
    const freshHills = seedHills();
    cloudsRef.current = freshClouds;
    hillsRef.current = freshHills;
    setClouds(freshClouds);
    setHills(freshHills);
    setStatus("running");
  }, []);

  const jump = useCallback(() => {
    if (statusRef.current === "idle" || statusRef.current === "over") {
      start();
      return;
    }
    if (duckingRef.current) {
      duckingRef.current = false;
      setDucking(false);
      return;
    }
    if (dinoYRef.current === 0) {
      vyRef.current = JUMP_V;
      sfx.jump();
    }
  }, [start]);

  const duck = useCallback((on: boolean) => {
    if (statusRef.current !== "running") return;
    if (on && !duckingRef.current) {
      sfx.duck();
    }
    duckingRef.current = on;
    setDucking(on);
    if (on && dinoYRef.current > 0) {
      vyRef.current = -FAST_FALL_V;
    }
  }, []);

  // Keyboard: Space / ↑ jumps, ↓ ducks. Only intercept default scrolling
  // when our game can use the key — otherwise let the page scroll normally.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === " " || e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        duck(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") duck(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [jump, duck]);

  // Main loop — physics, spawning, collisions, score.
  useEffect(() => {
    if (status !== "running") return;
    const tick = (now: number) => {
      if (statusRef.current !== "running") return;
      const dt = Math.min(50, now - (lastFrameRef.current || now));
      lastFrameRef.current = now;

      // Dino vertical motion: upward velocity decreases due to gravity until
      // the dino lands back on the ground (y == 0).
      vyRef.current -= GRAVITY * dt;
      let nextDinoY = dinoYRef.current + vyRef.current * dt;
      if (nextDinoY <= 0) {
        nextDinoY = 0;
        vyRef.current = 0;
      }
      dinoYRef.current = nextDinoY;
      setDinoY(nextDinoY);

      // Speed ramps slowly so the difficulty curve feels Chrome-like.
      speedRef.current = Math.min(0.78, speedRef.current + 0.0000018 * dt);

      // Parallax: clouds drift slowest, hills drift at a fraction of ground
      // speed. Both wrap once they leave the left edge.
      const advancedClouds: Cloud[] = [];
      for (const c of cloudsRef.current) {
        let nx = c.x - c.speed * dt;
        if (nx + c.w < -4) {
          nx = GAME_W + Math.random() * 80;
          advancedClouds.push({
            ...c,
            x: nx,
            y: 14 + Math.random() * 90,
            w: 26 + Math.random() * 18,
            speed: 0.05 + Math.random() * 0.04,
          });
        } else {
          advancedClouds.push({ ...c, x: nx });
        }
      }
      cloudsRef.current = advancedClouds;
      setClouds(advancedClouds);

      const advancedHills: Hill[] = [];
      for (const h of hillsRef.current) {
        const hillSpeed = h.layer === 0 ? speedRef.current * 0.18 : speedRef.current * 0.32;
        let nx = h.x - hillSpeed * dt;
        if (nx + h.w < -10) {
          nx = GAME_W + Math.random() * 60;
          advancedHills.push({
            ...h,
            x: nx,
            w: 80 + Math.random() * 70,
            h: 14 + Math.random() * 14,
          });
        } else {
          advancedHills.push({ ...h, x: nx });
        }
      }
      hillsRef.current = advancedHills;
      setHills(advancedHills);

      // Dust particles: gravity-pulled, fading. Spawned on crash; otherwise empty.
      if (particlesRef.current.length) {
        const stillAlive: Particle[] = [];
        for (const p of particlesRef.current) {
          const nLife = p.life - dt;
          if (nLife <= 0) continue;
          stillAlive.push({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            vy: p.vy + 0.0015 * dt,
            life: nLife,
          });
        }
        particlesRef.current = stillAlive;
        setParticles(stillAlive);
      }

      // Leg + wing animation frames advance on accumulated wall time.
      legAccRef.current += dt;
      if (legAccRef.current >= 110) {
        legAccRef.current = 0;
        setLegFrame((f) => (f === 0 ? 1 : 0));
      }
      flapAccRef.current += dt;
      if (flapAccRef.current >= 220) {
        flapAccRef.current = 0;
        setFlap((f) => (f === 0 ? 1 : 0));
      }

      // Spawn obstacles on a time interval that shortens with speed.
      sinceSpawnRef.current += dt;
      if (sinceSpawnRef.current >= spawnGapRef.current) {
        sinceSpawnRef.current = 0;
        const speedFactor = Math.max(0.6, speedRef.current / 0.34);
        spawnGapRef.current = (900 + Math.random() * 700) / speedFactor;
        const kind = pickKind(speedRef.current);
        obstaclesRef.current = [
          ...obstaclesRef.current,
          { id: ++idRef.current, kind, x: GAME_W + 10 },
        ];
      }

      // Advance + cull obstacles, check collision against the dino's
      // current hitbox (which shrinks when ducking).
      const dW = duckingRef.current ? DUCK_W : DINO_W;
      const dH = duckingRef.current ? DUCK_H : DINO_H;
      const dTop = GROUND_Y - dH - dinoYRef.current;
      const dLeft = DINO_X + 4;
      const dRight = DINO_X + dW - 4;
      const dT = dTop + 4;
      const dB = dTop + dH - 2;

      const advanced: Obstacle[] = [];
      let hit = false;
      for (const o of obstaclesRef.current) {
        const nx = o.x - speedRef.current * dt;
        const dims = OBS_DIMS[o.kind];
        if (nx + dims.w < -10) continue;
        if (!hit) {
          const oL = nx + 3;
          const oR = nx + dims.w - 3;
          const oT = dims.topY + 3;
          const oB = dims.topY + dims.h - 3;
          if (dRight > oL && dLeft < oR && dB > oT && dT < oB) {
            hit = true;
          }
        }
        advanced.push({ ...o, x: nx });
      }
      obstaclesRef.current = advanced;
      setObstacles(advanced);

      scoreRef.current += (speedRef.current * dt) / 8;
      const flooredScore = Math.floor(scoreRef.current);
      setScore(flooredScore);
      // Chime when crossing each 100-pt mark — small but consistent reward.
      const milestone = Math.floor(flooredScore / 100);
      if (milestone > lastMilestoneRef.current) {
        lastMilestoneRef.current = milestone;
        sfx.milestone();
      }

      if (hit) {
        const finalScore = Math.floor(scoreRef.current);
        if (finalScore > highScore) {
          try {
            localStorage.setItem(HS_KEY, String(finalScore));
          } catch {
            /* localStorage blocked — fine */
          }
          setHighScore(finalScore);
        }
        // Dust burst at the dog's feet — a small fan of pixels.
        const dogFootX = DINO_X + (duckingRef.current ? DUCK_W : DINO_W) / 2;
        const dogFootY = GROUND_Y - 2;
        const burst: Particle[] = Array.from({ length: 9 }, () => ({
          id: ++particleId,
          x: dogFootX + (Math.random() - 0.5) * 8,
          y: dogFootY - Math.random() * 4,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -0.12 - Math.random() * 0.16,
          life: 380 + Math.random() * 180,
          size: 2 + Math.floor(Math.random() * 3),
        }));
        particlesRef.current = burst;
        setParticles(burst);
        setShake(true);
        window.setTimeout(() => setShake(false), 420);
        sfx.crash();
        setStatus("over");
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, highScore]);

  // Auto-pause when tab is hidden — flip running back to idle so the player
  // restarts cleanly rather than getting hit by a stale state on return.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && statusRef.current === "running") {
        setStatus("idle");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const dinoCurrentTop = GROUND_Y - (ducking ? DUCK_H : DINO_H) - dinoY;
  const dinoCurrentW = ducking ? DUCK_W : DINO_W;
  const dinoCurrentH = ducking ? DUCK_H : DINO_H;
  const airborne = dinoY > 0.5;

  const dim = palette === nightPalette ? "night" : "day";
  // Ground ticks: a sparse pattern of small dashes along the horizon — adds
  // a sense of motion via the world drifting left under the dog.
  const groundOffset = (Date.now() / 16) % 24;

  return (
    <>
      <style>{`
        @keyframes ui404-shake {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-5px, 2px); }
          30% { transform: translate(5px, -2px); }
          45% { transform: translate(-4px, 2px); }
          60% { transform: translate(4px, -1px); }
          80% { transform: translate(-2px, 1px); }
        }
        @keyframes ui404-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5%); }
        }
      `}</style>
      <div className="w-full">
        <div
          ref={areaRef}
          onPointerDown={(e) => {
            if (e.target instanceof HTMLElement && e.target.closest("button")) return;
            jump();
          }}
          className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl"
          style={{
            aspectRatio: `${GAME_W} / ${GAME_H}`,
            touchAction: "manipulation",
            backgroundColor: palette.sky,
            color: palette.ink,
            transition: "background-color 600ms ease, color 600ms ease",
            animation: shake ? "ui404-shake 0.42s ease-in-out" : undefined,
          }}
          role="application"
          aria-label="Running dog jumping game"
          data-mode={dim}
        >
          {/* Distant hills (back layer) */}
          {hills
            .filter((h) => h.layer === 0)
            .map((h) => (
              <div
                key={h.id}
                className="absolute"
                style={{
                  left: `${(h.x / GAME_W) * 100}%`,
                  top: `${((GROUND_Y - h.h) / GAME_H) * 100}%`,
                  width: `${(h.w / GAME_W) * 100}%`,
                  height: `${(h.h / GAME_H) * 100}%`,
                  background: palette.hillBack,
                  borderTopLeftRadius: "50%",
                  borderTopRightRadius: "50%",
                  opacity: 0.55,
                }}
              />
            ))}
          {/* Closer hills (front layer) */}
          {hills
            .filter((h) => h.layer === 1)
            .map((h) => (
              <div
                key={h.id}
                className="absolute"
                style={{
                  left: `${(h.x / GAME_W) * 100}%`,
                  top: `${((GROUND_Y - h.h) / GAME_H) * 100}%`,
                  width: `${(h.w / GAME_W) * 100}%`,
                  height: `${(h.h / GAME_H) * 100}%`,
                  background: palette.hillFront,
                  borderTopLeftRadius: "50%",
                  borderTopRightRadius: "50%",
                  opacity: 0.8,
                }}
              />
            ))}

          {/* Clouds */}
          {clouds.map((c) => (
            <div
              key={c.id}
              className="absolute"
              style={{
                left: `${(c.x / GAME_W) * 100}%`,
                top: `${(c.y / GAME_H) * 100}%`,
                width: `${(c.w / GAME_W) * 100}%`,
                height: `${(10 / GAME_H) * 100}%`,
              }}
            >
              <svg viewBox="0 0 44 14" width="100%" height="100%" preserveAspectRatio="none">
                <rect x="4" y="6" width="36" height="6" fill={palette.cloud} />
                <rect x="8" y="2" width="14" height="4" fill={palette.cloud} />
                <rect x="22" y="0" width="12" height="6" fill={palette.cloud} />
                <rect x="4" y="12" width="36" height="2" fill={palette.cloudShadow} />
              </svg>
            </div>
          ))}

          {/* score readout — top-right */}
          <div
            className="absolute top-2 right-3 font-mono text-[12px] sm:text-[13px] tracking-[0.18em] tabular-nums z-10"
            style={{ color: palette.textMuted }}
          >
            <span className="mr-3 opacity-70">HI {String(highScore).padStart(5, "0")}</span>
            <span style={{ color: palette.textPrimary }}>
              {String(score).padStart(5, "0")}
            </span>
          </div>

          {/* mute toggle — top-left, doesn't trigger jump (button blocks pointer) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const next = !muted;
              sfx.setMuted(next);
              setMuted(next);
            }}
            className="absolute top-2 left-2 z-10 inline-flex items-center justify-center rounded-md p-1.5 transition-colors"
            style={{ color: palette.textMuted, background: "transparent" }}
            aria-label={muted ? "Unmute game sounds" : "Mute game sounds"}
            title={muted ? "Sound off" : "Sound on"}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* ground line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${(GROUND_Y / GAME_H) * 100}%`,
              height: `${(2 / GAME_H) * 100}%`,
              background: palette.ground,
            }}
          />

          {/* ground ticks — scrolling dashed pattern below the ground line */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${((GROUND_Y + 4) / GAME_H) * 100}%`,
              height: `${(3 / GAME_H) * 100}%`,
              backgroundImage: `repeating-linear-gradient(90deg, ${palette.groundTick} 0 6px, transparent 6px 24px)`,
              backgroundPositionX: `-${groundOffset}px`,
              opacity: 0.65,
            }}
          />

          {/* dog */}
          <div
            className="absolute"
            style={{
              left: `${(DINO_X / GAME_W) * 100}%`,
              top: `${(dinoCurrentTop / GAME_H) * 100}%`,
              width: `${(dinoCurrentW / GAME_W) * 100}%`,
              height: `${(dinoCurrentH / GAME_H) * 100}%`,
              animation:
                status !== "running" && !airborne
                  ? "ui404-bob 1.6s ease-in-out infinite"
                  : undefined,
            }}
          >
            <DogSprite
              ducking={ducking}
              legFrame={legFrame}
              dead={status === "over"}
              airborne={airborne}
            />
          </div>

          {/* obstacles */}
          {obstacles.map((o) => {
            const d = OBS_DIMS[o.kind];
            return (
              <div
                key={o.id}
                className="absolute"
                style={{
                  left: `${(o.x / GAME_W) * 100}%`,
                  top: `${(d.topY / GAME_H) * 100}%`,
                  width: `${(d.w / GAME_W) * 100}%`,
                  height: `${(d.h / GAME_H) * 100}%`,
                }}
              >
                <ObstacleSprite kind={o.kind} flap={flap} />
              </div>
            );
          })}

          {/* dust particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-sm"
              style={{
                left: `${(p.x / GAME_W) * 100}%`,
                top: `${(p.y / GAME_H) * 100}%`,
                width: `${(p.size / GAME_W) * 100}%`,
                height: `${(p.size / GAME_H) * 100}%`,
                background: palette.groundTick,
                opacity: Math.max(0, Math.min(1, p.life / 400)),
              }}
            />
          ))}

          {/* overlays */}
          {status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="text-sm font-medium"
                style={{ color: palette.textPrimary }}
              >
                Press{" "}
                <kbd
                  className="px-1.5 py-0.5 border rounded text-[11px] font-mono"
                  style={{
                    background: palette.sky,
                    borderColor: palette.textMuted,
                    color: palette.textPrimary,
                  }}
                >
                  Space
                </kbd>{" "}
                or tap to play
              </div>
              <div className="text-[11px] mt-1" style={{ color: palette.textMuted }}>
                ↑ jump · ↓ duck
              </div>
            </div>
          )}
          {status === "over" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="text-base font-bold tracking-[0.18em]"
                style={{ color: palette.textPrimary }}
              >
                G A M E&nbsp;&nbsp;O V E R
              </div>
              <div className="text-[11px] mt-2" style={{ color: palette.textMuted }}>
                tap or press Space to retry
              </div>
            </div>
          )}
        </div>

        {/* Touch controls — mobile users had no way to duck before. */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:hidden">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              jump();
            }}
            className="rounded-xl bg-slate-900 text-white font-semibold py-3 active:scale-[0.97] transition-transform shadow-sm"
            aria-label="Jump"
          >
            ▲ Jump
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              duck(true);
            }}
            onPointerUp={() => duck(false)}
            onPointerCancel={() => duck(false)}
            onPointerLeave={() => duck(false)}
            className="rounded-xl bg-slate-200 text-slate-900 font-semibold py-3 active:scale-[0.97] transition-transform"
            aria-label="Duck"
          >
            ▼ Duck
          </button>
        </div>
      </div>
    </>
  );
};

const NotFound = () => {
  usePageSEO(SEO_TITLES.NOT_FOUND);
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-10">
      <div className="w-full max-w-2xl">
        <DinoGame />

        <div className="text-center mt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Page not found
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[12px] font-mono text-slate-700">
              {location.pathname}
            </code>{" "}
            doesn't exist.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-7 h-11 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
