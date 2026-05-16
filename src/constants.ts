import { Activity, ThemeKey, ThemeConfig } from './types';
import { INSPIRATIONAL_QUOTES } from './quotes';

export const ACTIVITIES: Activity[] = [
  { id: 1, group: 'green', icon: '💰', bg: '#E8F5E8', name: 'Set Appointments' },
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
  default: { name: "经典森林", bg: "#1b4332", accent: "#ff8c42", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#ff8c42" },
  ocean: { name: "深海蓝", bg: "#0d3b66", accent: "#48c9b0", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#48c9b0" },
  sunset: { name: "热情红橙", bg: "#9a031e", accent: "#f4d03f", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f4d03f" },
  purple: { name: "紫罗兰", bg: "#4a148c", accent: "#f7dc6f", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f7dc6f" },
  midnight: { name: "暗夜黑", bg: "#0a0a0c", accent: "#e94560", text: "#ffffff", headerBg: "#0a0a0c", border: "#e94560" },
  cherry: { name: "樱花粉", bg: "#8a1c43", accent: "#f8c291", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f8c291" },
  sunny: { name: "阳光黄", bg: "#946b00", accent: "#f39c12", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f39c12" },
  gold: { name: "冠军金", bg: "#5c4d00", accent: "#f9e79f", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f9e79f" },
  mint: { name: "薄荷绿", bg: "#006d5b", accent: "#e74c3c", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#e74c3c" },
  autumn: { name: "秋日橙", bg: "#873600", accent: "#f39c12", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f39c12" },
  sapphire: { name: "宝石蓝", bg: "#1a5276", accent: "#f1c40f", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#f1c40f" },
  forest: { name: "松石绿", bg: "#0b5345", accent: "#eb984e", text: "#ffffff", headerBg: "rgba(255,255,250,0.95)", border: "#eb984e" }
};

export const ENCOURAGEMENTS = INSPIRATIONAL_QUOTES;
