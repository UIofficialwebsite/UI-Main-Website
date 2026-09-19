import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';

/**
 * The same player the SSP portal uses, so a lecture here behaves and looks the
 * way it does inside the portal.
 *
 * Why it is built this way rather than as a plain <iframe src="…/embed/ID">:
 * a default embed paints YouTube's own chrome over the video — the video title,
 * the share button and "Watch on YouTube" — and every one of those is a link
 * straight to the video. So instead we
 *
 *   1. mount through the IFrame API with YouTube's UI switched off
 *      (controls / modestbranding / showinfo / fs / disablekb / iv_load_policy),
 *   2. cover the whole frame with a transparent layer that swallows every
 *      click, so nothing of YouTube's is reachable even if it does paint, and
 *   3. drive playback from our own control bar underneath.
 *
 * HONEST LIMIT: the video id still lives in the page for anyone who opens
 * devtools — that is true of any YouTube embed, including the portal's. This
 * closes the casual path (right-click, share button, "Watch on YouTube"), not
 * the determined one. Only moving off YouTube to signed, expiring delivery
 * closes that, which is tracked separately.
 */

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Loads the IFrame API once per page and resolves when it is usable. */
let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface Props {
  /** A bare YouTube id. */
  videoId?: string;
  /** Fallback for anything not on YouTube (e.g. a Drive preview). */
  url?: string;
  title: string;
}

const SecureVideoPlayer: React.FC<Props> = ({ videoId, url, title }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let poll: number | undefined;

    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;

      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,          // no YouTube control bar
          modestbranding: 1,    // no YouTube wordmark
          rel: 0,               // no related videos at the end
          showinfo: 0,          // no title overlay
          iv_load_policy: 3,    // no annotation cards
          fs: 0,                // no YouTube fullscreen button
          disablekb: 1,         // no keyboard shortcuts into YouTube
          playsinline: 1,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (cancelled) return;
            playerRef.current = e.target;
            setDuration(e.target.getDuration());
            setReady(true);
            e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (e.data === 1) setPlaying(true);
            if (e.data === 2 || e.data === 0) setPlaying(false);
          },
        },
      }) as unknown as YTPlayer;

      poll = window.setInterval(() => {
        const p = playerRef.current;
        if (!p?.getCurrentTime) return;
        setCurrent(p.getCurrentTime());
        const d = p.getDuration();
        if (d && d !== duration) setDuration(d);
      }, 500);
    });

    return () => {
      cancelled = true;
      if (poll) window.clearInterval(poll);
      try { playerRef.current?.destroy(); } catch { /* already gone */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    playing ? p.pauseVideo() : p.playVideo();
  }, [playing]);

  const skip = useCallback((by: number) => {
    const p = playerRef.current;
    if (!p) return;
    const t = Math.max(0, Math.min(p.getCurrentTime() + by, duration || Infinity));
    p.seekTo(t, true);
    setCurrent(t);
  }, [duration]);

  const scrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    playerRef.current?.seekTo(t, true);
    setCurrent(t);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    muted ? p.unMute() : p.mute();
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!wrapRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current.requestFullscreen?.();
  };

  // Not a YouTube video (a Drive preview, say) — no chrome to hide, so a plain
  // frame is fine. The click blocker still stops the Drive "open in new tab".
  if (!videoId) {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe src={url} title={title} className="h-full w-full border-0" allowFullScreen />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="w-full select-none bg-black" onContextMenu={(e) => e.preventDefault()}>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <div ref={hostRef} className="pointer-events-none h-full w-full" />

        {/* Swallows every click so nothing of YouTube's chrome is reachable. */}
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={toggle}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent"
        />

        {!ready && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          </div>
        )}
      </div>

      {/* Our own controls */}
      <div className="flex items-center gap-3 bg-black px-4 py-3 text-white">
        <button type="button" onClick={toggle} className="shrink-0 transition-opacity hover:opacity-70" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
        </button>
        <button type="button" onClick={() => skip(-10)} className="shrink-0 transition-opacity hover:opacity-70" aria-label="Back 10 seconds">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => skip(10)} className="shrink-0 transition-opacity hover:opacity-70" aria-label="Forward 10 seconds">
          <RotateCw className="h-4 w-4" />
        </button>

        <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/70">{fmt(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={current}
          onChange={scrub}
          aria-label="Seek"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
        />
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/70">{fmt(duration)}</span>

        <button type="button" onClick={toggleMute} className="shrink-0 transition-opacity hover:opacity-70" aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button type="button" onClick={toggleFullscreen} className="shrink-0 transition-opacity hover:opacity-70" aria-label="Fullscreen">
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default SecureVideoPlayer;
