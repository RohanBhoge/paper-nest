import {
  loadQuestionsFromZip,
  matchesFiltersObj,
  seededShuffle,
  latexToText,
  makeSeed,
} from './zipLoader.js';

import { getS3ChapterFolder } from './s3PathHelper.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const _s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined, // Falls back to IAM role on EC2/EB
});

/**
 * Generates a presigned URL for an S3 object.
 * Works regardless of bucket public access settings — signed with backend IAM credentials.
 * URL expires in 1 hour (3600 seconds).
 */
async function getS3PresignedUrl(exam, std, subj, chapterFolder, filename) {
  if (!filename) return null;
  const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
  if (!bucketName) return null;

  const key = `Questions_Image_Data/${exam}/${std}/${subj}/${chapterFolder}/${filename}`;

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const url = await getSignedUrl(_s3Client, command, { expiresIn: 3600 });
    return url;
  } catch {
    return null;
  }
}
function generatePaperId(exam, standard) {
  const examCode = String(exam || 'EX')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');

  const year = new Date().getFullYear();
  const stdCode = String(standard || 'XX').slice(0, 2);

  const timestamp = Date.now();
  const serial = String(timestamp).slice(-6);

  return `${examCode}-${year}-${stdCode}-${serial}`;
}

function formatPaperContent(selectedQuestions) {
  let paperQuestions = '';
  let paperAnswers = '';
  let questionList = [];

  for (let i = 0; i < selectedQuestions.length; i++) {
    const q = selectedQuestions[i];
    const qNo = i + 1;
    const qText = latexToText(
      q.question ?? q.text ?? q.question_latex ?? '(No Question Text)'
    );
    const qAnswer = latexToText(
      q.answer ?? q.answerText ?? q.correct ?? q.correctAnswer ?? '(No Answer)'
    );

    questionList.push({
      qno: qNo,
      question: qText,
      options: q.options ? q.options.map(latexToText) : [],
      answer: qAnswer,
      id: q.id,
      chapter: q.chapter ?? q._meta?.entryPath,
      marks: Number(q.marks ?? q.mark ?? 1) || 0,
      solution: q.solution || '',
    });

    const meta = q._meta || {};
    const mExam = meta.exam || 'CET'; // Default or from Q
    const mStd = meta.standard || '11';
    const mSubj = meta.subject || 'Physics';
    const mChapterName = q.chapter || meta.entryPath || '';
    const s3Folder = getS3ChapterFolder(mExam, mStd, mSubj, mChapterName);

    // Helpers to process arrays — async to generate presigned URLs
    const mapImages = async (imgArray) => {
      if (!Array.isArray(imgArray)) return [];
      return Promise.all(imgArray.map(async imgName => ({
        name: imgName,
        url: await getS3PresignedUrl(mExam, mStd, mSubj, s3Folder, imgName)
      })));
    };

    // Attach to question object in list
    const qItem = questionList[questionList.length - 1]; // Current Item
    qItem.question_images = await mapImages(q.question_images);
    qItem.option_images = await mapImages(q.option_images);
    qItem.solution_images = await mapImages(q.solution_images);

    paperQuestions += `Q${qNo}: ${qText}`;
    if (i < selectedQuestions.length - 1) {
      paperQuestions += ' | ';
    }

    paperAnswers += `A${qNo}: ${qAnswer}`;
    if (i < selectedQuestions.length - 1) {
      paperAnswers += ' | ';
    }
  }

  return {
    paper_questions: paperQuestions.trim(),
    paper_answers: paperAnswers.trim(),
    question_list: questionList,
  };
}

async function selectQuestions(params) {
  const {
    exam,
    standard,
    subject,
    chapters = [],
    fixed = false,
    count = null,
    seed = null,
  } = params;

  const standardsArr = Array.isArray(standard)
    ? standard.map((s) => String(s).trim())
    : String(standard || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const subjectsArr = Array.isArray(subject)
    ? subject.map((s) => String(s).trim())
    : String(subject || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const chaptersArr = Array.isArray(chapters)
    ? chapters.map(String).filter(Boolean)
    : String(chapters || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  const zipRes = await loadQuestionsFromZip();

  if (!zipRes.ok) {
    const loadError = new Error(`Zip load failed: ${zipRes.error}`);
    loadError.status = 500;
    throw loadError;
  }

  const allQ = zipRes.questions || [];
  const filtered = allQ.filter((q) =>
    matchesFiltersObj(q, {
      exam,
      standardArr: standardsArr,
      subjectArr: subjectsArr,
      chaptersArr,
    })
  );

  if (filtered.length === 0) {
    const filterError = new Error('No questions found matching the criteria.');
    filterError.status = 404;
    throw filterError;
  }

  const actualSeed = seed || makeSeed();
  let selected;
  const fixedBool = String(fixed).toLowerCase() === 'true' || fixed === true;
  const countNum = Number(count);

  if (fixedBool && chaptersArr.length > 0) {
    selected = seededShuffle(filtered, actualSeed);
  } else if (countNum > 0 && countNum < filtered.length) {
    selected = fixedBool
      ? filtered.slice(0, countNum)
      : seededShuffle(filtered, actualSeed).slice(0, countNum);
  } else {
    selected = fixedBool ? filtered : seededShuffle(filtered, actualSeed);
  }

  return {
    ok: true,
    selected,
    seed: actualSeed,
    zipPath: zipRes.zipPath || '',
  };
}

export { generatePaperId, formatPaperContent, selectQuestions };
