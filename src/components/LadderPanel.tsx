'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface LadderPanelProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

export const LadderPanel: React.FC<LadderPanelProps> = ({ currentQuestionIndex, totalQuestions = 15 }) => {
  const count = Math.max(1, totalQuestions);

  // Generate dynamic ladder levels from count down to 1
  const levels = Array.from({ length: count }, (_, idx) => {
    const levelNumber = count - idx; // Top level is N, bottom is 1
    const points = (levelNumber * 100).toLocaleString('id-ID');

    // Milestone logic: Top level, bottom level, or key intervals
    const isTop = levelNumber === count;
    const isMid = count > 5 && (levelNumber % 5 === 0 || levelNumber === Math.ceil(count / 2));
    const isMilestone = isTop || isMid;

    return {
      level: levelNumber,
      points,
      isMilestone,
    };
  });

  // Dynamic styling variables based on number of questions to maintain 100% height fit
  const getDynamicStyles = () => {
    if (count <= 5) {
      return {
        padding: 'py-2 px-3.5',
        fontSize: 'text-xs md:text-sm font-black',
        iconSize: 'w-4 h-4',
      };
    } else if (count <= 10) {
      return {
        padding: 'py-1.5 px-3',
        fontSize: 'text-xs md:text-sm font-bold',
        iconSize: 'w-3.5 h-3.5',
      };
    } else if (count <= 15) {
      return {
        padding: 'py-1 px-2.5',
        fontSize: 'text-[11px] md:text-xs font-bold',
        iconSize: 'w-3 h-3',
      };
    } else {
      return {
        padding: 'py-0.5 px-2',
        fontSize: 'text-[10px] md:text-[11px] font-bold',
        iconSize: 'w-2.5 h-2.5',
      };
    }
  };

  const dynamic = getDynamicStyles();

  return (
    <div className="bg-[#0B132B]/90 backdrop-blur-md p-3 md:p-4 rounded-3xl border-3 border-[#FDE68A]/70 shadow-2xl text-center w-full lg:w-64 xl:w-72 h-full max-h-[500px] xl:max-h-[540px] flex flex-col justify-between overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-center gap-1.5 text-[#FBBF24] font-extrabold text-xs uppercase tracking-wider border-b border-[#FBBF24]/30 pb-2 mb-1.5 flex-shrink-0">
        <Star className="w-3.5 h-3.5 fill-current text-[#FBBF24]" />
        <span>TANGGA AMAL ({count} SOAL)</span>
        <Star className="w-3.5 h-3.5 fill-current text-[#FBBF24]" />
      </div>

      {/* Sliced Levels fitting 100% Height */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 gap-1 my-0.5">
        {levels.map((item) => {
          const isCurrent = currentQuestionIndex === item.level - 1;
          const isPassed = currentQuestionIndex > item.level - 1;

          return (
            <div
              key={item.level}
              className={`flex-1 flex items-center justify-between transition-all duration-300 rounded-xl ${dynamic.padding} ${dynamic.fontSize} ${
                isCurrent
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#166534] text-white shadow-lg border border-[#4ADE80] scale-102 font-black ring-2 ring-[#22C55E]/50'
                  : isPassed
                  ? 'bg-[#1E293B]/70 text-[#4ADE80]'
                  : item.isMilestone
                  ? 'bg-[#FEF3C7]/20 text-[#FCD34D] border border-[#FBBF24]/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Level Indicator with Arrow */}
              <div className="flex items-center gap-1">
                {isCurrent && <span className="text-[#FBBF24] text-[10px]">▶</span>}
                <span>Level {item.level}</span>
                {item.isMilestone && <Star className={`${dynamic.iconSize} fill-current text-[#FCD34D]`} />}
              </div>

              {/* Point Value */}
              <span>+{item.points}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
