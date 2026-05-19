import { useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

// Chrome-dino-style runner. Logical coordinates are in a fixed 620×160 grid;
// every entity is positioned via percentages so the canvas scales fluidly
// inside its rounded card while collision math stays in pixel units.
const GAME_W = 620;
const GAME_H = 160;
const GROUND_Y = 132;
const DINO_X = 36;
const DINO_W = 44;
const DINO_H = 47;
const DUCK_W = 60;
const DUCK_H = 28;
const GRAVITY = 0.0021;
const JUMP_V = 0.82;
const FAST_FALL_V = 0.6;
const HS_KEY = "ui-404-dino-highscore";
const FG = "#535353";

type ObsKind = "cactus-s" | "cactus-m" | "cactus-l" | "bird-low" | "bird-high";

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

const pickKind = (speed: number): ObsKind => {
  const birdsAllowed = speed > 0.42;
  const r = Math.random();
  if (r < 0.34) return "cactus-s";
  if (r < 0.58) return "cactus-m";
  if (r < 0.72) return "cactus-l";
  if (!birdsAllowed) return "cactus-s";
  return r < 0.86 ? "bird-low" : "bird-high";
};

const DinoSprite = ({
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
  const fill = dead ? "#9ca3af" : FG;
  const lf: 0 | 1 = airborne ? 0 : legFrame;
  if (ducking) {
    return (
      <svg viewBox="0 0 60 28" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
        <rect x="0" y="14" width="6" height="3" fill={fill} />
        <rect x="6" y="11" width="6" height="6" fill={fill} />
        <rect x="12" y="9" width="32" height="11" fill={fill} />
        <rect x="44" y="7" width="14" height="11" fill={fill} />
        <rect x="58" y="10" width="2" height="3" fill={fill} />
        <rect x="53" y="9" width="2" height="2" fill="#ffffff" />
        {lf === 0 ? (
          <>
            <rect x="16" y="20" width="3" height="6" fill={fill} />
            <rect x="22" y="20" width="3" height="4" fill={fill} />
            <rect x="15" y="26" width="5" height="2" fill={fill} />
          </>
        ) : (
          <>
            <rect x="16" y="20" width="3" height="4" fill={fill} />
            <rect x="22" y="20" width="3" height="6" fill={fill} />
            <rect x="21" y="26" width="5" height="2" fill={fill} />
          </>
        )}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 44 47" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      <rect x="22" y="0" width="20" height="14" fill={fill} />
      <rect x="42" y="3" width="2" height="6" fill={fill} />
      <rect x="38" y="10" width="4" height="2" fill="#ffffff" />
      <rect x="36" y="4" width="2" height="2" fill="#ffffff" />
      <rect x="14" y="14" width="22" height="6" fill={fill} />
      <rect x="6" y="20" width="26" height="11" fill={fill} />
      <rect x="0" y="22" width="6" height="4" fill={fill} />
      <rect x="22" y="26" width="3" height="2" fill={fill} />
      {lf === 0 ? (
        <>
          <rect x="12" y="31" width="4" height="12" fill={fill} />
          <rect x="11" y="43" width="6" height="3" fill={fill} />
          <rect x="20" y="31" width="4" height="8" fill={fill} />
          <rect x="20" y="39" width="6" height="3" fill={fill} />
        </>
      ) : (
        <>
          <rect x="12" y="31" width="4" height="8" fill={fill} />
          <rect x="12" y="39" width="6" height="3" fill={fill} />
          <rect x="20" y="31" width="4" height="12" fill={fill} />
          <rect x="19" y="43" width="6" height="3" fill={fill} />
        </>
      )}
    </svg>
  );
};

const CactusSmall = () => (
  <svg viewBox="0 0 17 35" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
    <rect x="6" y="0" width="5" height="35" fill={FG} />
    <rect x="0" y="10" width="6" height="3" fill={FG} />
    <rect x="0" y="13" width="3" height="6" fill={FG} />
    <rect x="11" y="6" width="6" height="3" fill={FG} />
    <rect x="14" y="9" width="3" height="5" fill={FG} />
  </svg>
);

const CactusMedium = () => (
  <svg viewBox="0 0 25 50" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
    <rect x="10" y="0" width="6" height="50" fill={FG} />
    <rect x="0" y="15" width="10" height="4" fill={FG} />
    <rect x="0" y="19" width="4" height="11" fill={FG} />
    <rect x="16" y="10" width="9" height="4" fill={FG} />
    <rect x="21" y="14" width="4" height="9" fill={FG} />
  </svg>
);

const CactusCluster = () => (
  <svg viewBox="0 0 50 35" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
    <rect x="5" y="3" width="5" height="32" fill={FG} />
    <rect x="0" y="12" width="5" height="3" fill={FG} />
    <rect x="10" y="10" width="5" height="3" fill={FG} />
    <rect x="22" y="6" width="5" height="29" fill={FG} />
    <rect x="17" y="14" width="5" height="3" fill={FG} />
    <rect x="27" y="11" width="5" height="3" fill={FG} />
    <rect x="40" y="0" width="5" height="35" fill={FG} />
    <rect x="35" y="10" width="5" height="3" fill={FG} />
    <rect x="45" y="6" width="5" height="3" fill={FG} />
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
    <rect x="14" y={flap === 0 ? "18" : "12"} width="20" height="6" fill={FG} />
    {/* head + beak */}
    <rect x="32" y={flap === 0 ? "14" : "8"} width="8" height="6" fill={FG} />
    <rect x="40" y={flap === 0 ? "16" : "10"} width="6" height="3" fill={FG} />
    {/* eye */}
    <rect x="36" y={flap === 0 ? "16" : "10"} width="2" height="2" fill="#ffffff" />
    {/* tail */}
    <rect x="10" y={flap === 0 ? "20" : "14"} width="4" height="3" fill={FG} />
    {/* wings */}
    {flap === 0 ? (
      <>
        <rect x="16" y="24" width="14" height="4" fill={FG} />
        <rect x="18" y="28" width="12" height="3" fill={FG} />
        <rect x="20" y="31" width="8" height="3" fill={FG} />
      </>
    ) : (
      <>
        <rect x="14" y="2" width="14" height="3" fill={FG} />
        <rect x="16" y="5" width="12" height="3" fill={FG} />
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

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const start = useCallback(() => {
    setScore(0);
    setObstacles([]);
    setDucking(false);
    setDinoY(0);
    obstaclesRef.current = [];
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
    }
  }, [start]);

  const duck = useCallback((on: boolean) => {
    if (statusRef.current !== "running") return;
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
      setScore(Math.floor(scoreRef.current));

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

  return (
    <div
      ref={areaRef}
      onPointerDown={(e) => {
        if (e.target instanceof HTMLElement && e.target.closest("button")) return;
        jump();
      }}
      className="relative w-full bg-[#fafafa] cursor-pointer select-none"
      style={{ aspectRatio: `${GAME_W} / ${GAME_H}`, touchAction: "manipulation" }}
      role="application"
      aria-label="Dinosaur jumping game"
    >
      {/* score readout */}
      <div className="absolute top-2 right-3 font-mono text-[12px] sm:text-[13px] tracking-[0.18em] text-slate-500 tabular-nums z-10">
        <span className="mr-3 text-slate-400">HI {String(highScore).padStart(5, "0")}</span>
        <span className="text-slate-700">{String(score).padStart(5, "0")}</span>
      </div>

      {/* ground line */}
      <div
        className="absolute left-0 right-0 bg-slate-400"
        style={{
          top: `${(GROUND_Y / GAME_H) * 100}%`,
          height: `${(2 / GAME_H) * 100}%`,
        }}
      />

      {/* dino */}
      <div
        className="absolute"
        style={{
          left: `${(DINO_X / GAME_W) * 100}%`,
          top: `${(dinoCurrentTop / GAME_H) * 100}%`,
          width: `${(dinoCurrentW / GAME_W) * 100}%`,
          height: `${(dinoCurrentH / GAME_H) * 100}%`,
        }}
      >
        <DinoSprite
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

      {/* overlays */}
      {status === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-slate-700 text-sm font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-mono">Space</kbd> or tap to play
          </div>
          <div className="text-[11px] text-slate-400 mt-1">↑ jump · ↓ duck</div>
        </div>
      )}
      {status === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-slate-800 text-base font-bold tracking-[0.18em]">G A M E&nbsp;&nbsp;O V E R</div>
          <div className="text-[11px] text-slate-500 mt-2">tap or press Space to retry</div>
        </div>
      )}
    </div>
  );
};

const NotFound = () => {
  usePageSEO(SEO_TITLES.NOT_FOUND);
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_-12px_rgba(15,23,42,0.15)] overflow-hidden">
          <DinoGame />
        </div>

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
