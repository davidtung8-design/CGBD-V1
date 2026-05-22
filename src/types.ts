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
  todos?: TodoItem[]; // daily to-do list reminders
}

export interface BigCase {
  id: string;
  name?: string;
  anp?: number;
  fyc: number;
}

export interface MonthlyRecord {
  month: string;
  target: number;
  actual: number;
  noc: number;
  anp: number;
  fyc?: number;
  recruitTarget: number;
  recruitActual: number;
  bigCases?: BigCase[];
}

export interface TeamMember {
  id: string;
  name: string;
  joinDate: string;
  performance: number;
  active: boolean;
}

export type ProspectCategory = '跟进中' | '已成交' | '需要服务' | 'KIV' | '拒绝' | '未分类';
export type RecruitCategory = '跟进中' | '已经考试' | '90 days jumpstart' | 'attend MIP COP' | 'SG trip' | 'KIV' | '未分类';

export interface FollowupLog {
  id: string;
  datetime: string;
  note: string;
}

export interface Prospect {
  id: string;
  name: string;
  job: string;
  plan: string;
  note: string;
  isPinned?: boolean;
  category?: ProspectCategory;
  followupLogs?: FollowupLog[];
  todos?: TodoItem[];
}

export interface RecruitCandidate {
  id: string;
  name: string;
  job: string;
  interest: string;
  followup: string;
  isPinned?: boolean;
  category?: RecruitCategory;
  followupLogs?: FollowupLog[];
  todos?: TodoItem[];
}

export interface CustomerSaleRecord {
  id: string;
  customerName: string;
  inforceDate: string; // "YYYY-MM-DD" or equivalent
  birthday?: string; // "YYYY-MM-DD" or equivalent
  planName: string; // "SPY", "SPWP", etc.
  anp: number;
  fyc: number;
  fycRate?: number; // Store the chosen rate option (e.g. 0.28, 0.35, etc.)
  installmentPremium: number;
  payMode: 'M' | 'Q' | 'HY' | 'Y'; // Month, Quarter, Half-Year, Year
  monthlyPayments: number[]; // index 0 (Jan) to index 11 (Dec) representing premium payments received
  notes?: string;
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
  totalFYC?: number;
  monthlyRecords: MonthlyRecord[];
  prospectList: Prospect[];
  recruitList: RecruitCandidate[];
  customerSaleRecords?: CustomerSaleRecord[];
  teamMembers: TeamMember[];
  weekActs: { OF: number; P: number; F: number; C: number };
  weekRecruitActs: { RO: number; RP: number; RF: number; RS: number };
  dailyMission: string;
  dailyGoal: string;
  todayQ: number;
  todayNOC: number;
  todayANP: number;
  annualTargetGSPC: number;
  annualTargetFYC: number;
  annualTargetTeam: number;
  dailyActivities: {
    of: number; p: number; f: number; c: number;
    ro: number; rp: number; rf: number; rs: number;
  };
  nightMessage: string;
  milestones: Milestone[];
  wishingStatement: string;
  strategicFocus?: string;
  sixTasks?: string[];
  personalEnergy: number;
  personalFocus: number;
  dailyActivitiesLog: Record<string, {
    of: number; p: number; f: number; c: number;
    ro: number; rp: number; rf: number; rs: number;
    q?: number; noc?: number; anp?: number;
  }>;
}

export type ThemeKey = 'default' | 'neon' | 'rose' | 'emerald' | 'amber' | 'midnight' | 'violet' | 'ocean';

export interface ThemeConfig {
  name: string;
  bg: string;
  accent: string;
  text: string;
  headerBg: string;
  border: string;
}
