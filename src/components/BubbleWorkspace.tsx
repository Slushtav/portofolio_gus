import React, { useState, useEffect, useRef } from 'react';
import { ProjectBubble, SkillStat } from '../types';
import { INITIAL_PROJECT_BUBBLES, HERO_STATS, SKILLS_STATISTICS } from '../data/portfolioData';
import { sfx } from './AudioEngine';
import { 
  X, ExternalLink, RefreshCw, Plus, Sparkles, Volume2, VolumeX, Mail, 
  Github, Linkedin, Compass, Zap, Cpu, Shield, Server, Trophy, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BubbleWorkspaceProps {
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
}

export default function BubbleWorkspace({ isMuted, setIsMuted }: BubbleWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<ProjectBubble[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<ProjectBubble | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'stats'>('details');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  
  // Custom bubble generator controls
  const [customText, setCustomText] = useState('');
  const [customColor, setCustomColor] = useState('cyan');
  
  // Dragging states
  const draggingId = useRef<string | null>(null);
  const hasDragged = useRef<boolean>(false);
  const mousePos = useRef({ x: 0, y: 0 });

  // Initialize bubbles with random placement in safe zones
  const initBubbles = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Mobile scalability: shrink bubble radiuses to fit smaller screen sizes
    let scale = 1.0;
    if (width < 450) {
      scale = 0.6;
    } else if (width < 640) {
      scale = 0.75;
    } else if (width < 1024) {
      scale = 0.9;
    }

    const items = INITIAL_PROJECT_BUBBLES.map((pb, idx) => {
      const r = Math.round(pb.radius * scale);
      // safe spawn coordinates avoiding overlaps or sticking near screen edge
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      
      const spawnX = r + col * ((width - r * 2.5) / 4) + Math.random() * 20;
      const spawnY = r + row * ((height - r * 2.5) / 3) + Math.random() * 20;

      return {
        ...pb,
        radius: r,
        x: Math.min(Math.max(spawnX, r + 10), width - r - 10),
        y: Math.min(Math.max(spawnY, r + 10), height - r - 10),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        isPopping: false,
        popProgress: 0,
        isHovered: false
      } as ProjectBubble;
    });

    setBubbles(items);
    sfx.playSelect();
  };

  useEffect(() => {
    initBubbles();
    // Re-initialize when window resizes
    const handleResize = () => {
      initBubbles();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Physics animation update frame
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const updatePhysics = () => {
      if (!containerRef.current) {
        animFrameId = requestAnimationFrame(updatePhysics);
        return;
      }

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 500;

      setBubbles((prevBubbles) => {
        // Create deep copy to update safely
        const updated = prevBubbles.map((b) => ({ ...b }));

        // Resolve drag first
        if (draggingId.current) {
          const dragged = updated.find((b) => b.id === draggingId.current);
          if (dragged) {
            dragged.x = Math.max(dragged.radius, Math.min(width - dragged.radius, mousePos.current.x));
            dragged.y = Math.max(dragged.radius, Math.min(height - dragged.radius, mousePos.current.y));
            dragged.vx = 0;
            dragged.vy = 0;
          }
        }

        // Apply Drift movement & wall bouncing
        for (let i = 0; i < updated.length; i++) {
          const b = updated[i];
          if (b.isPopping) {
            b.popProgress += 0.08;
            continue;
          }

          if (b.id === draggingId.current) continue;

          // Drag velocity deceleration lightly
          b.vx *= 0.999;
          b.vy *= 0.999;

          b.x += b.vx;
          b.y += b.vy;

          // Wall bounces
          const r = b.radius;
          if (b.x < r) {
            b.x = r;
            b.vx = Math.abs(b.vx) * 0.9;
          } else if (b.x > width - r) {
            b.x = width - r;
            b.vx = -Math.abs(b.vx) * 0.9;
          }

          if (b.y < r) {
            b.y = r;
            b.vy = Math.abs(b.vy) * 0.9;
          } else if (b.y > height - r) {
            b.y = r; // reset at top if fallen through or bounce
            b.y = height - r;
            b.vy = -Math.abs(b.vy) * 0.9;
          }
        }

        // Elastic collisions between bubbles (Circle-to-Circle Elastic Push)
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const b1 = updated[i];
            const b2 = updated[j];

            if (b1.isPopping || b2.isPopping) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b1.radius + b2.radius;

            if (dist < minDist && dist > 0) {
              // Overlap separation vector
              const overlap = minDist - dist;
              const pushX = (dx / dist) * overlap * 0.55;
              const pushY = (dy / dist) * overlap * 0.55;

              // Separate bubble positions
              if (b1.id !== draggingId.current) {
                b1.x -= pushX;
                b1.y -= pushY;
              }
              if (b2.id !== draggingId.current) {
                b2.x += pushX;
                b2.y += pushY;
              }

              // Elastic bounce velocities
              const kx = dx / dist;
              const ky = dy / dist;

              // Relative velocity
              const rvx = b2.vx - b1.vx;
              const rvy = b2.vy - b1.vy;

              // Velocity along normal
              const velAlongNormal = rvx * kx + rvy * ky;

              // Only resolve if velocities are moving towards each other
              if (velAlongNormal < 0) {
                // Perfect elastic translation factor
                const impulse = -1.5 * velAlongNormal;
                const rx = impulse * kx * 0.5;
                const ry = impulse * ky * 0.5;

                if (b1.id !== draggingId.current) {
                  b1.vx -= rx;
                  b1.vy -= ry;
                }
                if (b2.id !== draggingId.current) {
                  b2.vx += rx;
                  b2.vy += ry;
                }
              }
            }
          }
        }

        // filter out fully popped custom bubbles or keep standard ones with popped status
        return updated.filter(b => !(b.category === 'custom' && b.isPopping && b.popProgress >= 1));
      });

      animFrameId = requestAnimationFrame(updatePhysics);
    };

    animFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Handle Drag Start
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    draggingId.current = id;
    hasDragged.current = false;
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    sfx.playSelect();
  };

  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    draggingId.current = id;
    hasDragged.current = false;
    mousePos.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    sfx.playSelect();
  };

  // Handle Drag Moving
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId.current || !containerRef.current) return;
    hasDragged.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingId.current || !containerRef.current) return;
    hasDragged.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    mousePos.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  // Handle Drag End
  const handleMouseUp = () => {
    if (draggingId.current) {
      // Set some throwing velocity
      const tossedId = draggingId.current;
      draggingId.current = null;
      
      setBubbles((prev) => 
        prev.map((b) => {
          if (b.id === tossedId) {
            return {
              ...b,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
            };
          }
          return b;
        })
      );
    }
    // We let hasDragged reset slightly later or directly inside click handler to survive touch tap sequences
    setTimeout(() => {
      hasDragged.current = false;
    }, 20);
  };

  // Launch bubble click or popping transition
  const handleBubbleClick = (bubble: ProjectBubble) => {
    if (hasDragged.current || draggingId.current) return; // ignore click on drop
    sfx.playPop();
    setSelectedBubble(bubble);
    setActiveTab('details');
  };

  // Trigger pop bubble
  const handlePopClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playPopPopped();
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isPopping: true, popProgress: 0 } : b))
    );
  };

  // Inject Custom Floating Text Bubble
  const injectCustomBubble = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const colors: Record<string, string> = {
      cyan: '#3cf8ec',
      pink: '#f43f80',
      yellow: '#f8c53c',
      lime: '#40f83c',
      magenta: '#c0237c'
    };

    const gradientMap: Record<string, string> = {
      cyan: 'from-cyan-400 to-blue-500',
      pink: 'from-pink-500 to-rose-400',
      yellow: 'from-yellow-400 to-amber-500',
      lime: 'from-lime-400 to-emerald-500',
      magenta: 'from-fuchsia-500 to-purple-600'
    };

    const newBubble: ProjectBubble = {
      id: `custom-${Date.now()}`,
      label: `✨ ${customText.substring(0, 15).toUpperCase()}`,
      title: customText,
      category: 'custom',
      description: "This is an custom interactive bubble you generated with the code analyzer injectors. Toss it around and bounce other portfolio boxes off of it!",
      tags: ["Dynamic", "Pixel Art", "Injectable"],
      color: colors[customColor] || '#ffffff',
      gradient: gradientMap[customColor] || 'from-slate-400 to-slate-600',
      radius: Math.max(50, 45 + customText.length * 2.5),
      x: width * 0.1 + Math.random() * (width * 0.8),
      y: height * 0.1 + Math.random() * (height * 0.8),
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      isPopping: false,
      popProgress: 0
    };

    setBubbles((prev) => [...prev, newBubble]);
    setCustomText('');
    sfx.playPop();
  };

  // Launch Portal Transition Animation with sound and delay
  const handleLaunchPortal = (url: string) => {
    sfx.playPopPopped();
    setIsTransitioning(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect safely
          window.open(url, '_blank');
          setIsTransitioning(false);
          setSelectedBubble(null);
          return 0;
        }
        sfx.playSelect();
        return prev - 1;
      });
    }, 850);
  };

  // Skill icons router helper
  const renderSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-violet-400" />;
      case 'Server': return <Server className="w-5 h-5 text-emerald-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-pink-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      default: return <Sparkles className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full relative">
      {/* HUD Bar Info Panel */}
      <div className="flex flex-wrap items-center justify-between bg-retro-dark border-b-4 border-black p-3 font-press-start text-[8px] md:text-[10px] text-white">
        <div className="flex items-center gap-2 mt-1 md:mt-0">
          <div className="w-3 h-3 bg-retro-lime border border-black shadow-[1px_1px_0_0_#000]"></div>
          <span>HP: {HERO_STATS.hp.current}/{HERO_STATS.hp.max}</span>
          <div className="w-20 md:w-32 h-3 bg-red-900 border-2 border-black p-0.5 ml-1">
            <div className="h-full bg-red-500 shadow-inner" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 md:mt-0">
          <div className="w-3 h-3 bg-retro-cyan border border-black shadow-[1px_1px_0_0_#000]"></div>
          <span>MP: {HERO_STATS.mp.current}/{HERO_STATS.mp.max}</span>
          <div className="w-20 md:w-32 h-3 bg-indigo-950 border-2 border-black p-0.5 ml-1">
            <div className="h-full bg-blue-500 shadow-inner" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 md:mt-0">
          <Trophy className="w-3.5 h-3.5 text-retro-yellow" />
          <span>LVL: {HERO_STATS.level}</span>
          <div className="w-20 md:w-32 h-3 bg-slate-800 border-2 border-black p-0.5 ml-1 relative">
            <div className="h-full bg-yellow-500 shadow-inner" style={{ width: '72%' }}></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button 
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              sfx.setMute(nextMute);
              sfx.playSelect();
            }}
            className="flex items-center gap-1.5 px-2 py-1 bg-retro-blue hover:bg-opacity-80 active:translate-y-0.5 border-2 border-black rounded shadow-[2px_2px_0_0_#000]"
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-retro-lime" />}
            <span className="hidden sm:inline">{isMuted ? "MUTED" : "SOUND: ON"}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Interactive Canvas Space */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        onTouchCancel={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 min-h-[460px] md:min-h-[580px] bg-[#090915] relative overflow-hidden p-4 select-none cursor-crosshair border-b-4 border-black"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(119, 43, 147, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(60, 248, 236, 0.12) 0%, transparent 45%),
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px'
        }}
      >
        {/* Retro scanline grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] z-10"></div>
        
        {/* Ambient background particles simulating small bubbles floating upward */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`bg-bubble-${i}`}
              className="absolute rounded-full border border-white/10 bg-white/5"
              style={{
                width: `${4 + (i % 3) * 6}px`,
                height: `${4 + (i % 3) * 6}px`,
                left: `${10 + i * 8}%`,
                bottom: '-20px'
              }}
              animate={{
                y: [0, -600],
                opacity: [0, 0.6, 0.6, 0],
                x: [0, (i % 2 === 0 ? 30 : -30)]
              }}
              transition={{
                duration: 8 + (i % 4) * 4,
                repeat: Infinity,
                delay: i * 0.7,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        {/* Dynamic Bubble Nodes */}
        {bubbles.map((b) => {
          // Calculate scale multiplier if popping
          let scale = 1;
          let opacity = 1;

          if (b.isPopping) {
            scale = 1 + b.popProgress * 0.9;
            opacity = 1 - b.popProgress;
          }

          const isCustom = b.category === 'custom';

          return (
            <div
              key={b.id}
              onMouseDown={(e) => handleMouseDown(b.id, e)}
              onTouchStart={(e) => handleTouchStart(b.id, e)}
              onClick={() => handleBubbleClick(b)}
              className="absolute cursor-grab active:cursor-grabbing select-none group z-20"
              style={{
                left: `${b.x - b.radius}px`,
                top: `${b.y - b.radius}px`,
                width: `${b.radius * 2}px`,
                height: `${b.radius * 2}px`,
                transform: `scale(${scale})`,
                opacity: opacity,
                transition: b.isPopping ? 'none' : 'transform 0.05s ease-out',
                touchAction: 'none'
              }}
            >
              {/* Actual physical bubble skin */}
              <div 
                className={`w-full h-full rounded-full flex flex-col items-center justify-center text-center p-3 relative 
                            border-4 border-black select-none shadow-[4px_4px_0_0_#000] transition-colors bg-gradient-to-br ${b.gradient}
                            group-hover:brightness-110 active:brightness-95 overflow-hidden`}
              >
                {/* Bubble reflection gloss */}
                <div className="absolute top-1.5 left-3.5 w-1/3 h-1/5 bg-white/20 rounded-full rotate-[-15deg] pointer-events-none"></div>
                <div className="absolute bottom-2.5 right-4.5 w-1/5 h-1/5 bg-black/10 rounded-full pointer-events-none"></div>

                {/* Bubble label text */}
                <span className="font-press-start text-[8px] md:text-[9px] text-white font-bold leading-normal tracking-tight [text-shadow:2px_2px_0_rgba(0,0,0,0.8)] z-10 px-1 word-break pointer-events-none">
                  {b.label}
                </span>

                {/* Subcategory helper text inside standard nodes */}
                {!isCustom && (
                  <span className="font-vt323 text-[12px] text-yellow-300 font-medium tracking-wide mt-1 [text-shadow:1px_1px_0_rgba(0,0,0,0.8)] z-10 uppercase pointer-events-none">
                    {b.category}
                  </span>
                )}

                {/* Visual Pop sound indicator bubble hook */}
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handlePopClick(b.id, e)}
                  title="Pop Bubble!"
                  className="absolute bottom-1 w-5 h-5 bg-black/75 hover:bg-black text-rose-400 hover:text-white rounded-full
                             border border-black font-press-start text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-35"
                >
                  X
                </button>
              </div>

              {/* Pulsing ring indicator around node */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-dashed pointer-events-none opacity-0 group-hover:opacity-60 group-hover:scale-105 duration-300"
                style={{ borderColor: b.color }}
              ></div>
            </div>
          );
        })}

        {/* Empty HUD Spawn Notice if all bubbles are deleted */}
        {bubbles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="p-6 bg-retro-dark border-4 border-black shadow-[4px_4px_0_0_#000] max-w-sm">
              <h4 className="font-press-start text-[10px] text-rose-500 mb-2">⚠ OUT OF BUBBLES</h4>
              <p className="font-vt323 text-white text-md mb-4 leading-relaxed">
                You popped all directories in the directory tree! Respawn them using the control console below.
              </p>
              <button
                onClick={initBubbles}
                className="px-4 py-2 bg-retro-lime hover:bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0_0_#000] font-press-start text-[8px] transition'all"
              >
                RESPAWN REALM
              </button>
            </div>
          </div>
        )}

        {/* Floating Bubble Quick Instructions Badge */}
        <div className="absolute bottom-3 left-4 pointer-events-none flex flex-col gap-1.5 z-10 max-w-[280px]">
          <div className="bg-black/80 border-2 border-black p-2 rounded text-white font-vt323 text-[14px]">
            <p className="text-retro-yellow font-bold uppercase tracking-wider mb-0.5 font-press-start text-[7px] leading-tight flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-300 animate-pulse" /> CONTROL ADVICE:
            </p>
            <ul className="list-disc pl-3 text-[12px] opacity-90 space-y-0.5">
              <li>Drag & toss bubbles with mouse or touch.</li>
              <li>Click or tap a bubble to load info.</li>
              <li>Hover & press <strong>[X]</strong> or tap pop option.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bubble Injector and System Action Console Panel */}
      <div className="bg-retro-dark border-b-4 border-black p-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Custom Bubble Creator Form */}
        <form onSubmit={injectCustomBubble} className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto font-press-start text-[8px]">
          <span className="text-retro-yellow uppercase font-bold tracking-wider mr-1">BUBBLE INJECTOR:</span>
          
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            maxLength={18}
            placeholder="TYPE MASSAGE AND HIT [ENTER]"
            className="px-2.5 py-1.5 bg-black border-2 border-black text-retro-cyan rounded w-full sm:w-48 outline-none focus:border-retro-lime text-[9px] font-sans"
          />

          {/* Color Select picker */}
          <div className="flex gap-1.5 mt-2 sm:mt-0">
            {['cyan', 'pink', 'yellow', 'lime', 'magenta'].map((c) => {
              const bgColors: Record<string, string> = {
                cyan: 'bg-retro-cyan',
                pink: 'bg-retro-pink',
                yellow: 'bg-retro-yellow',
                lime: 'bg-retro-lime',
                magenta: 'bg-retro-magenta'
              };

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCustomColor(c);
                    sfx.playSelect();
                  }}
                  className={`w-6 h-6 rounded border-2 border-black ${bgColors[c]} relative shadow-[1px_1px_0_0_#000]
                             ${customColor === c ? 'scale-110 border-white ring-2 ring-black' : 'opacity-80 hover:opacity-100'}`}
                  title={`Color: ${c}`}
                />
              );
            })}
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-retro-magenta text-white font-bold rounded border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-opacity-90 active:translate-y-0.5 ml-1 flex items-center gap-1.5 mt-2 sm:mt-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CONNECT</span>
          </button>
        </form>

        {/* Global Game Action controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {bubbles.filter(b => !b.isPopping).length > 0 && (
            <div className="flex items-center gap-1.5 bg-black p-1 rounded border-2 border-zinc-700">
              <select
                id="delete-bubble-select"
                className="bg-black text-rose-400 text-[8px] font-press-start p-1 outline-none border-none max-w-[145px]"
                defaultValue=""
              >
                <option value="">POP BUBBLE OUTSIDE...</option>
                {bubbles.filter(b => !b.isPopping).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title.substring(0, 16).toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const selectEl = document.getElementById('delete-bubble-select') as HTMLSelectElement;
                  if (selectEl && selectEl.value) {
                    const bubbleId = selectEl.value;
                    sfx.playPopPopped();
                    setBubbles((prev) =>
                      prev.map((b) => (b.id === bubbleId ? { ...b, isPopping: true, popProgress: 0 } : b))
                    );
                    selectEl.value = '';
                  } else {
                    sfx.playSelect();
                  }
                }}
                className="px-2 py-1 bg-red-950 border-2 border-black text-white hover:bg-rose-600 shadow-[1px_1px_0_0_#000] active:translate-y-0.5 font-press-start text-[8px]"
              >
                POP!
              </button>
            </div>
          )}
          <button
            onClick={initBubbles}
            className="px-3 py-2 bg-retro-blue hover:bg-opacity-90 text-white font-press-start text-[8px] rounded border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-300" />
            <span>RESPAWN ALL DIRECTORIES</span>
          </button>
        </div>
      </div>

      {/* Retro Quest Dialog Cabinet Modal */}
      <AnimatePresence>
        {selectedBubble && (
          <div 
            id="retro-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-press-start"
            onClick={(e) => {
              // Close if click outdoor cabinet
              if (e.target instanceof HTMLDivElement && e.target.id === 'retro-modal-overlay') {
                setSelectedBubble(null);
                sfx.playSelect();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="w-full max-w-2xl bg-retro-dark border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col relative overflow-hidden"
            >
              {/* Retro scanline grid overlay inside modal detail */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] z-10"></div>

              {/* Modal header border */}
              <div className="bg-black text-[10px] md:text-[11px] font-bold text-white p-3.5 flex items-center justify-between border-b-4 border-black">
                <div className="flex items-center gap-2 text-retro-cyan">
                  <span className="w-2.5 h-2.5 bg-retro-cyan inline-block rounded-xs animate-pulse"></span>
                  <span>DIRECTORY: {selectedBubble.label}</span>
                </div>
                
                {/* Close modal */}
                <button
                  onClick={() => {
                    setSelectedBubble(null);
                    sfx.playSelect();
                  }}
                  className="p-1 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transition Portal screen if loading/counting down */}
              {isTransitioning ? (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] bg-black">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-retro-cyan animate-spin mb-6 flex items-center justify-center">
                    <span className="text-xl text-white font-bold">{countdown}</span>
                  </div>
                  <h3 className="text-retro-cyan text-[12px] uppercase animate-pulse tracking-widest mb-2 font-bold">
                    LAUNCHING DATA PORTAL
                  </h3>
                  <p className="font-vt323 text-white/80 text-lg max-w-sm">
                    Connecting socket pipelines and establishing peer bridges to terminal destination...
                  </p>
                </div>
              ) : (
                <>
                  {/* Tab Selector Inside Cabinet for character info / other projects */}
                  <div className="flex bg-black/60 border-b-4 border-black">
                    <button
                      onClick={() => {
                        setActiveTab('details');
                        sfx.playSelect();
                      }}
                      className={`flex-1 py-3 text-[9px] font-bold border-r-2 border-black
                                 ${activeTab === 'details' ? 'bg-retro-blue text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      FILE DOSSIER
                    </button>
                    {(selectedBubble.id === 'profile' || selectedBubble.id === 'skills') && (
                      <button
                        onClick={() => {
                          setActiveTab('stats');
                          sfx.playSelect();
                        }}
                        className={`flex-1 py-3 text-[9px] font-bold
                                   ${activeTab === 'stats' ? 'bg-retro-blue text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        CHARACTER ATTR STATUS
                      </button>
                    )}
                  </div>

                  {/* Modal Body Info Container */}
                  <div className="p-5 md:p-6 text-white max-h-[420px] overflow-flow overflow-y-auto">
                    {/* View Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                          {/* Titles info */}
                          <div className="text-center sm:text-left flex-1 space-y-1">
                            <h2 className="text-[12px] md:text-[14px] text-retro-yellow font-bold uppercase [text-shadow:1px_1px_0_rgba(0,0,0,0.8)]">
                              {selectedBubble.title}
                            </h2>
                            <p className="font-vt323 text-[#3cf8ec] text-md font-semibold tracking-wide flex items-center justify-center sm:justify-start gap-1">
                              <span>CATEGORY: {selectedBubble.category}</span>
                              {selectedBubble.link && <span className="text-slate-500">• INTEGRATED LINK AVAILABLE</span>}
                            </p>
                          </div>
                        </div>

                        {/* File Details Markdown simulated box */}
                        <div className="bg-black/80 border-2 border-black p-4 rounded relative">
                          <div className="absolute top-1 right-2 font-vt323 text-[10px] text-slate-500 uppercase">SYS_LOG_V1.1_SEC_READ</div>
                          <p className="font-vt323 text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                            {selectedBubble.description}
                          </p>
                        </div>

                        {/* Tags element list */}
                        {selectedBubble.tags && selectedBubble.tags.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[8px] text-retro-yellow uppercase font-bold tracking-wider">DEPLOYED ENGINES & CHIPS (TAGS):</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedBubble.tags.map((tag, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2.5 py-1 bg-black border border-slate-700 text-white rounded font-vt323 text-[13px] tracking-wide"
                                >
                                  🎮 {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Profile specific layout items if selected profile */}
                        {selectedBubble.id === 'profile' && (
                          <div className="bg-slate-900/60 p-4 border-2 border-black rounded space-y-3 font-vt323">
                            <h4 className="text-[9px] text-retro-cyan font-press-start">GUSTAV ANANDA STAT CHEF:</h4>
                            <p className="text-slate-200 text-md leading-relaxed">
                              I craft scalable backends, highly interactive web frontends, and modular game mechanics. I specialize in React, Sockets, and custom WebGL/Node utilities. Solving bug tasks is like entering combat in classic role-playing dungeons—I take high pride in resolving complex runtime issues with elegance and robust defensive patterns.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Character Stats Attributes Tab */}
                    {activeTab === 'stats' && (
                      <div className="space-y-5">
                        {/* If profile bubble, display character statistics */}
                        {selectedBubble.id === 'profile' && (
                          <div className="space-y-4">
                            <div className="bg-slate-950 p-4 border-2 border-black rounded flex flex-col md:flex-row items-center gap-4">
                              <div className="w-16 h-16 rounded border-4 border-black bg-slate-800 flex items-center justify-center shrink-0">
                                <span className="font-press-start text-xs text-white">LV.88</span>
                              </div>
                              <div className="space-y-1 text-center md:text-left">
                                <h3 className="font-press-start text-[11px] text-retro-yellow">CHARACTER: {HERO_STATS.name}</h3>
                                <p className="font-vt323 text-[#3cf8ec] text-md">{HERO_STATS.class}</p>
                              </div>
                            </div>

                            <div className="space-y-3 font-vt323">
                              <p className="text-[8px] text-retro-yellow font-press-start">COMBAT ATTRIBUTES BAR DETAILS:</p>
                              <div className="space-y-2.5">
                                {HERO_STATS.attributes.map((attr, idx) => (
                                  <div key={idx} className="bg-black/60 p-2.5 border border-black rounded flex justify-between items-center flex-wrap gap-2 text-md">
                                    <div className="flex-1 min-w-[200px]">
                                      <p className="text-white font-bold">{attr.name}</p>
                                      <p className="text-[12px] text-slate-400 font-normal leading-tight">{attr.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-4 bg-slate-800 border border-black p-0.5 relative">
                                        <div className="h-full bg-retro-magenta" style={{ width: `${attr.value}%` }}></div>
                                      </div>
                                      <span className="font-press-start text-[9px] text-retro-cyan w-10 text-right">{attr.value}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Skill levels progress indicators if skills bubble */}
                        {selectedBubble.id === 'skills' && (
                          <div className="space-y-4 font-vt323">
                            <div className="bg-black/80 border-2 border-black p-4 rounded">
                              <h4 className="text-[9px] font-press-start text-retro-yellow mb-2 uppercase">TECHNOLOGY combat Proficiencies (EXP):</h4>
                              <p className="text-slate-300 text-[15px] leading-relaxed mb-1">
                                Core skills represent modules practiced in active deployment pipelines.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {SKILLS_STATISTICS.map((skill, idx) => (
                                <div key={idx} className="bg-slate-900/60 p-3 border-2 border-dashed border-slate-700 rounded flex items-center justify-between flex-wrap gap-2 text-md">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded bg-black/60 border border-black flex items-center justify-center">
                                      {renderSkillIcon(skill.iconName)}
                                    </div>
                                    <span className="font-bold text-white tracking-wide text-lg">{skill.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-32 h-5 bg-[#000] border-2 border-black relative p-0.5 shadow-inner">
                                      <div className={`h-full bg-gradient-to-r ${skill.color}`} style={{ width: `${skill.level * 10}%` }}></div>
                                    </div>
                                    <span className="font-press-start text-[8px] text-retro-lime w-12 text-right">EXP {Math.floor(skill.level * 100)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Controls bar */}
                  <div className="p-4 bg-black/80 border-t-4 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="font-vt323 text-slate-400 text-sm">
                      {selectedBubble.link ? "🔒 Portal link validated successfully." : "🔒 Document vault fully read-only."}
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Close button always visible */}
                      <button
                        onClick={() => {
                          setSelectedBubble(null);
                          sfx.playSelect();
                        }}
                        className="px-4 py-2 text-slate-300 bg-slate-800 hover:bg-slate-700 text-[10px] rounded border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
                      >
                        CLOSE SEC
                      </button>

                      {/* If the bubble has external redirect link, display Launch Portal link */}
                      {selectedBubble.link && (
                        <button
                          onClick={() => handleLaunchPortal(selectedBubble.link!)}
                          className="px-4 py-2 text-black bg-retro-lime hover:bg-emerald-400 text-[10px] font-bold rounded border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-0.5 flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>LAUNCH PORTAL</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
