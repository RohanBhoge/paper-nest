import {
  loadQuestionsFromZip,
  matchesFiltersObj,
  seededShuffle,
  latexToText,
  makeSeed,
} from './zipLoader.js';

import { getS3ChapterFolder } from './s3PathHelper.js';

const getS3Url = (exam, std, subj, chapterFolder, filename) => {
  if (!filename) return null;
  const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (!bucketName || !region) return null;

  const pExam = encodeURIComponent(exam);
  const pStd = encodeURIComponent(std);
  const pSubj = encodeURIComponent(subj);
  const pChap = encodeURIComponent(chapterFolder);
  const pFile = encodeURIComponent(filename);

  return `https://${bucketName}.s3.${region}.amazonaws.com/Questions_Image_Data/${pExam}/${pStd}/${pSubj}/${pChap}/${pFile}`;
};
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

    // Helpers to process arrays
    const mapImages = (imgArray) => {
      if (!Array.isArray(imgArray)) return [];
      return imgArray.map(imgName => ({
        name: imgName,
        url: getS3Url(mExam, mStd, mSubj, s3Folder, imgName)
      }));
    };

    // Attach to question object in list
    const qItem = questionList[questionList.length - 1]; // Current Item
    qItem.question_images = mapImages(q.question_images);
    qItem.option_images = mapImages(q.option_images);
    qItem.solution_images = mapImages(q.solution_images);

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
