import { useLocation, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Play, RotateCcw } from "lucide-react";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";
import { cn } from "@/lib/utils";

// MCQ catcher — a 45-second mini-game. Player tray slides at the bottom
// (← →, A/D, or pointer drag); green letter bubbles score +1, red −1.
// Coordinates live in a fixed GAME_W × GAME_H grid; the game area is
// styled with aspect-ratio so it scales fluidly inside its column.
const GAME_W = 320;
const GAME_H = 360;
const PLAYER_W = 76;
const PLAYER_H = 14;
const PLAYER_Y = 332;
const ITEM_SIZE = 30;
const ROUND_SECONDS = 45;
const HS_KEY = "ui-404-mcq-highscore";
const LETTERS = ["A", "B", "C", "D"] as const;

type Item = {
  id: number;
  x: number;
  y: number;
  vy: number;
  letter: (typeof LETTERS)[number];
  good: boolean;
};

const MCQCatcher = () => {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [items, setItems] = useState<Item[]>([]);
  const [playerX, setPlayerX] = useState((GAME_W - PLAYER_W) / 2);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(HS_KEY) || "0", 10) || 0;
    } catch {
      return 0;
    }
  });
  const [hasPlayed, setHasPlayed] = useState(false);

  const playerXRef = useRef(playerX);
  const itemsRef = useRef<Item[]>([]);
  const scoreRef = useRef(0);
  const runningRef = useRef(false);
  const lastSpawnRef = useRef(0);
  const lastFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const areaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const start = useCallback(() => {
    setScore(0);
    setTime(ROUND_SECONDS);
    setItems([]);
    itemsRef.current = [];
    setPlayerX((GAME_W - PLAYER_W) / 2);
    lastSpawnRef.current = 0;
    lastFrameRef.current = performance.now();
    setHasPlayed(true);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    setItems([]);
    itemsRef.current = [];
    if (scoreRef.current > highScore) {
      try {
        localStorage.setItem(HS_KEY, String(scoreRef.current));
      } catch {
        /* localStorage blocked — non-fatal */
      }
      setHighScore(scoreRef.current);
    }
  }, [highScore]);

  // Arrow-key + WASD control. Only active while a round is running so we
  // don't hijack scroll for users who aren't playing.
  useEffect(() => {
    if (!running) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysRef.current.left = true;
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysRef.current.right = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keysRef.current.left = false;
      keysRef.current.right = false;
    };
  }, [running]);

  // Pointer drag — translate viewport coordinates back into GAME_W space
  // by scaling against the rendered width of the game area.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    let dragging = false;
    const setFromX = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const local = ((clientX - rect.left) / rect.width) * GAME_W;
      const next = Math.max(0, Math.min(GAME_W - PLAYER_W, local - PLAYER_W / 2));
      setPlayerX(next);
    };
    const onDown = (e: PointerEvent) => {
      if (!runningRef.current) return;
      dragging = true;
      el.setPointerCapture?.(e.pointerId);
      setFromX(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) setFromX(e.clientX);
    };
    const onUp = () => {
      dragging = false;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Main loop — advances player, spawns answers, resolves collisions.
  useEffect(() => {
    if (!running) return;
    const tick = (now: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(50, now - (lastFrameRef.current || now));
      lastFrameRef.current = now;

      let nextX = playerXRef.current;
      if (keysRef.current.left) nextX -= 0.42 * dt;
      if (keysRef.current.right) nextX += 0.42 * dt;
      nextX = Math.max(0, Math.min(GAME_W - PLAYER_W, nextX));
      if (nextX !== playerXRef.current) setPlayerX(nextX);

      let next = itemsRef.current;
      lastSpawnRef.current += dt;
      if (lastSpawnRef.current >= 820) {
        lastSpawnRef.current = 0;
        const letter = LETTERS[Math.floor(Math.random() * 4)];
        const good = Math.random() < 0.72;
        next = [
          ...next,
          {
            id: ++idRef.current,
            x: 14 + Math.random() * (GAME_W - 28 - ITEM_SIZE),
            y: -ITEM_SIZE,
            vy: 0.11 + Math.random() * 0.07,
            letter,
            good,
          },
        ];
      }

      const half = ITEM_SIZE / 2;
      const kept: Item[] = [];
      let delta = 0;
      for (const it of next) {
        const ny = it.y + it.vy * dt;
        const cx = it.x + half;
        const cy = ny + half;
        if (
          cy >= PLAYER_Y - 2 &&
          cy <= PLAYER_Y + PLAYER_H + 6 &&
          cx >= nextX &&
          cx <= nextX + PLAYER_W
        ) {
          delta += it.good ? 1 : -1;
          continue;
        }
        if (ny > GAME_H + 30) continue;
        kept.push({ ...it, y: ny });
      }
      itemsRef.current = kept;
      setItems(kept);
      if (delta !== 0) setScore((s) => Math.max(0, s + delta));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  // Countdown — 1s ticks, ends the round at zero.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTime((s) => {
        if (s <= 1) {
          stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, stop]);

  // Auto-pause if the tab is hidden so the user doesn't return to a dead round.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && runningRef.current) stop();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stop]);

  const overlayMode: "intro" | "result" | null = running
    ? null
    : hasPlayed && time === 0
      ? "result"
      : "intro";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
            Quick MCQ
          </div>
          <div className="text-sm font-semibold text-slate-900 truncate">
            Catch the green answers
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
            Score · Best
          </div>
          <div className="text-sm font-semibold text-slate-900 tabular-nums">
            {score} · {highScore}
          </div>
        </div>
      </div>

      <div
        ref={areaRef}
        className="relative bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] [background-size:14px_14px] select-none"
        style={{
          aspectRatio: `${GAME_W} / ${GAME_H}`,
          touchAction: running ? "none" : "auto",
        }}
      >
        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              "absolute rounded-full font-bold flex items-center justify-center text-[13px] shadow-sm",
              it.good
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                : "bg-rose-50 text-rose-700 border border-rose-300"
            )}
            style={{
              left: `${(it.x / GAME_W) * 100}%`,
              top: `${(it.y / GAME_H) * 100}%`,
              width: `${(ITEM_SIZE / GAME_W) * 100}%`,
              aspectRatio: "1 / 1",
            }}
          >
            {it.letter}
          </div>
        ))}

        <div
          className="absolute rounded-full bg-slate-900"
          style={{
            left: `${(playerX / GAME_W) * 100}%`,
            top: `${(PLAYER_Y / GAME_H) * 100}%`,
            width: `${(PLAYER_W / GAME_W) * 100}%`,
            height: `${(PLAYER_H / GAME_H) * 100}%`,
            transition: keysRef.current.left || keysRef.current.right ? "none" : "left 60ms linear",
          }}
        />

        {overlayMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-white/75 backdrop-blur-[2px]">
            {overlayMode === "intro" ? (
              <>
                <div className="text-slate-900 font-semibold text-base">Pop quiz break?</div>
                <div className="text-[12px] text-slate-500 mt-1 mb-5 max-w-[230px] leading-snug">
                  Catch the green letters, dodge the red ones. 45 seconds on the clock.
                </div>
                <button
                  onClick={start}
                  className="inline-flex items-center gap-2 rounded-full bg-royal hover:bg-royal-dark text-white text-sm font-semibold px-5 py-2 transition"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              </>
            ) : (
              <>
                <div className="text-slate-900 font-semibold text-base">Time's up</div>
                <div className="text-[13px] text-slate-600 mt-1 mb-5">
                  You scored <span className="font-semibold text-slate-900">{score}</span>
                  {score >= highScore && score > 0 ? (
                    <span className="ml-1 text-emerald-700 font-medium">— new best</span>
                  ) : (
                    <span className="text-slate-500"> · best {highScore}</span>
                  )}
                </div>
                <button
                  onClick={start}
                  className="inline-flex items-center gap-2 rounded-full bg-royal hover:bg-royal-dark text-white text-sm font-semibold px-5 py-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
        <span>← → keys · or drag</span>
        <span className="font-mono tabular-nums text-slate-600">
          {String(Math.max(0, time)).padStart(2, "0")}s
        </span>
      </div>
    </div>
  );
};

const POINTERS = [
  { to: "/courses", label: "Courses" },
  { to: "/career", label: "Career" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

const NotFound = () => {
  usePageSEO(SEO_TITLES.NOT_FOUND);
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FAF8F2] relative overflow-hidden">
      {/* notebook ruling — soft horizontal lines, anchored to the left margin */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 31px, #e2e1d8 32px), linear-gradient(to right, transparent 70px, #f5c4c4 71px, transparent 72px)",
          backgroundSize: "100% 32px, 100% 100%",
        }}
      />

      <div className="relative container mx-auto px-5 sm:px-8 py-10 lg:py-16 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800 bg-amber-100/80 border border-amber-200 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Off the syllabus
          </div>

          <h1 className="font-extrabold leading-[0.9] tracking-tight select-none flex items-end gap-1">
            <span
              className="inline-block text-[96px] sm:text-[128px] lg:text-[148px] text-royal"
              style={{ transform: "rotate(-4deg)" }}
            >
              4
            </span>
            <span
              className="inline-block text-[96px] sm:text-[128px] lg:text-[148px] text-amber-500"
              style={{ transform: "rotate(3deg) translateY(-6px)" }}
            >
              0
            </span>
            <span
              className="inline-block text-[96px] sm:text-[128px] lg:text-[148px] text-royal"
              style={{ transform: "rotate(-2deg)" }}
            >
              4
            </span>
          </h1>

          <h2 className="text-[22px] sm:text-3xl font-semibold text-slate-900 mt-3">
            This page didn't make the cut-off.
          </h2>
          <svg
            aria-hidden
            className="text-amber-500 mt-1.5 mb-4"
            width="200"
            height="12"
            viewBox="0 0 200 12"
            fill="none"
          >
            <path
              d="M2 7 C 30 1, 60 11, 90 5 S 150 1, 198 6"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>

          <p className="text-slate-600 max-w-md leading-relaxed">
            We couldn't find{" "}
            <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[12px] text-slate-700 font-mono">
              {location.pathname}
            </code>
            . While you decide where to head next, catch a few right answers.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/">
              <Button className="bg-royal hover:bg-royal-dark text-white gap-2">
                <Home className="w-4 h-4" />
                Go home
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back one step
            </Button>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mr-1">
              Or try
            </span>
            {POINTERS.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                className="text-[12px] font-medium text-royal border border-royal/30 hover:bg-royal hover:text-white transition-colors rounded-full px-3 py-1"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[400px] mx-auto lg:justify-self-end">
          <MCQCatcher />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
