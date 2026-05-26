import { ProjectBubble, SkillStat } from '../types';

export const HERO_STATS = {
  name: "GUSTAV ADNAN",
  class: "Pixel Wizard / Full-Stack Coder",
  level: 88,
  hp: { current: 100, max: 100 },
  mp: { current: 85, max: 85 },
  exp: { current: 7200, next: 10000 },
  attributes: [
    { name: "STR (Coding Power)", value: 87, desc: "Delivers heavy algorithms and scalable lines of code." },
    { name: "AGI (Performance)", value: 92, desc: "Optimizes fast renders, light builds, and fluid interactions." },
    { name: "INT (AI Alchemy)", value: 89, desc: "Forges clever models, conversational prompts, and automated assets." },
    { name: "VIT (Bug Resistance)", value: 85, desc: "Survives deep debug trials and late-night stack trace reviews." },
    { name: "LUK (Code Compiles)", value: 78, desc: "Chances of a major code overhaul compiling on the very first try." }
  ]
};

export const SKILLS_STATISTICS: SkillStat[] = [
  { name: "React / Vite / Next.js", level: 9.5, iconName: "Cpu", color: "from-blue-400 to-cyan-500" },
  { name: "TypeScript & CJS/ESM", level: 9.0, iconName: "Shield", color: "from-violet-500 to-blue-500" },
  { name: "Node.js / Express / APIs", level: 8.5, iconName: "Server", color: "from-emerald-500 to-teal-500" },
  { name: "Tailwind CSS & Animate", level: 9.2, iconName: "Compass", color: "from-pink-500 to-rose-500" },
  { name: "Physics & Game Math", level: 8.0, iconName: "Zap", color: "from-amber-400 to-orange-500" }
];

export const INITIAL_PROJECT_BUBBLES: Omit<ProjectBubble, 'x' | 'y' | 'vx' | 'vy' | 'isPopping' | 'popProgress'>[] = [
  {
    id: "profile",
    label: "👨‍💻 ABOUT ME",
    title: "ABOUT GUSTAV ANANDA",
    category: "profile",
    description: "Welcome to my interactive workspace! I'm Gustav Ananda, a junior fullstack developer on a mission to build scalable applications and high-quality web experiences. I love combining robust backend pipelines with playful, fast frontends.",
    tags: ["Junior Dev", "Full-Stack Coder", "UI/UX Design"],
    color: "#a21caf",
    gradient: "from-purple-600 to-pink-500",
    radius: 78
  },
  {
    id: "itch",
    label: "🎮 ITCH.IO",
    title: "ITCH.IO INTERACTIVE OUTPOST",
    category: "project",
    description: "Discover my indie game creations, micro-jams, and vintage-themed web simulators deployed directly on Itch.io.",
    tags: ["Indie Games", "Playable Simulators", "Game Jams"],
    link: "https://itch.io",
    color: "#fa5c5c",
    gradient: "from-rose-500 to-orange-500",
    radius: 70
  },
  {
    id: "github",
    label: "🐱 GITHUB",
    title: "GITHUB SECURE FILES",
    category: "github",
    description: "Explore my source repositories, contribution logs, custom frameworks, and automation scripts on GitHub.",
    tags: ["Open Source", "Repositories", "DevOps Guides"],
    link: "https://github.com/gustavadnana",
    color: "#0d0c1d",
    gradient: "from-emerald-800 to-teal-600",
    radius: 68
  },
  {
    id: "linkedin",
    label: "💼 LINKEDIN",
    title: "LINKEDIN WORK PROFILE",
    category: "linkedin",
    description: "My career history, professional connections, references, and fullstack capabilities updated on LinkedIn.",
    tags: ["Networking", "Professional", "Indonesia"],
    link: "https://www.linkedin.com/in/gustav-adnan",
    color: "#1d66b5",
    gradient: "from-blue-600 to-cyan-500",
    radius: 70
  },
  {
    id: "skills",
    label: "⚡ SKILL STATS",
    title: "COMBAT CAPABILITIES & SKILLS",
    category: "skills",
    description: "My interactive developer attributes mapping command of web frameworks, database administration, APIs, and modern toolchains.",
    tags: ["React & Next", "TypeScript", "Node.js & Sockets", "Tailwind CSS"],
    color: "#2b9377",
    gradient: "from-emerald-600 to-cyan-500",
    radius: 72
  },
  {
    id: "instagram",
    label: "📸 INSTAGRAM",
    title: "INSTAGRAM OUTPOST",
    category: "contact",
    description: "My social log. Reach out here for daily programmer lifestyle milestones, design insights, and snapshots.",
    tags: ["Social Feed", "Daily Cues", "Developer Vibe"],
    link: "https://instagram.com",
    color: "#c0237c",
    gradient: "from-pink-600 to-rose-400",
    radius: 66
  },
  {
    id: "this-project",
    label: "✨ THIS PROJECT",
    title: "BUBBLY PORTFOLIO PROJECT",
    category: "project",
    description: "Explore the internal architecture design of this interactive portfolio game. Built using React, custom-crafted canvas drag physics, synthesized retro sound effects, and bottle-flip simulator layouts.",
    tags: ["Custom Canvas", "Physics Logic", "Chiptone Audio"],
    link: "https://github.com/gustavadnana",
    color: "#3d34a5",
    gradient: "from-blue-600 to-indigo-500",
    radius: 68
  },
  {
    id: "mal",
    label: "🎞️ MAL PORTAL",
    title: "MYANIMELIST LIBRARY",
    category: "custom",
    description: "Check my verified watch list, scores, custom reviews, and catalog status on MyAnimeList.",
    tags: ["Watch List", "Media Tracker", "Anime Logs"],
    link: "https://myanimelist.net",
    color: "#2e51a2",
    gradient: "from-blue-800 to-indigo-600",
    radius: 54
  },
  {
    id: "letterboxd",
    label: "🎬 LETTERBOXD",
    title: "LETTERBOXD CINEMA TRACE",
    category: "custom",
    description: "My cinephile logs, movie scores, rating distributions, and reviewed lists on Letterboxd.",
    tags: ["Movie Logs", "Reviews Hub", "Film Club"],
    link: "https://letterboxd.com",
    color: "#ff8000",
    gradient: "from-orange-600 to-amber-500",
    radius: 54
  },
  {
    id: "backloggd",
    label: "🎮 BACKLOGGD",
    title: "BACKLOGGD GAME DECK",
    category: "custom",
    description: "Log index for all my completed games, backlogged priorities, ongoing campaigns, and reviews.",
    tags: ["Game Tracker", "Play Log", "Backlogs"],
    link: "https://backloggd.com",
    color: "#fa1d2f",
    gradient: "from-red-600 to-rose-500",
    radius: 54
  }
];
