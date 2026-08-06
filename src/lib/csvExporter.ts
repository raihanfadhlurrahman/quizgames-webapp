import { Question } from '@/types/game';

/**
 * Converts Question array to a downloadable CSV file.
 */
export function exportQuestionsToCSV(questions: Question[], filename: string = 'soal_kuis_kkn_wedomartani.csv') {
  if (!questions || questions.length === 0) {
    alert('Tidak ada data soal yang dapat diexport.');
    return;
  }

  const headers = [
    'theme_id',
    'category_name',
    'difficulty',
    'question_text',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_option',
    'explanation',
    'dalil',
    'ustadz_hint',
  ];

  const escapeCSVField = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = questions.map((q) => [
    escapeCSVField(q.theme_id || 'islamic'),
    escapeCSVField(q.category_name || 'Campuran'),
    escapeCSVField(q.difficulty || 'medium'),
    escapeCSVField(q.question_text || ''),
    escapeCSVField(q.option_a || ''),
    escapeCSVField(q.option_b || ''),
    escapeCSVField(q.option_c || ''),
    escapeCSVField(q.option_d || ''),
    escapeCSVField(q.correct_option || 'A'),
    escapeCSVField(q.explanation || ''),
    escapeCSVField(q.dalil || ''),
    escapeCSVField(q.ustadz_hint || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
