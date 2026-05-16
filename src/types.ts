export interface Activity {
  id: number;
  group: 'green' | 'yellow' | 'orange' | 'blue' | 'red';
  icon: string;
  bg: string;
  name: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startHour: number;
  endHour: number;
  weekday: number; // 0-6 (Sunday to Saturday)
  weekOffset: number;
  activityId: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ProtocolDetail {
  id: string; // matches protocol ID ('a', 'b', etc.)
  entries: {
    title: string;
    description: string;
    subinfo?: string;
  }[];
}

export interface DailyData {
  r: string; // reflection
  g: string; // gratitude
  sixTasks?: string[]; // 6 Most Important Things
  protocol5352111?: string[]; // Completed IDs for 5352111 Elite Protocol
  protocolDetails?: Record<string, string[]>; // Detailed logs for each protocol ID ('a': ['John-At Cafe-Met via friend', ...])
}

export interface MonthlyRecord {
  month: string;
  target: number;
  actual: number;
  noc: number;
  anp: number;
  recruitTarget: number;
  recruitActual: number;
}

export interface TeamMember {
  id: string;
  name: string;
  joinDate: string;
  performance: number;
  active: boolean;
}

export interface Prospect {
  name: string;
  job: string;
  plan: string;
  note: string;
  isPinned?: boolean;
}

export interface RecruitCandidate {
  name: string;
  job: string;
  interest: string;
  followup: string;
  isPinned?: boolean;
}

export interface Milestone {
  name: string;
  achieved: boolean;
  category: 'sales' | 'recruit';
}

export interface PerfData {
  personalQ: number;
  teamQ: number;
  recruitCount: number;
  totalNOC: number;
  totalANP: number;
  monthlyRecords: MonthlyRecord[];
  prospectList: Prospect[];
  recruitList: RecruitCandidate[];
  teamMembers: TeamMember[];
  weekActs: { OF: number; P: number; F: number; C: number };
  weekRecruitActs: { RO: number; RP: number; RF: number; RS: number };
  dailyMission: string;
  dailyGoal: string;
  todayQ: number;
  todayNOC: number;
  todayANP: number;
  annualTargetGSPC: number;
  annualTargetTeam: number;
  dailyActivities: {
    of: number; p: number; f: number; c: number;
    ro: number; rp: number; rf: number; rs: number;
  };
  nightMessage: string;
  milestones: Milestone[];
  wishingStatement: string;
  personalEnergy: number;
  personalFocus: number;
  dailyActivitiesLog: Record<string, {
    of: number; p: number; f: number; c: number;
    ro: number; rp: number; rf: number; rs: number;
    q?: number; noc?: number; anp?: number;
  }>;
}

export type ThemeKey = 'default' | 'ocean' | 'sunset' | 'purple' | 'midnight' | 'cherry' | 'sunny' | 'gold' | 'mint' | 'autumn' | 'sapphire' | 'forest';

export interface ThemeConfig {
  name: string;
  bg: string;
  accent: string;
  text: string;
  headerBg: string;
  border: string;
}
