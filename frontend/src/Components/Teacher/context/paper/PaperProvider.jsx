import PaperContext from "./paperContext.jsx";
import { useState } from "react";

const PaperProvider = (props) => {
  const [form, setForm] = useState({
    paperId: "",
    examName: "",
    className: "",
    subjectName: "",
    examDate: "",
    totalMarks: "",
  });

  const [paperData, setPaperData] = useState({
    exam: "",
    standard: "",
    subject: "",
    chapters: [],
    count: 10,
  });

  const [exam, setExam] = useState("");
  const [standards, setStandards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [backendPaperData, setBackendPaperData] = useState(null);
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);
  const [marks, setMarks] = useState(null);
  const [examDate, setExamDate] = useState("");
  const [examDuration, setExamDuration] = useState("");

  console.log("replacement Data", exam, standards, subjects);

  return (
    <PaperContext.Provider
      value={{
        form,
        setForm,
        paperData,
        setPaperData,
        exam,
        setExam,
        standards,
        setStandards,
        subjects,
        setSubjects,
        backendPaperData,
        setBackendPaperData,
        showGenerateOptions,
        setShowGenerateOptions,
        marks,
        setMarks,
        examDate,
        setExamDate,
        examDuration,
        setExamDuration,
      }}
    >
      {props.children}
    </PaperContext.Provider>
  );
};

export default PaperProvider;
