'use client';

import React, { useRef, useEffect } from 'react';
import { Download, Award } from 'lucide-react';
import { PlayerProfile } from '@/types/game';

interface CertificateGeneratorProps {
  player: PlayerProfile;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  player,
  totalScore,
  correctCount,
  totalQuestions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    const bgImage = new Image();
    bgImage.src = '/image/backgroundGame2.jpg';

    const renderCertificate = () => {
      // Draw background image
      if (bgImage.complete && bgImage.naturalWidth !== 0) {
        ctx.drawImage(bgImage, 0, 0, 800, 500);
        // Subtle dark overlay for contrast
        ctx.fillStyle = 'rgba(11, 19, 43, 0.45)';
        ctx.fillRect(0, 0, 800, 500);
      } else {
        const bgGradient = ctx.createLinearGradient(0, 0, 800, 500);
        bgGradient.addColorStop(0, '#0F172A');
        bgGradient.addColorStop(1, '#0B132B');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, 800, 500);
      }

      // Outer Gold Double Frame
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 460);

      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(26, 26, 748, 448);

      // Corner Ornaments
      const drawCornerDot = (x: number, y: number) => {
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCornerDot(26, 26);
      drawCornerDot(774, 26);
      drawCornerDot(26, 474);
      drawCornerDot(774, 474);

      // Header Text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(' KKN WEDOMARTANI • MEDIA SOSIALISASI EDULearning', 400, 65);

      // Certificate Title
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('SERTIFIKAT KELULUSAN', 400, 105);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('ISLAMIC MILLIONAIRE QUIZ', 400, 128);

      // Divider Line
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(280, 142);
      ctx.lineTo(520, 142);
      ctx.stroke();

      // Recipient Statement
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '13px sans-serif';
      ctx.fillText('Diberikan dengan bangga kepada:', 400, 175);

      // Player Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(player.name, 400, 225);

      // Underline Player Name
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(250, 238);
      ctx.lineTo(550, 238);
      ctx.stroke();

      // Statement
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px sans-serif';
      ctx.fillText(
        `Telah berhasil menyelesaikan ${correctCount} dari ${totalQuestions} pertanyaan`,
        400,
        275
      );
      ctx.fillText('edukasi Islami dengan total skor', 400, 295);

      // Score Badge Box
      ctx.fillStyle = 'rgba(11, 19, 43, 0.85)';
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(280, 318, 240, 56, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FBBF24';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(`${totalScore} POIN`, 400, 356);

      // Footer Information Grid
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Tanggal', 180, 420);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(currentDate, 180, 438);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Penanggung Jawab Program', 400, 420);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Tim KKN Wedomartani', 400, 438);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Platform', 620, 420);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Islamic Millionaire Web App', 620, 438);
    };

    bgImage.onload = renderCertificate;
    if (bgImage.complete) {
      renderCertificate();
    }
  }, [player, totalScore, correctCount, totalQuestions]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Sertifikat-Islamic-Millionaire-${player.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-2.5 text-center">
      <div className="flex items-center justify-center gap-1.5 text-gold-400 font-bold text-xs">
        <Award className="w-4 h-4 text-gold-400" />
        <span>Sertifikat Digital Otomatis</span>
      </div>

      {/* Canvas Display */}
      <div className="overflow-x-auto p-2 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-xl max-w-lg mx-auto">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[260px] md:max-h-[300px] h-auto mx-auto rounded-xl shadow-md border border-slate-800 object-contain"
        />
      </div>

      <button
        onClick={handleDownload}
        className="emerald-gradient-btn px-5 py-2.5 rounded-xl text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer hover:scale-103 transition"
      >
        <Download className="w-4 h-4" />
        <span>UNDUH SERTIFIKAT (PNG)</span>
      </button>
    </div>
  );
};
