import { Activity, ThemeKey, ThemeConfig } from './types';
import { INSPIRATIONAL_QUOTES } from './quotes';

export const ACTIVITIES: Activity[] = [
  { id: 1, group: 'green', icon: '💰', bg: '#E8F5E8', name: 'Close Case' },
  { id: 2, group: 'green', icon: '💼', bg: '#E8F5E8', name: 'Sales Activities' },
  { id: 3, group: 'green', icon: '🔍', bg: '#E8F5E8', name: 'Fact Finding' },
  { id: 4, group: 'green', icon: '🌱', bg: '#E8F5E8', name: 'Prospecting' },
  { id: 5, group: 'yellow', icon: '📋', bg: '#FFF7B3', name: 'Planning' },
  { id: 6, group: 'yellow', icon: '✍️', bg: '#FFF7B3', name: 'Proposal' },
  { id: 7, group: 'yellow', icon: '🤝', bg: '#FFF7B3', name: 'Client Building' },
  { id: 8, group: 'yellow', icon: '📞', bg: '#FFF7B3', name: 'Telephoning' },
  { id: 9, group: 'yellow', icon: '📊', bg: '#FFF7B3', name: 'Record Keeping' },
  { id: 10, group: 'orange', icon: '👥', bg: '#FFE4CC', name: 'Recruiting' },
  { id: 11, group: 'orange', icon: '🌐', bg: '#FFE4CC', name: 'Build COI' },
  { id: 12, group: 'orange', icon: '💰', bg: '#FFE4CC', name: '万元保单' },
  { id: 13, group: 'blue', icon: '📢', bg: '#E8F2FF', name: 'Meeting' },
  { id: 14, group: 'blue', icon: '🧠', bg: '#E8F2FF', name: 'Self Dev' },
  { id: 15, group: 'blue', icon: '🤝', bg: '#E8F2FF', name: 'SG Contrib' },
  { id: 16, group: 'red', icon: '🏃‍♂️', bg: '#FFE8E8', name: 'Exercise' },
  { id: 17, group: 'red', icon: '🧘', bg: '#FFE8E8', name: 'Relax' },
  { id: 18, group: 'red', icon: '☕', bg: '#FFE8E8', name: 'Break' },
  { id: 19, group: 'red', icon: '🎨', bg: '#FFE8E8', name: 'Leisure' },
  { id: 20, group: 'red', icon: '🛒', bg: '#FFE8E8', name: 'Visiting' }
];

export const GROUP_CONFIG = {
  green: { name: '销售核心', color: '#5a9e5a' },
  yellow: { name: '规划支持', color: '#E6C300' },
  orange: { name: '招募拓展', color: '#E67E22' },
  blue: { name: '学习会议', color: '#3399ff' },
  red: { name: '生活平衡', color: '#e65c5c' }
};

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  default: { name: "Slate Core", bg: "#0f172a", accent: "#38bdf8", text: "#ffffff", headerBg: "rgba(15,23,42,0.9)", border: "#38bdf8" },
  neon: { name: "Neon Cyber", bg: "#050505", accent: "#ccff00", text: "#ffffff", headerBg: "rgba(5,5,5,0.9)", border: "#ccff00" },
  rose: { name: "Rose Berry", bg: "#1e1b4b", accent: "#f472b6", text: "#ffffff", headerBg: "rgba(30,27,75,0.9)", border: "#f472b6" },
  emerald: { name: "Emerald Glade", bg: "#064e3b", accent: "#34d399", text: "#ffffff", headerBg: "rgba(6,78,59,0.9)", border: "#34d399" },
  amber: { name: "Amber Sands", bg: "#422006", accent: "#fbbf24", text: "#ffffff", headerBg: "rgba(66,32,6,0.9)", border: "#fbbf24" },
  midnight: { name: "Noir Crimson", bg: "#000000", accent: "#ff4d4d", text: "#ffffff", headerBg: "rgba(0,0,0,0.9)", border: "#ff4d4d" },
  violet: { name: "Violet Orbit", bg: "#2e1065", accent: "#a855f7", text: "#ffffff", headerBg: "rgba(46,16,101,0.9)", border: "#a855f7" },
  ocean: { name: "Deep Oceanic", bg: "#083344", accent: "#22d3ee", text: "#ffffff", headerBg: "rgba(8,51,68,0.9)", border: "#22d3ee" }
};

export const ENCOURAGEMENTS = INSPIRATIONAL_QUOTES;
