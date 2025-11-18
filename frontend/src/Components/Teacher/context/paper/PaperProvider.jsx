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

  return (
    <PaperContext.Provider
      value={{
        form,
        setForm,
        paperData,
        setPaperData,
      }}
    >
      {props.children}
    </PaperContext.Provider>
  );
};

export default PaperProvider;
