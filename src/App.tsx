import React, { useState } from 'react';
import BubbleWorkspace from './components/BubbleWorkspace';
import BottleFlipGame from './components/BottleFlipGame';
import { sfx } from './components/AudioEngine';
import { 
  Gamepad2, Info, Sparkles, Terminal, Mail, Github, 
  Linkedin, ShieldAlert, Cpu, Heart, Layers
} from 'lucide-react';

export default function App() {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVibeInfo, setShowVibeInfo] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-retro-black p-3 md:p-6 flex flex-col items-center justify-start font-sans relative selection:bg-retro-magenta selection:text-white">
      {/* Dynamic Animated Space Stars Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 25px 35px, #fff, transparent),
            radial-gradient(1px 1px at 150px 180px, #fff, transparent),
            radial-gradient(1.5px 1.5px at 280px 75px, #f43f80, transparent),
            radial-gradient(1px 1px at 450px 320px, #3cf8ec, transparent),
            radial-gradient(2px 2px at 620px 140px, #f4f4f9, transparent),
            radial-gradient(1px 1px at 850px 480px, #fff, transparent),
            radial-gradient(1.5px 1.5px at 980px 240px, #eab308, transparent)
          `,
          backgroundSize: '1024px 768px',
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* Main High-Contrast Arcade Frame */}
      <div className="w-full max-w-6xl bg-black border-4 border-black border-double shadow-[8px_8px_0_0_#161530] rounded-lg overflow-hidden flex flex-col z-10 crt-flicker">
        
        {/* Retro Header Screen Banner */}
        <header className="bg-gradient-to-r from-retro-blue via-retro-purple to-retro-magenta border-b-4 border-black p-4 py-5 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4 relative">
          
          {/* Neon Logo & Retro Title pairing */}
          <div className="space-y-1 z-10">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="font-press-start font-bold text-lg md:text-xl text-retro-cyan tracking-wide drop-shadow-[3px_3px_0_#000] uppercase animate-pulse">
                GUSTAV PORTO PROJECT
              </span>
              <span className="font-press-start text-[8px] bg-black text-retro-yellow px-2 py-0.5 border border-retro-yellow rounded-sm select-none shadow-[2px_2px_0_0_#000]">
                V_3.0_PRO
              </span>
            </div>
            
            <p className="font-press-start text-[8px] md:text-[9px] text-retro-white/90 tracking-wider">
              🎮 CHOOSE PROJECTS • PUSH DIRECTORIES • TOSS WATER BOTTLES
            </p>
          </div>

          {/* Quick HUD Help Icon or info switcher */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => {
                setShowVibeInfo(!showVibeInfo);
                sfx.playSelect();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-zinc-900 border-2 border-black rounded shadow-[2px_2px_0_0_#000] active:translate-y-0.5 font-press-start text-[8px] text-retro-yellow"
            >
              <Info className="w-4 h-4 text-retro-yellow" />
              <span>{showVibeInfo ? "HIDE MANUAL" : "SHOW MANUAL"}</span>
            </button>
          </div>

          {/* Retro ambient grid curves reflection */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08)_0%,transparent_60%)]"></div>
        </header>

        {/* Dynamic Vibe Instructions Panel */}
        {showVibeInfo && (
          <div className="bg-[#121124] border-b-4 border-black p-4 text-white font-vt323 text-md md:text-lg tracking-normal">
            <div className="space-y-2">
              <h3 className="font-press-start text-[9px] text-[#f8c53c] tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-spin animate-duration-3000" /> 
                INSTRUCTION DOSSIER: THE BUBBLE PORTFOLIO RUNTIME
              </h3>
              <p className="text-slate-200 leading-relaxed text-lg">
                HALOO CUYYY Aku Gustav Ananda seorang junior fullstack dev yang butuh kerjaaa. Selamat datang di porto buatan ku. Porto ini berisikan semua "basic ah porto" tapi yang ini ga basic 😏. Di bawah teks ini ada bubbles yang isinya semua hal yang perlu diketahui tentang diriku. Di paling bawah juga ada flip bootle game kalo gabut liatin porto bubbles. Silahkan cari tahu cara pakenya karena menurut ku "Figuring things out is a fun part."
              </p>
            </div>
          </div>
        )}

        {/* 1. Interactive Floating Bubble Workspace */}
        <section className="flex flex-col bg-slate-950 font-press-start">
          <BubbleWorkspace isMuted={isMuted} setIsMuted={setIsMuted} />
        </section>

        {/* Mid-Divider Arcade Sound Control and Vibe Grid */}
        <div className="bg-black text-[9px] font-press-start text-center p-3 text-white border-y-4 border-black relative select-none">
          <span className="text-retro-pink inline-block animate-bounce px-2">✨ ▼ FLOOR EXTRA ZONE: PLAY TABLETOP BOTTLE FLIP MINIGAME ▼ ✨</span>
        </div>

        {/* 2. Mini-Game Bottle Flip in the Footer Cab */}
        <section className="flex flex-col bg-[#161530]">
          <BottleFlipGame />
        </section>

      </div>

      {/* Retro bottom credits copyright signature */}
      <footer className="mt-8 mb-4 text-center space-y-2 select-none z-10 font-vt323">
        <p className="text-slate-400 text-lg tracking-wider flex items-center justify-center gap-1.5">
          <span>DESIGNED EXCLUSIVELY FOR</span>
          <strong className="text-retro-cyan font-bold font-press-start text-[9px]">GUSTAV ANANDA</strong>
          <span>© 2026</span>
        </p>
        <p className="text-slate-600 text-sm flex items-center justify-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>PORTED IN REACT 19 • BUBBLE PHYSICS ENGINE V1.2.0</span>
        </p>
      </footer>
    </div>
  );
}
