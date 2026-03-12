import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { 
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, 
  List, Expand, X, Volume2, VolumeX, Settings 
} from 'lucide-react';

interface TimelineItem {
  time: number;
  label: string;
}

const STORAGE_KEY = 'video_player_state';

interface PlayerState {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  showTimeline: boolean;
  isFullscreen: boolean;
  timestamp: number;
}

const VideoPlayer = ({ videoId, title, onClose, timelines = [] }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<number>(0);
  const isRestoringRef = useRef(false);
  const wasPlayingBeforeHiddenRef = useRef(false);
  const wasFullscreenBeforeHiddenRef = useRef(false);
  const savedTimeRef = useRef<number>(0);
  const playerReadyRef = useRef(false);
  const isTabSwitchingRef = useRef(false);
  const freezeLayoutRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHUD, setShowHUD] = useState(true);
  const [showTimeline, setShowTimeline] = useState(() => sessionStorage.getItem('pw_timeline_state') === 'true');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [layoutFrozen, setLayoutFrozen] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimeline = () => {
    const next = !showTimeline;
    setShowTimeline(next);
    sessionStorage.setItem('pw_timeline_state', String(next));
  };

  const handleMouseMove = () => {
    setShowHUD(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isPlaying) hideTimer.current = setTimeout(() => setShowHUD(false), 3000);
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    const state = playerRef.current.getPlayerState();
    if (state === 1) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  // Save current player state to sessionStorage
  const savePlayerState = useCallback(() => {
    if (!playerRef.current || !playerReadyRef.current) return;
    
    try {
      const time = playerRef.current.getCurrentTime?.() || 0;
      const volume = playerRef.current.getVolume?.() || 100;
      const playing = playerRef.current.getPlayerState?.() === 1;
      const isFullscreen = !!document.fullscreenElement;
      
      const state: PlayerState = {
        videoId,
        currentTime: time,
        isPlaying: playing,
        volume,
        showTimeline,
        isFullscreen,
        timestamp: Date.now(),
      };
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      savedTimeRef.current = time;
      wasFullscreenBeforeHiddenRef.current = isFullscreen;
    } catch (e) {
      // Ignore storage errors
    }
  }, [videoId, showTimeline]);

  // Restore player state from sessionStorage
  const restorePlayerState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const state: PlayerState = JSON.parse(stored);
      
      // Only restore if same video and state is recent (within 30 minutes)
      if (state.videoId === videoId && Date.now() - state.timestamp < 30 * 60 * 1000) {
        return state;
      }
    } catch (e) {
      // Ignore parse errors
    }
    return null;
  }, [videoId]);

  // Handle visibility change (tab switch) - with layout freeze
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab is being hidden - freeze layout and save state
        isTabSwitchingRef.current = true;
        freezeLayoutRef.current = true;
        setLayoutFrozen(true);
        
        // Save fullscreen state before it might be lost
        wasFullscreenBeforeHiddenRef.current = !!document.fullscreenElement;
        
        if (playerRef.current && playerReadyRef.current) {
          const state = playerRef.current.getPlayerState?.();
          wasPlayingBeforeHiddenRef.current = state === 1;
          savedTimeRef.current = playerRef.current.getCurrentTime?.() || 0;
          savePlayerState();
          
          // Pause the video to prevent background playback issues
          if (state === 1) {
            playerRef.current.pauseVideo();
          }
        }
        setIsVisible(false);
      } else if (document.visibilityState === 'visible') {
        // Tab is visible again - keep layout frozen during restore
        setIsVisible(true);
        
        if (playerRef.current && playerReadyRef.current) {
          isRestoringRef.current = true;
          
          // Seek to saved position first
          if (savedTimeRef.current > 0) {
            playerRef.current.seekTo(savedTimeRef.current, true);
            setCurrentTime(savedTimeRef.current);
            if (duration > 0) {
              setProgress((savedTimeRef.current / duration) * 100);
            }
          }
          
          // Resume playback if it was playing before
          if (wasPlayingBeforeHiddenRef.current) {
            setTimeout(() => {
              playerRef.current?.playVideo();
            }, 50);
          }
          
          // Restore fullscreen if it was active before
          if (wasFullscreenBeforeHiddenRef.current && !document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen?.().catch(() => {
              // Fullscreen request may fail, ignore
            });
          }
          
          // Unfreeze layout after restoration is complete
          setTimeout(() => {
            isRestoringRef.current = false;
            isTabSwitchingRef.current = false;
            freezeLayoutRef.current = false;
            setLayoutFrozen(false);
          }, 200);
        } else {
          // No player, just unfreeze
          setTimeout(() => {
            isTabSwitchingRef.current = false;
            freezeLayoutRef.current = false;
            setLayoutFrozen(false);
          }, 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [duration, savePlayerState]);

  // Prevent fullscreen exit during tab switches
  useEffect(() => {
    const handleFullscreenChange = () => {
      // If we're in a tab switch and fullscreen was exited, try to restore it
      if (isTabSwitchingRef.current && wasFullscreenBeforeHiddenRef.current && !document.fullscreenElement) {
        // Prevent the exit by re-requesting fullscreen
        if (containerRef.current && document.visibilityState === 'visible') {
          containerRef.current.requestFullscreen?.().catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle window blur/focus
  useEffect(() => {
    const handleBlur = () => {
      freezeLayoutRef.current = true;
      setLayoutFrozen(true);
      wasFullscreenBeforeHiddenRef.current = !!document.fullscreenElement;
      
      if (playerRef.current && playerReadyRef.current) {
        const state = playerRef.current.getPlayerState?.();
        wasPlayingBeforeHiddenRef.current = state === 1;
        savedTimeRef.current = playerRef.current.getCurrentTime?.() || 0;
        savePlayerState();
      }
    };

    const handleFocus = () => {
      if (playerRef.current && playerReadyRef.current && savedTimeRef.current > 0) {
        isRestoringRef.current = true;
        playerRef.current.seekTo(savedTimeRef.current, true);
        setCurrentTime(savedTimeRef.current);
        if (duration > 0) {
          setProgress((savedTimeRef.current / duration) * 100);
        }
        
        if (wasPlayingBeforeHiddenRef.current) {
          setTimeout(() => {
            playerRef.current?.playVideo();
          }, 50);
        }
        
        // Restore fullscreen if needed
        if (wasFullscreenBeforeHiddenRef.current && !document.fullscreenElement && containerRef.current) {
          containerRef.current.requestFullscreen?.().catch(() => {});
        }
        
        setTimeout(() => {
          isRestoringRef.current = false;
          freezeLayoutRef.current = false;
          setLayoutFrozen(false);
        }, 200);
      } else {
        setTimeout(() => {
          freezeLayoutRef.current = false;
          setLayoutFrozen(false);
        }, 100);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [duration, savePlayerState]);

  // Save state periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isPlaying && !isRestoringRef.current) {
        savePlayerState();
      }
    }, 2000);

    return () => clearInterval(saveInterval);
  }, [isPlaying, savePlayerState]);

  // Initialize YouTube player
  useEffect(() => {
    const savedState = restorePlayerState();
    
    const init = () => {
      playerRef.current = new (window as any).YT.Player('pw-strict-engine', {
        videoId: videoId,
        playerVars: {
          autoplay: savedState ? 0 : 1, // Don't autoplay if restoring
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          start: savedState ? Math.floor(savedState.currentTime) : undefined,
        },
        events: {
          onReady: (e) => {
            playerReadyRef.current = true;
            setDuration(e.target.getDuration());
            
            // Restore saved state on ready
            if (savedState) {
              e.target.seekTo(savedState.currentTime, true);
              setCurrentTime(savedState.currentTime);
              savedTimeRef.current = savedState.currentTime;
              
              if (savedState.volume !== undefined) {
                e.target.setVolume(savedState.volume);
              }
              
              // Restore playback state
              if (savedState.isPlaying) {
                setTimeout(() => {
                  e.target.playVideo();
                }, 200);
              }
              
              setHasStarted(true);
            }
          },
          onStateChange: (e) => {
            if (isRestoringRef.current) return; // Ignore state changes during restoration
            
            setIsPlaying(e.data === 1);
            if (e.data === 1) { 
              setHasStarted(true); 
              handleMouseMove(); 
            } else {
              setShowHUD(true);
            }
          }
        }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = init;
    } else init();

    const track = setInterval(() => {
      if (playerRef.current?.getCurrentTime && !isRestoringRef.current) {
        const c = playerRef.current.getCurrentTime();
        setCurrentTime(c);
        savedTimeRef.current = c;
        if (duration > 0) setProgress((c / duration) * 100);
      }
    }, 500);

    return () => { 
      clearInterval(track); 
      savePlayerState();
      playerReadyRef.current = false;
      playerRef.current?.destroy(); 
    };
  }, [videoId, duration, restorePlayerState, savePlayerState]);

  // Save state before unmount or when closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePlayerState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savePlayerState]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
      className={`fixed inset-0 z-[9999] bg-black flex overflow-hidden font-sans select-none text-white ${showHUD ? '' : 'cursor-none'}`}
      style={{ 
        // Prevent layout shifts during visibility changes
        contain: 'layout style paint size',
        willChange: layoutFrozen ? 'contents' : 'auto',
        // Keep dimensions locked during tab switch
        ...(layoutFrozen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }),
      }}
    >
      <div 
        className="relative flex-1 bg-black overflow-hidden flex items-center justify-center"
        style={{
          // Maintain stable dimensions - never collapse
          minHeight: '100%',
          minWidth: 0,
          height: '100%',
          width: '100%',
          contain: 'strict',
        }}
      >
        
        {/* Video container with stable layout - no transitions during restore */}
        <div 
          className={`absolute inset-0 pointer-events-none ${layoutFrozen ? '' : 'transition-opacity duration-300'} ${hasStarted ? 'opacity-100' : 'opacity-0'}`}
          style={{
            // Prevent reflow during tab switches
            contain: 'strict',
            // Disable will-change during frozen state to prevent repaints
            willChange: layoutFrozen ? 'auto' : (isVisible ? 'auto' : 'opacity'),
            // Lock dimensions
            position: 'absolute',
            inset: 0,
          }}
        >
          <div className="w-full h-full scale-[1.35] origin-center pointer-events-none">
            <div id="pw-strict-engine" className="w-full h-full pointer-events-none" />
          </div>
        </div>

        {/* Click interceptor */}
        <div 
          className="absolute inset-0 z-10 cursor-pointer pointer-events-auto" 
          onClick={(e) => {
             const now = Date.now();
             if (now - lastTap.current < 300) {
               const rect = e.currentTarget.getBoundingClientRect();
               if (e.clientX - rect.left > rect.width / 2) playerRef.current?.seekTo(currentTime + 10);
               else playerRef.current?.seekTo(currentTime - 10);
             } else togglePlayPause();
             lastTap.current = now;
          }}
        />

        {/* HUD Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
          <div className={`w-full bg-black h-16 flex items-center px-8 border-b border-white/10 transition-all duration-500 transform pointer-events-auto ${showHUD ? '' : '-translate-y-full'}`}>
            <button onClick={() => { savePlayerState(); onClose(); }}><ArrowLeft size={28} /></button>
            <h1 className="ml-6 text-lg font-bold truncate">{title}</h1>
          </div>

          <div className={`w-full bg-black h-32 flex flex-col justify-center px-10 border-t border-white/10 transition-all duration-500 transform pointer-events-auto ${showHUD ? '' : 'translate-y-full'}`}>
            <div className="w-full">
              <div className="relative w-full h-1 bg-white/20 rounded-full mb-6 cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const newTime = ((e.clientX - rect.left) / rect.width) * duration;
                playerRef.current?.seekTo(newTime);
                savedTimeRef.current = newTime;
              }}>
                <div className="absolute h-full bg-[#5a4bda] rounded-full transition-none" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-10">
                  <button onClick={togglePlayPause}>{isPlaying ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" />}</button>
                  <RotateCcw size={26} onClick={() => { 
                    const newTime = currentTime - 10;
                    playerRef.current?.seekTo(newTime);
                    savedTimeRef.current = newTime;
                  }} />
                  <RotateCw size={26} onClick={() => { 
                    const newTime = currentTime + 10;
                    playerRef.current?.seekTo(newTime);
                    savedTimeRef.current = newTime;
                  }} />
                  <span className="text-sm font-bold opacity-70 tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <List size={28} className={showTimeline ? 'text-[#5a4bda]' : ''} onClick={toggleTimeline} />
                  <Expand size={28} onClick={() => document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen()} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTimeline && (
        <aside className="w-[400px] h-full bg-white text-black z-40 border-l border-gray-100 flex flex-col">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <span className="font-extrabold text-xl uppercase">Timeline</span>
            <X size={20} className="cursor-pointer opacity-40" onClick={toggleTimeline} />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {timelines.map((item, i) => (
              <div key={i} className="group p-4 hover:bg-[#f8f7ff] cursor-pointer rounded-2xl flex justify-between items-center transition-all" onClick={() => {
                playerRef.current?.seekTo(item.time);
                savedTimeRef.current = item.time;
              }}>
                <span className="font-bold text-gray-700">{item.label}</span>
                <span className="text-[#5a4bda] font-black bg-[#5a4bda]/5 px-3 py-1 rounded-lg text-xs">{formatTime(item.time)}</span>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default VideoPlayer;
