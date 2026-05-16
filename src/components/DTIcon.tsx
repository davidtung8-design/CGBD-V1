import React from 'react';
import { ThemeConfig } from '../types';

interface DTIconProps {
  theme?: ThemeConfig;
  size?: number;
  className?: string;
}

export const DTIcon: React.FC<DTIconProps> = ({ theme, size = 40, className }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="#991B1B" />
      {/* Clock dial circle */}
      <circle cx="50" cy="50" r="40" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="50" cy="50" r="35" stroke="#F59E0B" strokeWidth="0.5" opacity="0.3" />
      
      {/* Letters DT */}
      <text 
        x="50" 
        y="58" 
        textAnchor="middle" 
        fontFamily="sans-serif" 
        fontSize="36" 
        fontWeight="900"
        letterSpacing="-2"
      >
        <tspan fill="white">D</tspan>
        <tspan fill="#F59E0B">T</tspan>
      </text>
    </svg>
  );
};
