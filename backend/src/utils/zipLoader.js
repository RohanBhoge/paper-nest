import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZIP_POSSIBLE_PATHS = [
  path.join(__dirname, '..', '..', 'data', 'data.zip'),
  path.join(__dirname, '..', '..', 'data', 'datazip'),
  path.join(__dirname, '..', '..', 'data', 'datazip.zip'),
  path.join(__dirname, '..', '..', '..', 'data', 'data.zip'),
  path.join(__dirname, '..', '..', '..', 'backend', 'data', 'data.zip'),
];

let _zipCache = { timestamp: 0, questions: null, sourcePath: null };

/**
 * Normalizes a string key for comparison.
 */
function normalizeKey(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hash function for seeding.
 */
function xfnv1a(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return () => (h += 0x6d2b79f5) >>> 0;
}

/**
 * Mulberry32 random number generator.
 */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Finds the zip file index.
 */
function findZipPath() {
  for (const p of ZIP_POSSIBLE_PATHS) {
    try {
      if (fs.existsSync(p)) {
        console.log('✅ Found ZIP file at path:', p);
        return p;
      }
    } catch (e) {
      console.error(`❌ Error checking path ${p}: ${e.message}`);
    }
  }
  console.log(
    '❌ findZipPath failed: No valid zip file found in possible paths.'
  );
  return null;
}

/**
 * Tries to parse JSON from text.
 */
function tryParseJsonText(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    const m = raw.match(/(\[.*\]|\{.*\})/s);
    if (m) {
      try {
        return JSON.parse(m[1]);
      } catch { }
    }
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const arr = [];
    for (const L of lines) {
      try {
        arr.push(JSON.parse(L));
      } catch { }
    }
    if (arr.length) return arr;
    return null;
  }
}

/**
 * Loads questions from the zip file.
 */
async function loadQuestionsFromZip({ force = false } = {}) {
  const zipPath = findZipPath();
  if (!zipPath)
    return { ok: false, error: 'Zip not found', zipPath: null, questions: [] };

  const stat = fs.statSync(zipPath);
  const mtime = stat.mtimeMs || stat.mtime;

  if (
    !force &&
    _zipCache.questions &&
    _zipCache.sourcePath === zipPath &&
    _zipCache.timestamp === mtime
  ) {
    return { ok: true, zipPath, questions: _zipCache.questions };
  }

  try {
    const directory = await unzipper.Open.file(zipPath);

    const all = [];

    const jsonEntries = directory.files.filter((f) => {
      if (!f.path) return false;
      const p = String(f.path).toLowerCase();
      return (
        p.endsWith('.json') ||
        p.endsWith('.jsonl') ||
        p.endsWith('.ndjson') ||
        p.endsWith('.txt')
      );
    });

    for (const entry of jsonEntries) {
      try {
        const buffer = await entry.buffer();
        const parsed = tryParseJsonText(buffer.toString('utf8'));
        if (!parsed) continue;

        let entryPath = String(entry.path || '')
          .replace(/\\/g, '/')
          .replace(/^\/+/, '');
        const parts = entryPath.split('/').filter(Boolean);
        const meta = { exam: null, standard: null, subject: null, entryPath };

        if (parts.length >= 4) {
          meta.exam = parts[1] ?? null;
          meta.standard = parts[2] ?? null;
          meta.subject = parts[3] ?? null;
        } else if (parts.length === 3) {
          meta.exam = parts[1] ?? null;
          meta.subject = parts[2] ?? null;
        } else if (parts.length === 2) {
          meta.subject = parts[1] ?? null;
        }

        const pushArray = (arr) => {
          for (const q of arr) {
            const qq = Object.assign({}, q);
            qq._meta = Object.assign({}, qq._meta || {}, meta);
            all.push(qq);
          }
        };

        if (Array.isArray(parsed)) pushArray(parsed);
        else if (parsed && Array.isArray(parsed.questions))
          pushArray(parsed.questions);
        else if (parsed && parsed.question) pushArray([parsed]);
        else {
          const arrVal = Object.values(parsed).find((v) => Array.isArray(v));
          if (arrVal) pushArray(arrVal);
        }
      } catch (err) {
        console.warn('Failed parse entry', entry.path, err?.message || err);
      }
    }

    _zipCache = { timestamp: mtime, questions: all, sourcePath: zipPath };
    return { ok: true, zipPath, questions: all };
  } catch (err) {
    console.error(
      `[Zip Loader] ❌ Failed to open/parse ZIP file at path: ${zipPath}`
    );
    console.error(`[Zip Loader] Unzipper Error Details:`, err.message || err);

    return {
      ok: false,
      error: `Failed to process ZIP file (${path.basename(zipPath)}): ${String(
        err.message || err
      )}`,
      zipPath,
      questions: [],
    };
  }
}

/**
 * Generates a random seed.
 */
function makeSeed() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Converts LaTeX to text.
 */
function latexToText(sIn) {
  if (sIn == null) return '';
  let s = String(sIn);

  s = s
    .replace(/^\$\$(.*)\$\$$/s, '$1')
    .replace(/^\$(.*)\$$/s, '$1')
    .replace(/^\\\((.*)\\\)$/s, '$1')
    .replace(/^\\\[(.*)\\\]$/s, '$1');
  s = s.replace(/\\text\s*\{([^}]*)\}/g, '$1');
  s = s.replace(/\\vec\s*\{([A-Za-z])\}/g, (_, letter) => letter || letter);
  s = s
    .replace(/\\pi\b/g, 'π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β');
  s = s
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\pm\b/g, '±')
    .replace(/\\,/g, ' ');
  s = s.replace(/\\sqrt\s*\{([^}]*)\}/g, (m, p) => `√${p}`);
  const fracRe = /\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/;
  while (fracRe.test(s)) s = s.replace(fracRe, '$1/$2');
  s = s.replace(/\^\{?\\circ\}?/g, '°').replace(/\\deg\b/g, '°');
  s = s.replace(/\^\{(-?\d+)\}/g, (_, digits) =>
    digits
      .split('')
      .map(
        (ch) =>
        ({
          0: '⁰',
          1: '¹',
          2: '²',
          3: '³',
          4: '⁴',
          5: '⁵',
          6: '⁶',
          7: '⁷',
          8: '⁸',
          9: '⁹',
          '-': '⁻',
        }[ch] || ch)
      )
      .join('')
  );
  s = s.replace(
    /\^(-?\d)/g,
    (_, n) =>
    ({
      0: '⁰',
      1: '¹',
      2: '²',
      3: '³',
      4: '⁴',
      5: '⁵',
      6: '⁶',
      7: '⁷',
      8: '⁸',
      9: '⁹',
      '-': '⁻',
    }[n] || `^${n}`)
  );
  s = s.replace(
    /_([0-9])/g,
    (_, n) =>
    ({
      0: '₀',
      1: '₁',
      2: '₂',
      3: '₃',
      4: '₄',
      5: '₅',
      6: '₆',
      7: '₇',
      8: '₈',
      9: '₉',
    }[n] || `_${n}`)
  );
  s = s.replace(/\\(cos|sin|tan|log|ln|sec|cosec|cot)\b/g, '$1');
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  s = s.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Checks if a question matches the filters.
 */
function matchesFiltersObj(q, { exam, standardArr, subjectArr, chaptersArr }) {
  const nExamFilter = normalizeKey(exam);

  const nStdFilters = Array.isArray(standardArr)
    ? standardArr.map(normalizeKey).filter(Boolean)
    : [];
  const nSubjFilters = Array.isArray(subjectArr)
    ? subjectArr.map(normalizeKey).filter(Boolean)
    : [];

  const qExam = normalizeKey(
    q.exam ?? q.exam_name ?? (q._meta && q._meta.exam) ?? ''
  );
  const qStd = normalizeKey(
    q.standard ?? q.class ?? (q._meta && q._meta.standard) ?? ''
  );
  const qSubj = normalizeKey(
    q._meta && q._meta.subject
      ? q._meta.subject
      : q.subject ?? q.chapter ?? q.topic ?? ''
  );
  if (
    nExamFilter &&
    !qExam.includes(nExamFilter) &&
    !nExamFilter.includes(qExam)
  )
    return false;

  if (nStdFilters.length > 0) {
    const isStandardMatch = nStdFilters.some(
      (f) => qStd.includes(f) || f.includes(qStd)
    );
    if (!isStandardMatch) return false;
  }

  if (nSubjFilters.length > 0) {
    const isSubjectMatch = nSubjFilters.some(
      (f) => qSubj.includes(f) || f.includes(qSubj)
    );
    if (!isSubjectMatch) return false;
  }

  if (Array.isArray(chaptersArr) && chaptersArr.length > 0) {
    const normFilters = chaptersArr.map((c) => normalizeKey(c)).filter(Boolean);
    const qch = normalizeKey(
      q.chapter ?? q.chapter_name ?? (q._meta && q._meta.entryPath) ?? ''
    );
    const isChapterMatch = normFilters.some(
      (f) => qch.includes(f) || f.includes(qch)
    );
    if (!isChapterMatch) return false;
  }

  return true;
}

/**
 * Shuffles an array using a seeded random number generator.
 */
function seededShuffle(array, seedStr) {
  const seedFn = xfnv1a(seedStr || 'default')();
  const rand = mulberry32(seedFn);
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export {
  makeSeed,
  latexToText,
  seededShuffle,
  loadQuestionsFromZip,
  matchesFiltersObj,
  normalizeKey,
};
