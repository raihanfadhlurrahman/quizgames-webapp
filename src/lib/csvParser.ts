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

    const questionText = cells[0] || '';
    const optA = cells[1] || '';
    const optB = cells[2] || '';
    const optC = cells[3] || '';
    const optD = cells[4] || '';
    let rawCorrect = (cells[5] || 'A').toUpperCase().replace(/[^A-D]/g, '') as 'A' | 'B' | 'C' | 'D';
    if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) rawCorrect = 'A';

    // Clean up category_name from shifted column values (e.g. 'A', 'B', 'C', 'D', 'easy', 'medium', 'hard')
    let categoryName = cells[6] || 'Campuran';
    if (['A', 'B', 'C', 'D', 'easy', 'medium', 'hard'].includes(categoryName.trim())) {
      categoryName = 'Campuran';
    }

    // Smart detection for game_type & difficulty
    let gameType: 'millionaire' | 'kahoot' = 'millionaire';
    let difficulty: Difficulty = 'medium';
    let expIdx = 8;
    let dalilIdx = 9;
    let hintIdx = 10;

    const col7 = (cells[7] || '').toLowerCase().trim();
    if (col7 === 'kahoot' || col7 === 'millionaire') {
      gameType = col7 as any;
      const col8 = (cells[8] || '').toLowerCase().trim();
      difficulty = (col8 === 'easy' || col8 === 'hard' ? col8 : 'medium') as Difficulty;
      expIdx = 9;
      dalilIdx = 10;
      hintIdx = 11;
    } else {
      difficulty = (col7 === 'easy' || col7 === 'hard' ? col7 : 'medium') as Difficulty;
    }

    let explanation = cells[expIdx] || 'Penjelasan edukatif kuis Islami.';
    if (['easy', 'medium', 'hard'].includes(explanation.trim().toLowerCase())) {
      explanation = 'Penjelasan edukatif kuis Islami.';
    }
    const dalil = cells[dalilIdx] || '';
    const ustadzHint = cells[hintIdx] || '';

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
      question_text: questionText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: rawCorrect,
      category_name: categoryName,
      game_type: gameType,
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
