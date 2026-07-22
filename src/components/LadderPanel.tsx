'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface LadderPanelProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

export const LADDER_VALUES = [
  { level: 15, points: '10.000', isMilestone: true },
  { level: 14, points: '7.500', isMilestone: false },
  { level: 13, points: '5.000', isMilestone: false },
  { level: 12, points: '3.000', isMilestone: false },
  { level: 11, points: '2.000', isMilestone: false },
  { level: 10, points: '1.500', isMilestone: true },
  { level: 9, points: '1.000', isMilestone: false },
  { level: 8, points: '800', isMilestone: false },
  { level: 7, points: '600', isMilestone: false },
  { level: 6, points: '400', isMilestone: false },
  { level: 5, points: '300', isMilestone: true },
  { level: 4, points: '200', isMilestone: false },
  { level: 3, points: '100', isMilestone: false },
  { level: 2, points: '50', isMilestone: false },
  { level: 1, points: '0', isMilestone: false },
];

export const LadderPanel: React.FC<LadderPanelProps> = ({ currentQuestionIndex }) => {
  return (
    <div className="bg-[#0B132B]/90 backdrop-blur-md p-3.5 md:p-4 rounded-3xl border-3 border-[#FDE68A]/70 shadow-2xl text-center w-full lg:w-64 xl:w-72">
      <div className="flex items-center justify-center gap-1.5 mb-2 text-[#FBBF24] font-extrabold text-xs uppercase tracking-wider border-b border-[#FBBF24]/30 pb-1.5">
        <Star className="w-3.5 h-3.5 fill-current text-[#FBBF24]" />
        <span>TANGGA AMAL</span>
        <Star className="w-3.5 h-3.5 fill-current text-[#FBBF24]" />
      </div>

      <div className="space-y-1 text-xs md:text-sm font-bold">
        {LADDER_VALUES.map((item) => {
          const isCurrent = currentQuestionIndex === item.level - 1;
          const isPassed = currentQuestionIndex > item.level - 1;

          return (
            <div
              key={item.level}
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#166534] text-white shadow-lg border border-[#4ADE80] scale-105 font-black ring-2 ring-[#22C55E]/50'
                  : isPassed
                  ? 'bg-[#1E293B]/70 text-[#4ADE80]'
                  : item.isMilestone
                  ? 'bg-[#FEF3C7]/20 text-[#FCD34D] border border-[#FBBF24]/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Level Indicator with Arrow */}
              <div className="flex items-center gap-1">
                {isCurrent && <span className="text-[#FBBF24] text-xs">▶</span>}
                <span>{item.level}</span>
                {item.isMilestone && <Star className="w-3 h-3 fill-current text-[#FCD34D]" />}
              </div>

              {/* Point Value */}
              <span>{item.points}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
