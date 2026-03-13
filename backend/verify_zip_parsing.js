const entryPath = 'JEE/11/Chemistry/File.json';
const parts = entryPath.split('/').filter(Boolean);
const meta = { exam: null, standard: null, subject: null, entryPath };

if (parts.length >= 4) {
    meta.exam = parts[1] ?? null;
    meta.standard = parts[2] ?? null;
    meta.subject = parts[3] ?? null;
}

console.log('--- Path: JEE/11/Chemistry/File.json ---');
console.log('Exam:', meta.exam);
console.log('Standard:', meta.standard);
console.log('Subject:', meta.subject);

const entryPath2 = 'Data/JEE/11/Chemistry/File.json';
const parts2 = entryPath2.split('/').filter(Boolean);
const meta2 = { exam: null, standard: null, subject: null, entryPath };

if (parts2.length >= 4) {
    meta2.exam = parts2[1] ?? null;
    meta2.standard = parts2[2] ?? null;
    meta2.subject = parts2[3] ?? null;
}

console.log('\n--- Path: Data/JEE/11/Chemistry/File.json ---');
console.log('Exam:', meta2.exam);
console.log('Standard:', meta2.standard);
console.log('Subject:', meta2.subject);