import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useGhostConfig } from '../lib/ghostConfig';

interface GhostPosition {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const FLEE_MESSAGES = [
  'Eep! Too close! 👻',
  'Whooosh! 💨',
  'Can’t catch me! 🏃‍♂️💨',
  'Boo! 🎃',
  'Spooky mode activated! 🦇',
  'Did I scare you? 👻',
  'Ahhh human! 😱',
  'Floating away... ✨',
  'Teleporting magic! 🪄',
];

const CATCH_MESSAGES = [
  'Poof! You got me! 👻🎉',
  'Impressive reflexes! 🏆',
  'Ghost Whisperer unlocked! ✨',
  'You caught the Phantom! 🌟',
];

export const PhantomGhost: React.FC = () => {
  const { showToast } = useToast();
  const { isActive, fleeMessages, catchMessages } = useGhostConfig();

  const fleeListRef = useRef(fleeMessages);
  fleeListRef.current = fleeMessages.length > 0 ? fleeMessages : FLEE_MESSAGES;
  const catchListRef = useRef(catchMessages);
  catchListRef.current = catchMessages.length > 0 ? catchMessages : CATCH_MESSAGES;

  const [isDesktop, setIsDesktop] = useState(false);
  const [isFleeing, setIsFleeing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [spookCount, setSpookCount] = useState(0);
  const [catchCount, setCatchCount] = useState(0);
  const [showSpookBadge, setShowSpookBadge] = useState(false);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Physics state refs for 60fps continuous animation
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const posRef = useRef<GhostPosition>({ x: -200, y: -200 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const tiltRef = useRef(0);
  const isFleeingRef = useRef(false);
  const facingLeftRef = useRef(false);
  const lastSpeechTimeRef = useRef(0);
  const lastSoundTimeRef = useRef(0);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTeleportTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context lazily on user interaction
  const getAudioContext = () => {
    if (isMuted) return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Sound Synthesizer Effects
  const playWhooshSound = () => {
    const ctx = getAudioContext();
    if (!ctx || isMuted) return;

    try {
      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.09);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.18);
      filter.Q.value = 3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio context error fallback
    }
  };

  const playSqueakSound = () => {
    const ctx = getAudioContext();
    if (!ctx || isMuted) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.07);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // Audio fallback
    }
  };

  const playTeleportSound = () => {
    const ctx = getAudioContext();
    if (!ctx || isMuted) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio fallback
    }
  };

  const playCatchSound = () => {
    const ctx = getAudioContext();
    if (!ctx || isMuted) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.01, ctx.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.18);
      });
    } catch {
      // Audio fallback
    }
  };

  // Check window size on mount & resize
  useEffect(() => {
    const checkIsDesktop = () => {
      const desktop = window.innerWidth >= 1024 && window.matchMedia('(pointer: fine)').matches;
      setIsDesktop(desktop);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Set initial spawn position on desktop
  useEffect(() => {
    if (!isDesktop) return;

    const initialX = Math.max(100, Math.min(window.innerWidth - 180, window.innerWidth * 0.82));
    const initialY = Math.max(120, Math.min(window.innerHeight - 200, window.innerHeight * 0.35));
    posRef.current = { x: initialX, y: initialY };
    velRef.current = { vx: 0, vy: 0 };

    if (containerRef.current) {
      containerRef.current.style.transform = `translate3d(${initialX}px, ${initialY}px, 0)`;
    }
  }, [isDesktop]);

  // Track cursor position globally in real-time
  useEffect(() => {
    if (!isDesktop || isAsleep) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      mouseRef.current = null;
    };
  }, [isDesktop, isAsleep]);

  // Helper to spawn particle burst
  const spawnBurst = (x: number, y: number, count = 25, spread = 4) => {
    const colors = ['#c084fc', '#f43f5e', '#38bdf8', '#ffffff', '#ec4899', '#a855f7'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 3 + 1) * spread * 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 35 + 20,
      });
    }
  };

  // Perform teleportation to a safe random location
  const triggerTeleport = () => {
    const now = Date.now();
    if (now - lastTeleportTimeRef.current < 2500) return;
    lastTeleportTimeRef.current = now;

    setIsTeleporting(true);
    spawnBurst(posRef.current.x + 32, posRef.current.y + 40, 35, 6);
    playTeleportSound();

    setTimeout(() => {
      const minX = 60;
      const maxX = window.innerWidth - 140;
      const minY = 80;
      const maxY = window.innerHeight - 160;

      const newX = Math.random() > 0.5 ? Math.random() * (maxX * 0.4) + minX : Math.random() * (maxX * 0.4) + maxX * 0.6;
      const newY = Math.random() * (maxY - minY) + minY;

      posRef.current = { x: newX, y: newY };
      velRef.current = { vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 };

      setSpeech('Whoosh! Teleport! 🪄✨');
      setShowSpookBadge(true);
      setTimeout(() => setShowSpookBadge(false), 2000);

      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => setSpeech(null), 2000);

      spawnBurst(newX + 32, newY + 40, 30, 5);
      setIsTeleporting(false);
    }, 280);
  };

  // Real-time physics & canvas rendering animation loop
  useEffect(() => {
    if (!isDesktop || isAsleep) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const minX = 40;
    const maxX = window.innerWidth - 100;
    const minY = 65;
    const maxY = window.innerHeight - 120;

    let prevTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - prevTime) / 16.667, 2.5);
      prevTime = currentTime;

      const ghostCenterX = posRef.current.x + 32;
      const ghostCenterY = posRef.current.y + 40;

      let fleeingNow = false;

      // 1. Proximity repulsion from mouse
      if (mouseRef.current) {
        const dx = ghostCenterX - mouseRef.current.x;
        const dy = ghostCenterY - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);
        const fleeRadius = 150;

        if (dist < fleeRadius && dist > 1) {
          fleeingNow = true;
          const dirX = dx / dist;
          const dirY = dy / dist;

          const strength = (1 - dist / fleeRadius);
          const force = strength * 2.4 * dt;

          velRef.current.vx += dirX * force;
          velRef.current.vy += dirY * force;

          // Trigger subtle sound on swift evasion / whoosh
          const now = Date.now();
          if (strength > 0.6 && now - lastSoundTimeRef.current > 600) {
            lastSoundTimeRef.current = now;
            if (Math.random() > 0.4) {
              playWhooshSound();
            } else {
              playSqueakSound();
            }
          }

          // Playful speech on proximity entry with cooldown
          if (dist < 90 && now - lastSpeechTimeRef.current > 4200) {
            lastSpeechTimeRef.current = now;
            const activeFleeList = fleeListRef.current.length > 0 ? fleeListRef.current : FLEE_MESSAGES;
            const randomMsg = activeFleeList[Math.floor(Math.random() * activeFleeList.length)];
            setSpeech(randomMsg);
            setSpookCount((prev) => prev + 1);

            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = setTimeout(() => setSpeech(null), 2200);
          }
        }
      }

      // 2. Corner trap detection -> trigger teleport
      const edgePadding = 75;
      let isNearCorner = false;

      if (posRef.current.x < minX + edgePadding || posRef.current.x > maxX - edgePadding ||
          posRef.current.y < minY + edgePadding || posRef.current.y > maxY - edgePadding) {
        if (mouseRef.current) {
          const mDist = Math.hypot(ghostCenterX - mouseRef.current.x, ghostCenterY - mouseRef.current.y);
          if (mDist < 130) {
            isNearCorner = true;
          }
        }
      }

      if (isNearCorner && Math.random() < 0.08) {
        triggerTeleport();
      }

      if (posRef.current.x < minX + edgePadding) {
        const factor = (minX + edgePadding - posRef.current.x) / edgePadding;
        velRef.current.vx += factor * 0.95 * dt;
        if (mouseRef.current && velRef.current.vx < 0) {
          velRef.current.vy += (mouseRef.current.y > ghostCenterY ? -0.85 : 0.85) * dt;
        }
      } else if (posRef.current.x > maxX - edgePadding) {
        const factor = (posRef.current.x - (maxX - edgePadding)) / edgePadding;
        velRef.current.vx -= factor * 0.95 * dt;
        if (mouseRef.current && velRef.current.vx > 0) {
          velRef.current.vy += (mouseRef.current.y > ghostCenterY ? -0.85 : 0.85) * dt;
        }
      }

      if (posRef.current.y < minY + edgePadding) {
        const factor = (minY + edgePadding - posRef.current.y) / edgePadding;
        velRef.current.vy += factor * 0.95 * dt;
        if (mouseRef.current && velRef.current.vy < 0) {
          velRef.current.vx += (mouseRef.current.x > ghostCenterX ? -0.85 : 0.85) * dt;
        }
      } else if (posRef.current.y > maxY - edgePadding) {
        const factor = (posRef.current.y - (maxY - edgePadding)) / edgePadding;
        velRef.current.vy -= factor * 0.95 * dt;
        if (mouseRef.current && velRef.current.vy > 0) {
          velRef.current.vx += (mouseRef.current.x > ghostCenterX ? -0.85 : 0.85) * dt;
        }
      }

      // 3. Gentle autonomous floating drift when calm
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);
      if (currentSpeed < 0.3 && !fleeingNow) {
        velRef.current.vy += Math.sin(currentTime * 0.003) * 0.04 * dt;
        velRef.current.vx += Math.cos(currentTime * 0.002) * 0.03 * dt;
      }

      // 4. Smooth friction / damping
      velRef.current.vx *= Math.pow(0.87, dt);
      velRef.current.vy *= Math.pow(0.87, dt);

      const maxSpeed = 8.0;
      if (currentSpeed > maxSpeed) {
        velRef.current.vx = (velRef.current.vx / currentSpeed) * maxSpeed;
        velRef.current.vy = (velRef.current.vy / currentSpeed) * maxSpeed;
      }

      posRef.current.x += velRef.current.vx * dt;
      posRef.current.y += velRef.current.vy * dt;

      posRef.current.x = Math.max(minX, Math.min(maxX, posRef.current.x));
      posRef.current.y = Math.max(minY, Math.min(maxY, posRef.current.y));

      const targetTilt = Math.max(-18, Math.min(18, velRef.current.vx * 3.2));
      tiltRef.current += (targetTilt - tiltRef.current) * 0.18;

      if ((currentSpeed > 0.8 || fleeingNow) && Math.random() < 0.6) {
        particlesRef.current.push({
          x: ghostCenterX + (Math.random() - 0.5) * 20,
          y: ghostCenterY + 15 + (Math.random() - 0.5) * 10,
          vx: -velRef.current.vx * 0.2 + (Math.random() - 0.5) * 0.8,
          vy: -velRef.current.vy * 0.2 + (Math.random() - 0.5) * 0.8 + 0.3,
          size: Math.random() * 3.5 + 1.5,
          color: Math.random() > 0.5 ? '#c084fc' : '#e0e7ff',
          alpha: 0.8,
          life: 0,
          maxLife: Math.random() * 20 + 15,
        });
      }

      if (containerRef.current) {
        const isCurrentlyFleeing = fleeingNow || currentSpeed > 1.2;
        containerRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0) rotate(${tiltRef.current.toFixed(2)}deg) scale(${isCurrentlyFleeing ? 1.08 : 1})`;
      }

      if (shouldFleeChange(fleeingNow, currentSpeed)) {
        isFleeingRef.current = fleeingNow || currentSpeed > 1.1;
        setIsFleeing(isFleeingRef.current);
      }

      if (velRef.current.vx < -0.35 && !facingLeftRef.current) {
        facingLeftRef.current = true;
        setFacingLeft(true);
      } else if (velRef.current.vx > 0.35 && facingLeftRef.current) {
        facingLeftRef.current = false;
        setFacingLeft(false);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const arr = particlesRef.current;
          for (let i = arr.length - 1; i >= 0; i--) {
            const p = arr[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            p.alpha = Math.max(0, 1 - p.life / p.maxLife);

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p.life >= p.maxLife) {
              arr.splice(i, 1);
            }
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    const shouldFleeChange = (fleeingNow: boolean, speed: number) => {
      const active = fleeingNow || speed > 1.1;
      return active !== isFleeingRef.current;
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDesktop, isAsleep]);

  // Click handler to catch mini-game easter egg
  const handleGhostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCatchCount = catchCount + 1;
    setCatchCount(newCatchCount);

    playCatchSound();

    const activeCatchList = catchListRef.current.length > 0 ? catchListRef.current : CATCH_MESSAGES;
    const randomCatchMsg = activeCatchList[Math.floor(Math.random() * activeCatchList.length)];
    setSpeech(randomCatchMsg);
    setShowSpookBadge(true);
    setTimeout(() => setShowSpookBadge(false), 3200);

    spawnBurst(posRef.current.x + 32, posRef.current.y + 40, 50, 7);
    showToast(`You caught the Ghost! 👻🎉 (Streak: ${newCatchCount})`, 'success');

    setTimeout(() => {
      triggerTeleport();
    }, 400);
  };

  // Visibility Check (is_active: false)
  if (!isActive) {
    return null;
  }

  if (!isDesktop || isAsleep) {
    if (isAsleep && isDesktop) {
      return (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 backdrop-blur-md shadow-xl transition-all hover:scale-105 cursor-pointer"
            title={isMuted ? "Unmute ghost sounds" : "Mute ghost sounds"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-purple-300" />}
          </button>
          <button
            onClick={() => {
              setIsAsleep(false);
              const initialX = window.innerWidth * 0.8;
              const initialY = window.innerHeight * 0.4;
              posRef.current = { x: initialX, y: initialY };
              velRef.current = { vx: 0, vy: 0 };
            }}
            className="px-3.5 py-2 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold backdrop-blur-md shadow-2xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            title="Wake up Phantom Ghost"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Wake Ghost 👻</span>
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* HTML5 Canvas Overlay for Neon Trail & Confetti Particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-30"
      />

      {/* Ghost Container */}
      <div
        ref={containerRef}
        className={`fixed top-0 left-0 z-40 pointer-events-none select-none will-change-transform transition-opacity duration-300 ${
          isTeleporting ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}
        style={{
          transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
        }}
      >
        {/* Speech Bubble */}
        <AnimatePresence>
          {speech && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.85 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0b0b12]/95 text-purple-200 border border-purple-500/50 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl shadow-purple-950/80 backdrop-blur-xl pointer-events-none flex items-center gap-1.5 z-20"
            >
              <span>{speech}</span>
              {showSpookBadge && (
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full border border-purple-400/40 tabular-nums flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5 text-amber-400" />
                  {catchCount > 0 ? `#${catchCount}` : `#${spookCount}`}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ghost Character Body */}
        <div
          className="relative pointer-events-auto cursor-pointer group"
          onClick={handleGhostClick}
          onMouseEnter={() => {
            setIsHovered(true);
            playSqueakSound();
          }}
          onMouseLeave={() => setIsHovered(false)}
          title="Catch me if you can! Click to poke the ghost 👻"
        >
          {/* Intensified Neon Glow Aura */}
          <div
            className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-500 ${
              isFleeing || isHovered
                ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-cyan-400 opacity-85 scale-110 animate-pulse'
                : 'bg-gradient-to-r from-cyan-400 via-purple-600 to-indigo-500 opacity-60'
            }`}
          />

          {/* Floating Waving Ghost SVG */}
          <motion.div
            animate={{
              y: isFleeing ? [0, -7, 0] : [0, -11, 0],
              rotate: isFleeing ? [-4, 4, -4] : [0, 2.5, -2.5, 0],
            }}
            transition={{
              duration: isFleeing ? 0.3 : 3.0,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`relative w-16 h-20 transition-transform duration-300 ${facingLeft ? '-scale-x-100' : 'scale-x-100'}`}
          >
            <svg
              viewBox="0 0 100 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`w-full h-full transition-all duration-300 ${
                isFleeing || isHovered
                  ? 'drop-shadow-[0_0_24px_rgba(217,70,239,0.85)] drop-shadow-[0_0_40px_rgba(168,85,247,0.75)]'
                  : 'drop-shadow-[0_8px_20px_rgba(168,85,247,0.6)]'
              }`}
            >
              {/* Ghost Tail / Body Path */}
              <path
                d="M50 10C27.9086 10 10 27.9086 10 50V96C10 99.5 13.8 102 17.5 100.5L25 97.5C28.5 96 32.5 97 35 99.5L42.5 106.5C45.5 109.5 50.5 109.5 53.5 106.5L61 99.5C63.5 97 67.5 96 71 97.5L78.5 100.5C82.2 102 86 99.5 86 96V50C86 27.9086 68.0914 10 50 10Z"
                fill="url(#ghost-gradient)"
              />

              {/* Ghost Specular Sheen */}
              <path
                d="M20 50C20 33.4315 33.4315 20 50 20C54.5 20 58.5 21 62 22.8C45 23.5 27 34 23 54C21 52.8 20 51.4 20 50Z"
                fill="white"
                fillOpacity="0.5"
              />

              {/* Ghost Face */}
              {isFleeing ? (
                // Shocked / Scared Face
                <>
                  <ellipse cx="38" cy="48" rx="6.5" ry="8.5" fill="#0b0b14" />
                  <ellipse cx="36" cy="45" rx="2.5" ry="3.5" fill="#ffffff" />
                  <ellipse cx="62" cy="48" rx="6.5" ry="8.5" fill="#0b0b14" />
                  <ellipse cx="60" cy="45" rx="2.5" ry="3.5" fill="#ffffff" />
                  <ellipse cx="50" cy="67" rx="5" ry="7.5" fill="#0b0b14" />
                  <circle cx="28" cy="58" r="4.5" fill="#f43f5e" fillOpacity="0.6" />
                  <circle cx="72" cy="58" r="4.5" fill="#f43f5e" fillOpacity="0.6" />
                </>
              ) : (
                // Cute Smiling Face
                <>
                  <ellipse cx="38" cy="48" rx="5" ry="6.5" fill="#0f101d" />
                  <circle cx="39.5" cy="46" r="2.2" fill="#ffffff" />
                  <ellipse cx="62" cy="48" rx="5" ry="6.5" fill="#0f101d" />
                  <circle cx="63.5" cy="46" r="2.2" fill="#ffffff" />
                  <path
                    d="M44 60C45.5 64 54.5 64 56 60"
                    stroke="#0f101d"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="28" cy="56" r="4" fill="#ec4899" fillOpacity="0.45" />
                  <circle cx="72" cy="56" r="4" fill="#ec4899" fillOpacity="0.45" />
                </>
              )}

              {/* Little Hands / Waving Arms */}
              <path
                d="M10 58C6 60 2 66 6 72C10 76 15 72 14 66"
                fill="url(#ghost-gradient)"
                opacity="0.95"
              />
              <path
                d="M86 58C90 60 94 66 90 72C86 76 81 72 82 66"
                fill="url(#ghost-gradient)"
                opacity="0.95"
              />

              {/* Gradient Defs */}
              <defs>
                <linearGradient id="ghost-gradient" x1="50" y1="10" x2="50" y2="110" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f8fafc" />
                  <stop offset="0.6" stopColor="#e0e7ff" />
                  <stop offset="1" stopColor="#c084fc" stopOpacity="0.85" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Action buttons on hover (Mute, Sleep) */}
          <div className="absolute -bottom-3 -right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="w-6 h-6 rounded-full bg-black/85 hover:bg-purple-950 border border-white/25 text-slate-300 hover:text-white flex items-center justify-center text-[10px] shadow-xl cursor-pointer"
              title={isMuted ? "Unmute ghost sounds" : "Mute ghost sounds"}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-purple-300" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAsleep(true);
              }}
              className="w-6 h-6 rounded-full bg-black/85 hover:bg-rose-900 border border-white/25 text-slate-300 hover:text-white flex items-center justify-center text-[10px] shadow-xl cursor-pointer"
              title="Put ghost to sleep (Zzz)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
