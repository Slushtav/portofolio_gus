export interface ProjectBubble {
  id: string;
  label: string;
  title: string;
  category: 'profile' | 'project' | 'github' | 'linkedin' | 'skills' | 'contact' | 'custom';
  description: string;
  tags: string[];
  link?: string;
  color: string; // Tailwind color or hex
  gradient: string; // CSS gradient overlay
  // Physics properties for drifting
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPopping: boolean;
  popProgress: number; // 0 to 1
  isHovered?: boolean;
}

export interface SkillStat {
  name: string;
  level: number; // Percentage or value out of 10
  iconName: string;
  color: string;
}

export interface Highscore {
  id: string;
  initials: string;
  score: number;
  date: string;
}
