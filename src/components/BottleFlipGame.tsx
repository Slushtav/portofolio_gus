import React, { useState, useEffect, useRef } from 'react';
import { Highscore } from '../types';
import { sfx } from './AudioEngine';
import { Trophy, RefreshCw, Volume2, VolumeX, Flame, FlameKindling, Info, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Platform interfaces
interface GamePlatform {
  x: number;
  width: number;
}

// Particle elements on successful landings
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export default function BottleFlipGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game states
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameState, setGameState] = useState<'info' | 'ready' | 'charging' | 'flying' | 'landed' | 'failed' | 'new_record'>('info');
  const [chargePower, setChargePower] = useState<number>(0);
  const chargingMax = 100;
  
  // Highscore logs
  const [leaderboard, setLeaderboard] = useState<Highscore[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState<string>('GUS');

  // Physics states tracked in refs to run smoothly in loops
  const physicsRef = useRef({
    bottleX: 80,
    bottleY: 176, // Platform-surface (220) - Bottle-height (44)
    startBottleY: 176,
    bottleWidth: 20,
    bottleHeight: 44,
    vx: 0,
    vy: 0,
    angle: 0,
    angleVelocity: 0,
    gravity: 0.38,
    
    // Platforms:
    platformA: { x: 50, width: 80 } as GamePlatform,
    platformB: { x: 280, width: 70 } as GamePlatform,
    
    // Camera translate scrolling offset:
    cameraX: 0,
    targetCameraX: 0,
    
    // Success star particles list:
    particles: [] as Particle[],
  });

  const chargeTimerRef = useRef<number | null>(null);
  const chargeDirectionRef = useRef<number>(1); // ping pong charge direction

  // Load leaderboard & local highscores on boot
  useEffect(() => {
    const savedScores = localStorage.getItem('retro_flip_leaderboard');
    if (savedScores) {
      try {
        setLeaderboard(JSON.parse(savedScores));
      } catch (e) {
        setLeaderboard(getDefaultLeaderboard());
      }
    } else {
      const defaults = getDefaultLeaderboard();
      setLeaderboard(defaults);
      localStorage.setItem('retro_flip_leaderboard', JSON.stringify(defaults));
    }

    const savedBest = localStorage.getItem('retro_flip_highscore');
    if (savedBest) {
      setHighScore(parseInt(savedBest, 10));
    }
  }, []);

  const getDefaultLeaderboard = (): Highscore[] => [
    { id: '1', initials: 'GUS', score: 12, date: '2026-05-24' },
    { id: '2', initials: 'NES', score: 8, date: '2026-05-25' },
    { id: '3', initials: 'BOT', score: 5, date: '2026-05-26' },
    { id: '4', initials: 'PLY', score: 3, date: '2026-05-26' },
    { id: '5', initials: 'FLI', score: 1, date: '2026-05-26' },
  ];

  // Canvas Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const drawGame = () => {
      // Clear with dark purple background
      ctx.fillStyle = '#0f0e22';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starry galaxy grids (gridlines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Retro Horizon Sun / Grid in background
      ctx.fillStyle = 'rgba(119, 43, 147, 0.08)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height + 40, 160, 0, Math.PI, true);
      ctx.fill();

      // Physical attributes abbreviation shortcut
      const p = physicsRef.current;

      // Handle custom camera horizontal scrolling interpolation
      if (Math.abs(p.cameraX - p.targetCameraX) > 0.1) {
        p.cameraX += (p.targetCameraX - p.cameraX) * 0.1;
      }

      ctx.save();
      // Translate elements leftwards based on camera position
      ctx.translate(-p.cameraX, 0);

      // --- DRAW PLATFORMS ---
      const platformSurfaceY = 195;

      // Draw Platform A table
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#2d2d4d'; // Dark blue tables
      ctx.fillRect(p.platformA.x, platformSurfaceY, p.platformA.width, canvas.height - platformSurfaceY);
      
      // Platform top highlight pixel edge
      ctx.fillStyle = '#6d69af'; 
      ctx.fillRect(p.platformA.x, platformSurfaceY, p.platformA.width, 4);

      // Draw Platform B table
      ctx.fillStyle = '#1c66b5'; // Neon-themed target table
      ctx.fillRect(p.platformB.x, platformSurfaceY, p.platformB.width, canvas.height - platformSurfaceY);
      
      // Target platform highlights
      ctx.fillStyle = '#3cf8ec'; 
      ctx.fillRect(p.platformB.x, platformSurfaceY, p.platformB.width, 4);

      // Label B target platform marker flag
      ctx.fillStyle = '#f8c53c';
      ctx.font = '7px "Press Start 2P"';
      ctx.fillText("TARGET", p.platformB.x + (p.platformB.width / 2) - 18, platformSurfaceY + 20);

      // --- UPDATE & DRAW PARTICLES ---
      p.particles.forEach((part, idx) => {
        part.x += part.vx;
        part.y += part.vy;
        part.alpha -= 0.02;
        ctx.globalAlpha = Math.max(0, part.alpha);
        ctx.fillStyle = part.color;
        // Make particles pixel-y (small squares)
        ctx.fillRect(part.x, part.y, part.size, part.size);
      });
      p.particles = p.particles.filter(part => part.alpha > 0);
      ctx.globalAlpha = 1.0; // Restore global opacity

      // --- UPDATE PHYSICS & DRAW BOTTLE ---
      if (gameState === 'flying') {
        p.bottleX += p.vx;
        p.bottleY += p.vy;
        p.vy += p.gravity;
        p.angle += p.angleVelocity;

        // Peak heights and fall limits checks (Bottom Surface collision)
        if (p.bottleY + p.bottleHeight >= platformSurfaceY) {
          p.bottleY = platformSurfaceY - p.bottleHeight; // Hard limit surface ground

          // CHECK LANDING OUTCOMES
          const midX = p.bottleX + p.bottleWidth / 2;
          
          // Is the bottle on Platform B?
          const isBetweenB = midX >= p.platformB.x && midX <= p.platformB.x + p.platformB.width;
          const isBetweenA = midX >= p.platformA.x && midX <= p.platformA.x + p.platformA.width;

          // Align angle normalized - water bottle flips rotate backwards.
          // Full flip = -360 degrees or close to standard zero multiples.
          const normalizedAngle = Math.abs(p.angle % (2 * Math.PI));
          // upright condition when angle is close to 0 OR close to 2*PI (6.28)
          const isUpright = normalizedAngle < 0.4 || normalizedAngle > (2 * Math.PI - 0.4);

          if (isBetweenB && isUpright) {
            // SUCCESS!
            setGameState('landed');
            setScore(prev => {
              const next = prev + 1;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('retro_flip_highscore', next.toString());
              }
              return next;
            });
            sfx.playFlipSuccess();

            // Emit sparkle stars
            for (let i = 0; i < 25; i++) {
              p.particles.push({
                x: p.bottleX + p.bottleWidth / 2,
                y: p.bottleY + p.bottleHeight,
                vx: (Math.random() - 0.5) * 5,
                vy: -Math.random() * 4 - 1,
                color: ['#40f83c', '#3cf8ec', '#f8c53c', '#ffffff'][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 3,
                alpha: 1.0
              });
            }

            // Scroll camera right and prepare next platform leap!
            setTimeout(() => {
              handleNewRoundScroll();
            }, 1100);

          } else if (isBetweenA && isUpright && p.vx === 0) {
            // Re-landed exactly back upright on start pad (failed flip but safe rebound)
            setGameState('ready');
            p.angle = 0;
            p.vx = 0;
            p.vy = 0;
          } else {
            // CRASH FAIL
            setGameState('failed');
            sfx.playFlipFail();
            
            // Set tumble angle representing fall
            p.angleVelocity = 0;
            p.angle = Math.PI / 2; // Lie horizontal
            
            // Particle dust cloud on crash
            for (let i = 0; i < 10; i++) {
              p.particles.push({
                x: p.bottleX + p.bottleWidth / 2,
                y: p.bottleY + p.bottleHeight - 5,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 1.5,
                color: '#656d78',
                size: 3,
                alpha: 0.8
              });
            }

            // Highscore eligibility check
            setTimeout(() => {
              checkHighscoreEligibility(score);
            }, 1000);
          }
        }
      }

      // Render the actual 8-bit bottle with rotation around centroid
      ctx.save();
      const centerX = p.bottleX + p.bottleWidth / 2;
      const centerY = p.bottleY + p.bottleHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(p.angle);

      // Draw Pixelated Water Bottle
      // Body (semi-transparent pixel container glowing neon cyan)
      ctx.fillStyle = 'rgba(60, 248, 236, 0.25)';
      ctx.strokeStyle = '#3cf8ec';
      ctx.lineWidth = 2;
      ctx.fillRect(-p.bottleWidth / 2, -p.bottleHeight / 2, p.bottleWidth, p.bottleHeight);
      ctx.strokeRect(-p.bottleWidth / 2, -p.bottleHeight / 2, p.bottleWidth, p.bottleHeight);

      // Custom internal liquid line pixels
      ctx.fillStyle = 'rgba(60, 248, 236, 0.7)';
      ctx.fillRect(-p.bottleWidth / 2 + 1, 0, p.bottleWidth - 2, p.bottleHeight / 2 - 1);

      // Label block in middle of bottle
      ctx.fillStyle = '#f43f80'; // Retro pink logo label
      ctx.fillRect(-p.bottleWidth / 2 + 1, -6, p.bottleWidth - 2, 8);

      // Label white stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-p.bottleWidth / 2 + 3, -4, p.bottleWidth - 6, 2);

      // Bottle Cap neck & cap
      ctx.fillStyle = '#eab308'; // Orange orange cap
      ctx.fillRect(-5, -p.bottleHeight / 2 - 4, 10, 4);

      ctx.restore();

      ctx.restore(); // Restore camera X shifting translation

      animFrame = requestAnimationFrame(drawGame);
    };

    animFrame = requestAnimationFrame(drawGame);
    return () => cancelAnimationFrame(animFrame);
  }, [gameState, score, highScore]);

  // Translate camera of platforms rightwards to make endless side scrolling
  const handleNewRoundScroll = () => {
    const p = physicsRef.current;
    
    // Smoothly shift platform B to platform A
    p.platformA = { ...p.platformB };
    
    // Generate new Platform B ahead at random distant spacing
    const spawnX = p.platformA.x + p.platformA.width + 120 + Math.random() * 80;
    const spawnWidth = Math.max(50, 80 - score * 3); // Platforms shrink as score increases! Epic difficulty!
    
    p.platformB = {
      x: spawnX,
      width: spawnWidth
    };

    // Calculate next camera offset so bottle is near left of view
    p.targetCameraX = p.platformA.x - 40;

    // Place bottle safely standing on new Platform A
    p.bottleX = p.platformA.x + (p.platformA.width / 2) - (p.bottleWidth / 2);
    p.bottleY = 195 - p.bottleHeight;
    p.angle = 0;
    p.vx = 0;
    p.vy = 0;
    p.angleVelocity = 0;

    setGameState('ready');
  };

  // Reset the game from failed slide
  const resetEntireGame = () => {
    const p = physicsRef.current;
    p.platformA = { x: 50, width: 80 };
    p.platformB = { x: 280, width: 70 };
    p.cameraX = 0;
    p.targetCameraX = 0;
    p.bottleX = 85;
    p.bottleY = 151;
    p.angle = 0;
    p.vx = 0;
    p.vy = 0;
    p.angleVelocity = 0;
    p.particles = [];

    setScore(0);
    setGameState('ready');
    sfx.playSelect();
  };

  // Check if player earned ranking inside Top 5 highscores
  const checkHighscoreEligibility = (currentScore: number) => {
    if (currentScore <= 0) {
      setGameState('ready');
      resetEntireGame();
      return;
    }

    const minScore = leaderboard.length >= 5 ? leaderboard[4].score : 0;
    if (currentScore > minScore || leaderboard.length < 5) {
      setGameState('new_record');
      sfx.playLevelUp();
    } else {
      setGameState('ready');
      resetEntireGame();
    }
  };

  // Save Highscore onto list
  const saveLeaderboardRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerNameInput.trim()) return;

    const newRecord: Highscore = {
      id: Date.now().toString(),
      initials: playerNameInput.substring(0, 3).toUpperCase(),
      score: score,
      date: new Date().toISOString().split('T')[0]
    };

    const nextList = [...leaderboard, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Keep top 5 only

    setLeaderboard(nextList);
    localStorage.setItem('retro_flip_leaderboard', JSON.stringify(nextList));
    sfx.playSelect();
    resetEntireGame();
  };

  // Charge Power triggers on space/pointer hold
  const startCharging = () => {
    if (gameState !== 'ready') return;
    setGameState('charging');
    setChargePower(0);
    chargeDirectionRef.current = 1;

    chargeTimerRef.current = window.setInterval(() => {
      setChargePower(prev => {
        let next = prev + chargeDirectionRef.current * 4;
        if (next >= chargingMax) {
          next = chargingMax;
          chargeDirectionRef.current = -1; // reverse ping pong power
        } else if (next <= 0) {
          next = 0;
          chargeDirectionRef.current = 1;
        }
        
        // play small charging ticks sound
        sfx.playFlipCharge(next / 100);
        return next;
      });
    }, 28);
  };

  const stopChargingAndFlip = () => {
    if (gameState !== 'charging') return;
    if (chargeTimerRef.current) {
      clearInterval(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }

    // Launch bottle into parabolic arc!
    setGameState('flying');
    sfx.playFlipLaunch();

    const p = physicsRef.current;
    
    // Horizontal force proportionate to charge power
    const powerRatio = chargePower / 100;
    p.vx = 4.2 + powerRatio * 6.0; // horizontal speed leap
    p.vy = -5.8 - powerRatio * 9.2; // upward leap force
    
    // Constant backwards spin flip
    p.angleVelocity = -0.165; 
  };

  // Keyboard controls supporting Spacebar charging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault(); // prevent site vertical scrolling
        if (gameState === 'ready') {
          startCharging();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        if (gameState === 'charging') {
          stopChargingAndFlip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, chargePower]);

  return (
    <div className="w-full bg-[#161530] border-t-4 border-black p-4 font-press-start relative select-none">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-5">
        
        {/* Playable Cabinet Screen Box (Left/Center) */}
        <div className="flex-1 bg-black/60 border-4 border-black p-3 shadow-[4px_4px_0_0_#1a1936] rounded relative flex flex-col items-center">
          
          <div className="flex items-center justify-between w-full border-b-2 border-black/80 pb-2 mb-2 text-white">
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-retro-yellow">
              <FlameKindling className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>BOTTLE FLIP ARCADE</span>
            </div>
            
            <div className="flex items-center gap-3 text-[8px] md:text-[9px]">
              <span className="text-retro-lime">HIGH: {highScore}</span>
              <span className="text-retro-pink">SCORE: {score}</span>
            </div>
          </div>

          {/* Interactive Responsive Canvas Screen */}
          <div className="relative w-full overflow-hidden border-2 border-black max-w-[500px]">
            <canvas 
              ref={canvasRef}
              width={500}
              height={220}
              className="w-full block"
            />

            {/* Game overlays inside screen container absolute */}
            
            {/* 1. Info Screen Panel */}
            {gameState === 'info' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-3xs flex flex-col items-center justify-center p-4 text-center">
                <Trophy className="w-9 h-9 text-retro-yellow mb-2 animate-bounce animate-duration-1000" />
                <h4 className="text-[10px] text-retro-cyan uppercase font-bold tracking-widest mb-1.5">RETRO FLIP CHALLENGE</h4>
                <p className="font-vt323 text-[14px] leading-relaxed text-slate-200 max-w-[320px] mb-3">
                  Hold the button (or press [SPACE]) to build flip trajectory. Release to toss! Make the bottle land upright on platforms to earn points.
                </p>
                <button
                  onClick={() => {
                    setGameState('ready');
                    sfx.playSelect();
                  }}
                  className="px-4 py-2 bg-retro-lime text-black border-2 border-black rounded shadow-[2px_2px_0_0_#000] text-[8px] font-bold active:translate-y-0.5"
                >
                  START FLIP QUEST
                </button>
              </div>
            )}

            {/* 2. Success landed text flash */}
            {gameState === 'landed' && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 p-2 bg-retro-lime border-2 border-black shadow-[2px_2px_0_0_#000] rounded text-[8px] text-black uppercase flex items-center gap-1 animate-ping-once">
                <Flame className="w-3.5 h-3.5" />
                <span>MANTAP! +1 POINT</span>
              </div>
            )}

            {/* 3. Fail text flash */}
            {gameState === 'failed' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3 bg-red-800 border-2 border-black text-white text-[8px] rounded uppercase text-center space-y-2 shadow-[4px_4px_0_0_#000]">
                <p className="font-bold text-red-200">GANGGUAN TRANSMISI (CRASH!)</p>
                <p className="text-[7px] text-slate-300">SCORE RESET TO 0</p>
              </div>
            )}

            {/* 4. New local highscore logging view */}
            {gameState === 'new_record' && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center">
                <Award className="w-10 h-10 text-retro-yellow animate-bounce mb-1.5" />
                <h3 className="text-retro-lime text-[10px] uppercase font-bold mb-1">👑 NEW RANK ACHIEVED!</h3>
                <p className="font-vt323 text-white text-md mb-3">
                  You flipt a stellar score of <span className="text-retro-yellow font-bold font-press-start text-[9px]">{score}</span>! Write your 3-digit arcade initials:
                </p>
                <form onSubmit={saveLeaderboardRecord} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value.substring(0,3).toUpperCase())}
                    placeholder="AAA"
                    className="px-3 py-1.5 bg-black border-2 border-slate-700 text-white font-press-start text-[14px] w-20 text-center tracking-widest uppercase focus:border-retro-lime outline-none"
                    maxLength={3}
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-retro-lime text-black border-2 border-black text-[8px] font-bold shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
                  >
                    SUBMIT REG
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Interactive Button Click for Flip Controller (Tap or Charge) */}
          <div className="w-full max-w-[360px] mt-3 flex flex-col items-center gap-2">
            
            {/* Trajectory charge meters bar */}
            <div className="w-full h-4 bg-slate-950 border-2 border-black p-0.5 relative rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-retro-yellow via-orange-500 to-retro-pink shadow-inner transition-transform"
                style={{ width: `${chargePower}%` }}
              ></div>
              <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[7px] text-white/95 uppercase drop-shadow-[1px_1px_0_#000]">
                {gameState === 'charging' ? `CHARGING INTENSITY: ${chargePower}%` : "METER CHARGE LEVEL"}
              </span>
            </div>

            {/* Big Launch click triggers */}
            <button
              onMouseDown={startCharging}
              onMouseUp={stopChargingAndFlip}
              onTouchStart={(e) => {
                e.preventDefault();
                startCharging();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopChargingAndFlip();
              }}
              disabled={gameState !== 'ready' && gameState !== 'charging'}
              className={`w-full py-2.5 text-[8px] md:text-[9px] font-bold uppercase rounded border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-0.5 text-center transition-all
                         ${gameState === 'charging' ? 'bg-retro-pink text-white animate-pulse' : 'bg-retro-lime text-black hover:bg-emerald-400'} 
                         disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:translate-y-0`}
            >
              {gameState === 'charging' ? 'RELEASE TO FLIP!' : 'HOLD TO FLIP BOTTLE [SPACE]'}
            </button>
            <span className="text-[6px] text-slate-400 mt-1 uppercase text-center leading-normal">
              PRO TIP: Perfect alignment is when the charge reaches around 45% to 65% for standard distances!
            </span>
          </div>

        </div>

        {/* Local Arcade Leaderboard (Right sidebar) */}
        <div className="w-full md:w-64 bg-retro-dark border-4 border-black p-3.5 shadow-[4px_4px_0_0_#1a1936] rounded text-white flex flex-col font-press-start">
          <div className="flex items-center gap-1.5 text-[9px] text-retro-cyan border-b-2 border-black pb-2 mb-3.5 uppercase font-bold">
            <Trophy className="w-4 h-4 text-retro-yellow" />
            <span>HALL OF FLIPPERS</span>
          </div>

          {/* Leaders score tables */}
          <div className="flex-1 space-y-2 font-vt323 text-md relative min-h-[160px]">
            {leaderboard.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No tournament submissions logged.</p>
            ) : (
              <div className="space-y-1.5 text-slate-100">
                {leaderboard.map((leader, index) => {
                  const placeColors = ['text-yellow-400 font-bold', 'text-slate-300', 'text-amber-600', 'text-slate-400'];
                  const isTopOne = index === 0;

                  return (
                    <div 
                      key={leader.id}
                      className={`flex items-center justify-between p-1 px-2 border border-black rounded ${isTopOne ? 'bg-gradient-to-r from-yellow-950/40 via-transparent to-transparent border-yellow-800' : 'bg-black/20'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 text-[12px] font-press-start ${placeColors[index] || 'text-slate-400'}`}>
                          {index + 1}.
                        </span>
                        <span className="font-press-start text-[8px] text-slate-300 tracking-wider">
                          {leader.initials}
                        </span>
                        {isTopOne && <span className="text-[11px] animate-pulse">👑</span>}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-press-start text-[8px] text-retro-lime font-bold">
                          {leader.score} FLIPS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manual Highscores reset buttons for diagnostics */}
          <button
            onClick={() => {
              if (window.confirm("Verify: Clear local high scores dashboard?")) {
                const defaults = getDefaultLeaderboard();
                setLeaderboard(defaults);
                localStorage.setItem('retro_flip_leaderboard', JSON.stringify(defaults));
                localStorage.setItem('retro_flip_highscore', '0');
                setHighScore(0);
                sfx.playSelect();
              }
            }}
            className="mt-4 w-full py-1.5 bg-red-950/40 hover:bg-red-900 border-2 border-black text-[7px] uppercase font-bold text-red-300 hover:text-white rounded active:translate-y-0.5 text-center block"
          >
            ERASE REGISTRY
          </button>
        </div>

      </div>
    </div>
  );
}
