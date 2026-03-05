import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the pre-generated JSON map (committed to repo)
const CHAPTER_MAP_JSON = path.join(__dirname, '..', '..', 'src', 'config', 'chapterFolderMap.json');

// Local image folder paths (used only as fallback for local dev scanning)
const LOCAL_IMAGE_DATA_PATH_PRIMARY = path.join(__dirname, '..', '..', '..', 'Questions_Image_Data');
const LOCAL_IMAGE_DATA_PATH_FALLBACK = path.join(__dirname, '..', '..', 'data', 'Questions_Image_Data');
const LOCAL_IMAGE_DATA_PATH = fs.existsSync(LOCAL_IMAGE_DATA_PATH_PRIMARY)
    ? LOCAL_IMAGE_DATA_PATH_PRIMARY
    : LOCAL_IMAGE_DATA_PATH_FALLBACK;

const chapterFolderMap = new Map();
let isInitialized = false;

function normalize(str) {
    return String(str || '').trim().toLowerCase();
}

function scanDirectory(currentPath, depth, context = []) {
    if (!fs.existsSync(currentPath)) return;
    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            const folderName = item.name;
            if (depth < 4) {
                scanDirectory(path.join(currentPath, folderName), depth + 1, [...context, folderName]);
            } else if (depth === 4) {
                const [exam, standard, subject] = context;
                const cleanName = folderName.replace(/^\d+\.\s*/, '');
                const key = `${normalize(exam)}|${normalize(standard)}|${normalize(subject)}|${normalize(cleanName)}`;
                chapterFolderMap.set(key, folderName);
                const exactKey = `${normalize(exam)}|${normalize(standard)}|${normalize(subject)}|${normalize(folderName)}`;
                if (key !== exactKey) chapterFolderMap.set(exactKey, folderName);
            }
        }
    }
}

export function initS3Mapping() {
    if (isInitialized) return;

    // 1. Try loading from pre-generated JSON map (works on both local and EB)
    try {
        if (fs.existsSync(CHAPTER_MAP_JSON)) {
            const raw = fs.readFileSync(CHAPTER_MAP_JSON, 'utf-8');
            const obj = JSON.parse(raw);
            for (const [k, v] of Object.entries(obj)) {
                chapterFolderMap.set(k, v);
            }
            isInitialized = true;
            return;
        }
    } catch (err) {
        // Fall through to local scan
    }

    // 2. Fallback: scan local directory (local dev without JSON file)
    try {
        if (fs.existsSync(LOCAL_IMAGE_DATA_PATH)) {
            scanDirectory(LOCAL_IMAGE_DATA_PATH, 1);
            isInitialized = true;
        }
    } catch (error) {
        // Fail silently
    }
}


export function getS3ChapterFolder(exam, standard, subject, chapterName) {
    if (!isInitialized) initS3Mapping();

    const key = `${normalize(exam)}|${normalize(standard)}|${normalize(subject)}|${normalize(chapterName)}`;

    if (chapterFolderMap.has(key)) {
        return chapterFolderMap.get(key);
    }

    return chapterName;
}
