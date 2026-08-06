import { Question, Difficulty } from '@/types/game';

export interface ParsedQuestionResult {
  question: Question;
  isValid: boolean;
  missingFields: string[];
}

/**
 * Smart Universal CSV & Excel Direct-Paste Parser
 * Supports Comma (,), Semicolon (;), and Tab (\t) delimiters.
 */
export function parseUniversalCSVText(rawText: string): ParsedQuestionResult[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const results: ParsedQuestionResult[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.startsWith('#') ||
      line.startsWith('?') ||
      line.startsWith('🎉') ||
      line.startsWith('Berikut') ||
      line.startsWith('Tanda') ||
      line.startsWith('SANGAT')
    ) {
      continue; // Skip guide/comment lines
    }
    if (line.toLowerCase().includes('question_text') && line.toLowerCase().includes('option_a')) {
      continue; // Skip header line
    }

    // Detect delimiter: check tabs first (from Excel copy-paste), then semicolons, then commas
    let delimiter = ',';
    if (line.includes('\t')) {
      delimiter = '\t';
    } else if ((line.match(/;/g) || []).length > (line.match(/,/g) || []).length) {
      delimiter = ';';
    }

    // Split line respecting quotes
    const cells = splitCSVLine(line, delimiter);
    if (cells.length < 5) continue; // Skip lines with too few columns

    // Smart Detection: Check if Column 0 is theme_id ('islamic' | 'independence' | 'culture')
    const col0 = (cells[0] || '').toLowerCase().trim();
    let themeId: string | undefined = undefined;
    let categoryName = 'Campuran';
    let difficulty: Difficulty = 'medium';
    let questionText = '';
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let rawCorrect: 'A' | 'B' | 'C' | 'D' = 'A';
    let explanation = '';
    let dalil = '';
    let ustadzHint = '';

    if (['islamic', 'independence', 'culture'].includes(col0)) {
      // Format 1: theme_id, category_name, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, dalil, ustadz_hint
      themeId = col0;
      categoryName = cells[1] || 'Campuran';
      const col2 = (cells[2] || '').toLowerCase().trim();
      difficulty = (col2 === 'easy' || col2 === 'hard' ? col2 : 'medium') as Difficulty;

      questionText = cells[3] || '';
      optA = cells[4] || '';
      optB = cells[5] || '';
      optC = cells[6] || '';
      optD = cells[7] || '';

      const corrCell = (cells[8] || 'A').toUpperCase().replace(/[^A-D]/g, '');
      rawCorrect = (['A', 'B', 'C', 'D'].includes(corrCell) ? corrCell : 'A') as any;

      explanation = cells[9] || 'Penjelasan edukatif kuis Islami.';
      dalil = cells[10] || '';
      ustadzHint = cells[11] || '';
    } else {
      // Format 2: question_text, option_a, option_b, option_c, option_d, correct_option, category_name, difficulty, explanation, dalil, ustadz_hint
      questionText = cells[0] || '';
      optA = cells[1] || '';
      optB = cells[2] || '';
      optC = cells[3] || '';
      optD = cells[4] || '';

      const corrCell = (cells[5] || 'A').toUpperCase().replace(/[^A-D]/g, '');
      rawCorrect = (['A', 'B', 'C', 'D'].includes(corrCell) ? corrCell : 'A') as any;

      categoryName = cells[6] || 'Campuran';
      if (['A', 'B', 'C', 'D', 'easy', 'medium', 'hard'].includes(categoryName.trim())) {
        categoryName = 'Campuran';
      }

      const col7 = (cells[7] || '').toLowerCase().trim();
      if (col7 === 'kahoot' || col7 === 'millionaire') {
        const col8 = (cells[8] || '').toLowerCase().trim();
        difficulty = (col8 === 'easy' || col8 === 'hard' ? col8 : 'medium') as Difficulty;
        explanation = cells[9] || 'Penjelasan edukatif kuis Islami.';
        dalil = cells[10] || '';
        ustadzHint = cells[11] || '';
      } else {
        difficulty = (col7 === 'easy' || col7 === 'hard' ? col7 : 'medium') as Difficulty;
        explanation = cells[8] || 'Penjelasan edukatif kuis Islami.';
        dalil = cells[9] || '';
        ustadzHint = cells[10] || '';
      }
    }

    if (['easy', 'medium', 'hard'].includes(explanation.trim().toLowerCase())) {
      explanation = 'Penjelasan edukatif kuis Islami.';
    }

    // Validate completeness
    const missingFields: string[] = [];
    if (!questionText) missingFields.push('Teks Pertanyaan');
    if (!optA) missingFields.push('Opsi A');
    if (!optB) missingFields.push('Opsi B');
    if (!optC) missingFields.push('Opsi C');
    if (!optD) missingFields.push('Opsi D');

    const isValid = missingFields.length === 0;

    const questionObj: Question = {
      id: `imp-${Date.now()}-${i}`,
      theme_id: themeId as any,
      question_text: questionText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: rawCorrect,
      category_name: categoryName,
      difficulty: difficulty,
      explanation: explanation,
      dalil: dalil,
      ustadz_hint: ustadzHint,
    };

    results.push({
      question: questionObj,
      isValid,
      missingFields,
    });
  }

  return results;
}

/**
 * Splits a CSV line handling quoted entries and custom delimiters
 */
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));

  return result;
}
