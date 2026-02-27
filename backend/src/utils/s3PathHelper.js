import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look in BOTH possible locations for the image data folder
const LOCAL_IMAGE_DATA_PATH_PRIMARY = path.join(__dirname, '..', '..', '..', 'Questions_Image_Data');   // Project root
const LOCAL_IMAGE_DATA_PATH_FALLBACK = path.join(__dirname, '..', '..', 'data', 'Questions_Image_Data'); // backend/data

// Static JSON fallback for deployed servers that don't have the local image folder
const STATIC_MAP_PATH = path.join(__dirname, 'chapterFolderMap.json');

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
                if (key !== exactKey) {
                    chapterFolderMap.set(exactKey, folderName);
                }
            }
        }
    }
}

function loadStaticMap() {
    try {
        if (fs.existsSync(STATIC_MAP_PATH)) {
            const data = JSON.parse(fs.readFileSync(STATIC_MAP_PATH, 'utf-8'));
            for (const [key, value] of Object.entries(data)) {
                chapterFolderMap.set(key, value);
            }
            console.log(`[s3PathHelper] Loaded ${Object.keys(data).length} entries from static chapterFolderMap.json`);
            return true;
        }
    } catch (err) {
        console.warn('[s3PathHelper] Failed to load static map:', err.message);
    }
    return false;
}

export function initS3Mapping() {
    if (isInitialized) return;

    try {
        // Try scanning the local filesystem first
        if (fs.existsSync(LOCAL_IMAGE_DATA_PATH)) {
            scanDirectory(LOCAL_IMAGE_DATA_PATH, 1);
            console.log(`[s3PathHelper] Scanned local folder: ${LOCAL_IMAGE_DATA_PATH} (${chapterFolderMap.size} entries)`);
            isInitialized = true;
        }

        // If local scan found nothing (or folder doesn't exist), load from static JSON
        if (chapterFolderMap.size === 0) {
            const loaded = loadStaticMap();
            if (loaded) {
                isInitialized = true;
            }
        }
    } catch (error) {
        // Fail silently if unable to scan, try static map as last resort
        loadStaticMap();
        isInitialized = chapterFolderMap.size > 0;
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
