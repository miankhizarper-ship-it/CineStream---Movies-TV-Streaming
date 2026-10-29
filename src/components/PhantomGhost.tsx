import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface GhostPosition {
  x: number;
  y: number;
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
];

export const PhantomGhost: React.FC = () => {
  // Desktop only check
  const [isDesktop, setIsDesktop] = useState(false);
  const [isFleeing, setIsFleeing] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [spookCount, setSpookCount] = useState(0);
  const [showSpookBadge, setShowSpookBadge] = useState(false);

  // Physics state refs for 60fps continuous animation
  const containerRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<GhostPosition>({ x: -200, y: -200 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const tiltRef = useRef(0);
  const isFleeingRef = useRef(false);
  const facingLeftRef = useRef(false);
  const lastSpeechTimeRef = useRef(0);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

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

  // Real-time physics animation loop (requestAnimationFrame)
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
      const dt = Math.min((currentTime - prevTime) / 16.667, 2.5); // normalized frame delta
      prevTime = currentTime;

      const ghostCenterX = posRef.current.x + 32;
      const ghostCenterY = posRef.current.y + 40;

      let fleeingNow = false;

      // 1. Proximity repulsion from mouse
      if (mouseRef.current) {
        const dx = ghostCenterX - mouseRef.current.x;
        const dy = ghostCenterY - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);
        const fleeRadius = 140; // Detection threshold

        if (dist < fleeRadius && dist > 1) {
          fleeingNow = true;
          const dirX = dx / dist;
          const dirY = dy / dist;

          // Proportional gentle repulsion force: closer cursor = stronger push
          const strength = (1 - dist / fleeRadius);
          const force = strength * 2.2 * dt;

          velRef.current.vx += dirX * force;
          velRef.current.vy += dirY * force;

          // Playful speech on proximity entry with cooldown
          const now = Date.now();
          if (dist < 90 && now - lastSpeechTimeRef.current > 4000) {
            lastSpeechTimeRef.current = now;
            const randomMsg = FLEE_MESSAGES[Math.floor(Math.random() * FLEE_MESSAGES.length)];
            setSpeech(randomMsg);
            setSpookCount((prev) => prev + 1);

            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = setTimeout(() => {
              setSpeech(null);
            }, 2200);
          }
        }
      }

      // 2. Soft screen boundary deflection & corner avoidance
      const edgePadding = 80;
      if (posRef.current.x < minX + edgePadding) {
        const factor = (minX + edgePadding - posRef.current.x) / edgePadding;
        velRef.current.vx += factor * 0.9 * dt;
        // Tangential evasion when cornered
        if (mouseRef.current && velRef.current.vx < 0) {
          velRef.current.vy += (mouseRef.current.y > ghostCenterY ? -0.8 : 0.8) * dt;
        }
      } else if (posRef.current.x > maxX - edgePadding) {
        const factor = (posRef.current.x - (maxX - edgePadding)) / edgePadding;
        velRef.current.vx -= factor * 0.9 * dt;
        // Tangential evasion when cornered
        if (mouseRef.current && velRef.current.vx > 0) {
          velRef.current.vy += (mouseRef.current.y > ghostCenterY ? -0.8 : 0.8) * dt;
        }
      }

      if (posRef.current.y < minY + edgePadding) {
        const factor = (minY + edgePadding - posRef.current.y) / edgePadding;
        velRef.current.vy += factor * 0.9 * dt;
        if (mouseRef.current && velRef.current.vy < 0) {
          velRef.current.vx += (mouseRef.current.x > ghostCenterX ? -0.8 : 0.8) * dt;
        }
      } else if (posRef.current.y > maxY - edgePadding) {
        const factor = (posRef.current.y - (maxY - edgePadding)) / edgePadding;
        velRef.current.vy -= factor * 0.9 * dt;
        if (mouseRef.current && velRef.current.vy > 0) {
          velRef.current.vx += (mouseRef.current.x > ghostCenterX ? -0.8 : 0.8) * dt;
        }
      }

      // 3. Gentle autonomous floating drift when calm
      const currentSpeed = Math.hypot(velRef.current.vx, velRef.current.vy);
      if (currentSpeed < 0.3 && !fleeingNow) {
        velRef.current.vy += Math.sin(currentTime * 0.003) * 0.04 * dt;
        velRef.current.vx += Math.cos(currentTime * 0.002) * 0.03 * dt;
      }

      // 4. Smooth friction / damping
      velRef.current.vx *= Math.pow(0.88, dt);
      velRef.current.vy *= Math.pow(0.88, dt);

      // Clamp max velocity so motion remains smooth and graceful
      const speed = Math.hypot(velRef.current.vx, velRef.current.vy);
      const maxSpeed = 7.5;
      if (speed > maxSpeed) {
        velRef.current.vx = (velRef.current.vx / speed) * maxSpeed;
        velRef.current.vy = (velRef.current.vy / speed) * maxSpeed;
      }

      // 5. Update position coordinates
      posRef.current.x += velRef.current.vx * dt;
      posRef.current.y += velRef.current.vy * dt;

      // Hard clamp within window limits
      posRef.current.x = Math.max(minX, Math.min(maxX, posRef.current.x));
      posRef.current.y = Math.max(minY, Math.min(maxY, posRef.current.y));

      // 6. Smooth tilt proportional to horizontal velocity
      const targetTilt = Math.max(-16, Math.min(16, velRef.current.vx * 2.8));
      tiltRef.current += (targetTilt - tiltRef.current) * 0.15;

      // 7. Update DOM transform directly for butter-smooth 60+ FPS performance
      if (containerRef.current) {
        const isCurrentlyFleeing = fleeingNow || speed > 1.2;
        containerRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0) rotate(${tiltRef.current.toFixed(2)}deg) scale(${isCurrentlyFleeing ? 1.07 : 1})`;
      }

      // 8. Update UI state cleanly only on threshold shifts
      const shouldFlee = fleeingNow || speed > 1.1;
      if (shouldFlee !== isFleeingRef.current) {
        isFleeingRef.current = shouldFlee;
        setIsFleeing(shouldFlee);
      }

      if (velRef.current.vx < -0.4 && !facingLeftRef.current) {
        facingLeftRef.current = true;
        setFacingLeft(true);
      } else if (velRef.current.vx > 0.4 && facingLeftRef.current) {
        facingLeftRef.current = false;
        setFacingLeft(false);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDesktop, isAsleep]);

  // Click handler to trigger sudden playful dodge
  const handleClick = () => {
    setSpeech('BOO! 🎃 You caught me!');
    setShowSpookBadge(true);
    setTimeout(() => setShowSpookBadge(false), 3000);

    // Give an extra burst away from center
    const burstAngle = Math.random() * Math.PI * 2;
    velRef.current.vx += Math.cos(burstAngle) * 5.5;
    velRef.current.vy += Math.sin(burstAngle) * 5.5;
  };

  if (!isDesktop || isAsleep) {
    if (isAsleep && isDesktop) {
      // Small unobtrusive summon pill in bottom-right corner
      return (
        <button
          onClick={() => {
            setIsAsleep(false);
            const initialX = window.innerWidth * 0.8;
            const initialY = window.innerHeight * 0.4;
            posRef.current = { x: initialX, y: initialY };
            velRef.current = { vx: 0, vy: 0 };
          }}
          className="fixed bottom-5 right-5 z-40 px-3 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/30 text-purple-200 text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          title="Wake up Phantom Ghost"
        >
          <span>👻 Wake Ghost</span>
        </button>
      );
    }
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 z-40 pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
      }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {speech && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-purple-200 border border-purple-500/40 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xl shadow-purple-950/50 backdrop-blur-md pointer-events-none flex items-center gap-1.5 z-20"
          >
            <span>{speech}</span>
            {showSpookBadge && (
              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full border border-purple-400/40 tabular-nums">
                #{spookCount}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost Character Body */}
      <div
        className="relative pointer-events-auto cursor-pointer group"
        onClick={handleClick}
        title="Phantom Ghost! Move cursor close to chase me, or click to poke!"
      >
        {/* Glow Aura */}
        <div
          className={`absolute -inset-3 rounded-full blur-xl opacity-60 transition-colors duration-500 ${
            isFleeing
              ? 'bg-gradient-to-r from-rose-500 via-purple-500 to-amber-500 animate-pulse'
              : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-indigo-500'
          }`}
        />

        {/* Floating Waving Ghost SVG */}
        <motion.div
          animate={{
            y: isFleeing ? [0, -6, 0] : [0, -10, 0],
            rotate: isFleeing ? [-3, 3, -3] : [0, 2, -2, 0],
          }}
          transition={{
            duration: isFleeing ? 0.35 : 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`relative w-16 h-20 transition-transform duration-300 ${facingLeft ? '-scale-x-100' : 'scale-x-100'}`}
        >
          <svg
            viewBox="0 0 100 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_8px_16px_rgba(168,85,247,0.55)]"
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
              fillOpacity="0.45"
            />

            {/* Ghost Face */}
            {isFleeing ? (
              // Shocked / Scared Face
              <>
                {/* Wide Shocked Left Eye */}
                <ellipse cx="38" cy="48" rx="6.5" ry="8.5" fill="#0b0b14" />
                <ellipse cx="36" cy="45" rx="2.5" ry="3.5" fill="#ffffff" />
                {/* Wide Shocked Right Eye */}
                <ellipse cx="62" cy="48" rx="6.5" ry="8.5" fill="#0b0b14" />
                <ellipse cx="60" cy="45" rx="2.5" ry="3.5" fill="#ffffff" />
                {/* Gasping Open Mouth */}
                <ellipse cx="50" cy="67" rx="5" ry="7.5" fill="#0b0b14" />
                {/* Cheeks blush */}
                <circle cx="28" cy="58" r="4.5" fill="#f43f5e" fillOpacity="0.5" />
                <circle cx="72" cy="58" r="4.5" fill="#f43f5e" fillOpacity="0.5" />
              </>
            ) : (
              // Cute Smiling Face
              <>
                {/* Cute Left Eye */}
                <ellipse cx="38" cy="48" rx="5" ry="6.5" fill="#0f101d" />
                <circle cx="39.5" cy="46" r="2.2" fill="#ffffff" />
                {/* Cute Right Eye */}
                <ellipse cx="62" cy="48" rx="5" ry="6.5" fill="#0f101d" />
                <circle cx="63.5" cy="46" r="2.2" fill="#ffffff" />
                {/* Smiling Mouth */}
                <path
                  d="M44 60C45.5 64 54.5 64 56 60"
                  stroke="#0f101d"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* Soft Cheeks */}
                <circle cx="28" cy="56" r="4" fill="#ec4899" fillOpacity="0.4" />
                <circle cx="72" cy="56" r="4" fill="#ec4899" fillOpacity="0.4" />
              </>
            )}

            {/* Little Hands / Waving Arms */}
            <path
              d="M10 58C6 60 2 66 6 72C10 76 15 72 14 66"
              fill="url(#ghost-gradient)"
              opacity="0.9"
            />
            <path
              d="M86 58C90 60 94 66 90 72C86 76 81 72 82 66"
              fill="url(#ghost-gradient)"
              opacity="0.9"
            />

            {/* Gradient Defs */}
            <defs>
              <linearGradient id="ghost-gradient" x1="50" y1="10" x2="50" y2="110" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f8fafc" />
                <stop offset="0.6" stopColor="#e0e7ff" />
                <stop offset="1" stopColor="#c084fc" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Dismiss / Put to Sleep button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAsleep(true);
          }}
          className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-black/80 hover:bg-rose-900 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          title="Put ghost to sleep (Zzz)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

