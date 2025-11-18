import React, { useState } from 'react';
import Sidebar from '../Components/Notes/Layout/Sidebar';
import TopBar from '../Components/Notes/Layout/TopBar';
import DashboardContent from '../Components/Notes/Dashboard/DashboardContent';
import ExamSelection from '../Components/Notes/Exam/ExamSelection';
import ChaptersPage from '../Components/Notes/Chapters/ChaptersPage';
import NotesModal from '../Components/Notes/Modal/NotesModal';
import SettingsPage from '../Components/Teacher/pages/SettingsPage'
import QuizSection from '../Components/Notes/Quiz/QuizSection';
import { Calendar } from 'lucide-react';

// Chapters Data for all exams (Updated from Names of Chapters.pdf)

const chaptersData = {
  CET: {
    Physics: {
      "11th": [
        "1. Motion in Plane",
        "2. Laws of Motion",
        "3. Gravitation",
        "4. Thermal Properties of Matter",
        "5. Sound",
        "6. Optics",
        "7. Electrostatics",
        "8. Semiconductors",
        "9. Vector",
        "10. Error Analysis"
      ],
      "12th": [
        "1. Rotational Dynamics",
        "2. Mechanical Properties of Fluids",
        "3. Kinetic Theory of Gases and Radiation",
        "4. Thermodynamics",
        "5. Oscillation",
        "6. Superposition of Waves",
        "7. Wave Optics",
        "8. Electrostatics",
        "9. Current Electricity",
        "10. Magnetic Field Due to Electric Current",
        "11. Magnetic Materials",
        "12. Electromagnetic Induction",
        "13. AC Circuit",
        "14. Dual Nature of Radiation and Matter",
        "15. Structure of Atom and Nucleus",
        "16. Semiconductor Devices"
      ]
    },
    Chemistry: {
      "11th": [
        "1. Some Basic Concepts of Chemistry",
        "2. Structure of Atom",
        "3. Chemical Bonding",
        "4. Redox Reaction",
        "5. Elements of Group 1 and 2",
        "6. State of Matter",
        "7. Absorption and Colloids",
        "8. Basic Principle of Organic Chemistry",
        "9. Hydrocarbons",
        "10. Chemistry in Everyday Life"
      ],
      "12th": [
        "1. Solid State",
        "2. Solutions",
        "3. Ionic Equilibria",
        "4. Chemical Thermodynamics",
        "5. Electrochemistry",
        "6. Chemical Kinetics",
        "7. Elements of Group 16,17 and 18",
        "8. Transition and Inner Transition Elements",
        "9. Coordination Compounds",
        "10. Halogen Derivatives",
        "11. Alcohol Phenol and Ether",
        "12. Aldehyde Ketone and Carboxylic Acid",
        "13. Amines",
        "14. Biomolecules",
        "15. Introduction of Polymer Chemistry",
        "16. Green Chemistry and Nanochemistry"
      ]
    },
    Mathematics: {
      "11th": [
        "1. Trigonometry 2",
        "2. Straight Line",
        "3. Circle",
        "4. Conic Section",
        "5. Probability",
        "6. Complex Number",
        "7. Permutation and Combination",
        "8. Functions",
        "9. Limits",
        "10. Continuity"
      ],
      "12th": [
        "1. Mathematical Logic",
        "2. Matrices",
        "3. Trigonometric Functions",
        "4. Pair of Straight Line",
        "5. Vector",
        "6. Line and Plane",
        "7. Linear Programming",
        "8. Differentiation",
        "9. Application of Derivatives",
        "10. Indefinite Integration",
        "11. Definite Integration",
        "12. Application of Definite Integration",
        "13. Differential Equations",
        "14. Probability Distribution",
        "15. Binomial Distribution"
      ]
    },
    Biology: {
      "11th": [
        "1. Biomolecules",
        "2. Respiration and Energy Transfer",
        "3. Human Nutrition",
        "4. Excretion and Osmoregulation"
      ],
      "12th": [
        "1. Reproduction in Lower and Higher Plants",
        "2. Reproduction in Lower and Higher Animals",
        "3. Inheritance and Variation",
        "4. Molecular Basis of Inheritance",
        "5. Origin and Evolution of Life",
        "6. Plant Water Relations",
        "7. Plant Growth and Mineral Nutrition",
        "8. Respiration and Circulation",
        "9. Control and Coordination",
        "10. Human Health and Disease",
        "11. Enhancement of Food Production",
        "12. Biotechnology",
        "13. Organism and Population",
        "14. Ecosystem and Energy Flow",
        "15. Biodiversity Conservation and Environmental Management"
      ]
    }
  },

  JEE: {
    Physics: {
      "11th": [
        "1. Physical World and Measurement",
        "2. Motion in a Straight Line",
        "3. Motion in a Plane",
        "4. Laws of Motion",
        "5. Work Energy and Power",
        "6. Motion of System of Particles and Rigid Body",
        "7. Gravitation",
        "8. Properties of Bulk Matter",
        "9. Thermodynamics",
        "10. Behaviour of Perfect Gas and Kinetic Theory",
        "11. Oscillations",
        "12. Waves"
      ],
      "12th": [
        "1. Electrostatics",
        "2. Current Electricity",
        "3. Magnetic Effects of Current and Magnetism",
        "4. Electromagnetic Induction",
        "5. Alternating Currents",
        "6. Semiconductor Electronics",
        "7. Communication Systems",
        "8. Ray Optics",
        "9. Wave Optics",
        "10. Dual Nature of Matter and Radiation",
        "11. Atoms",
        "12. Nuclei"
      ]
    },
    Chemistry: {
      "11th": [
        "1. Some Basic Concepts of Chemistry",
        "2. Structure of Atom",
        "3. Classification of Elements and Periodicity in Properties",
        "4. Chemical Bonding and Molecular Structure",
        "5. States of Matter: Gases and Liquids",
        "6. Thermodynamics",
        "7. Equilibrium",
        "8. Redox Reactions",
        "9. Hydrogen",
        "10. S-Block Element",
        "11. Some P-Block Elements",
        "12. Organic Chemistry - Some Basic Principles and Techniques",
        "13. Hydrocarbons",
        "14. Environmental Chemistry"
      ],
      "12th": [
        "1. Solutions",
        "2. Chemistry in Everyday Life",
        "3. Polymers",
        "4. Biomolecules",
        "5. Organic Compounds Containing Nitrogen",
        "6. Aldehydes, Ketones and Carboxylic Acids",
        "7. Alcohols, Phenols and Ethers",
        "8. Haloalkanes and Haloarenes",
        "9. Coordination Compounds",
        "10. D and F Block Elements",
        "11. P-Block Elements",
        "12. General Principles and Processes of Isolation of Elements",
        "13. Surface Chemistry",
        "14. Chemical Kinetics",
        "15. Electrochemistry",
        "16. Solid State",
        "17. Practical Chemistry"
      ]
    },
    Mathematics: {
      "11th": [
        "1. Sets",
        "2. Relations and Functions",
        "3. Complex Numbers and Quadratic Equations",
        "4. Permutations and Combinations",
        "5. Principle of Mathematical Induction",
        "6. Binomial Theorem",
        "7. Sequences and Series",
        "8. Statistics",
        "9. Probability",
        "10. Trigonometric Functions",
        "11. Trigonometric Functions1",
        "12. Limits"
      ],
      "12th": [
        "1. Matrices",
        "2. Mathematical Logic",
        "3. Coordinate Geometry",
        "4. Continuity",
        "5. Limits and Derivative",
        "6. Integration",
        "7. Definite Integration",
        "8. Application of Definite Integrals",
        "9. Differential Equations",
        "10. 3 Dimensional Geometry",
        "11. Vector",
        "12. Applications Derivatives",
        "13. Straight Line",
        "14. Conic Section"
      ]
    }
  },

  NEET: {
    Physics: {
      "11th": [
        "1. Physical World and Measurement",
        "2. Motion in a Straight Line",
        "3. Motion in a Plane",
        "4. Laws of Motion",
        "5. Work Energy and Power",
        "6. Motion of System of Particles and Rigid Body",
        "7. Gravitation",
        "8. Properties of Bulk Matter",
        "9. Thermodynamics",
        "10. Behaviour of Perfect Gas and Kinetic Theory",
        "11. Oscillations",
        "12. Waves"
      ],
      "12th": [
        "1. Electrostatics",
        "2. Current Electricity",
        "3. Magnetic Effects of Current and Magnetism",
        "4. Electromagnetic Induction",
        "5. Alternating Currents",
        "6. Semiconductor Electronics",
        "7. Communication Systems",
        "8. Ray Optics",
        "9. Wave Optics",
        "10. Dual Nature of Matter and Radiation",
        "11. Atoms",
        "12. Nuclei"
      ]
    },
    Chemistry: {
      "11th": [
        "1. Some Basic Concepts of Chemistry",
        "2. Structure of Atom",
        "3. Classification of Elements and Periodicity in Properties",
        "4. Chemical Bonding and Molecular Structure",
        "5. States of Matter: Gases and Liquids",
        "6. Thermodynamics",
        "7. Equilibrium",
        "8. Redox Reactions",
        "9. Hydrogen",
        "10. S-Block Element",
        "11. Some P-Block Elements",
        "12. Organic Chemistry - Some Basic Principles and Techniques",
        "13. Hydrocarbons",
        "14. Environmental Chemistry"
      ],
      "12th": [
        "1. Solutions",
        "2. Chemistry in Everyday Life",
        "3. Polymers",
        "4. Biomolecules",
        "5. Organic Compounds Containing Nitrogen",
        "6. Aldehydes, Ketones and Carboxylic Acids",
        "7. Alcohols, Phenols and Ethers",
        "8. Haloalkanes and Haloarenes",
        "9. Coordination Compounds",
        "10. D and F Block Elements",
        "11. P-Block Elements",
        "12. General Principles and Processes of Isolation of Elements",
        "13. Surface Chemistry",
        "14. Chemical Kinetics",
        "15. Electrochemistry",
        "16. Solid State",
        "17. Practical Chemistry"
      ]
    },
    Biology: {
      Botany: {
        "11th": [
          "1. Biological Classification",
          "2. Plant Kingdom",
          "3. Anatomy of Flowering Plants",
          "4. Cell-The Unit of Life",
          "5. Cell Cycle and Cell Division",
          "6. Transport in Plants",
          "7. Mineral Nutrition",
          "8. Photosynthesis in Higher Plants",
          "9. Respiration in Plants",
          "10. Plant Growth and Development",
          "11. The Living World",
          "12. Morphology of Flowering Plants"
        ],
        "12th": [
          "1. Reproduction in Organisms",
          "2. Sexual Reproduction in Flowering Plants",
          "3. Principles of Inheritance and Variation",
          "4. Molecular Basis of Inheritance",
          "5. Microbes in Human Welfare",
          "6. Organisms and Populations",
          "7. Ecosystem",
          "8. Environmental Issues",
          "9. Biodiversity and Its Conservation"
        ]
      },
      Zoology: {
        "11th": [
          "1. Animal Kingdom",
          "2. Structural Organisation in Animals",
          "3. Biomolecules",
          "4. Digestion and Absorption",
          "5. Breathing and Exchange of Gases",
          "6. Body Fluids and Circulation",
          "7. Excretory Product and Their Elimination",
          "8. Locomotion and Movement",
          "9. Neural Control and Coordination",
          "10. Chemical Coordination and Integration"
        ],
        "12th": [
          "1. Human Reproduction",
          "2. Reproductive Health",
          "3. Evolution",
          "4. Human Health and Diseases",
          "5. Strategies for Enhancement in Food Production",
          "6. Biotechnology and Its Applications",
          "7. Biotechnology - Principles and Processes"
        ]
      }
    }
  }
};


const examSubjects = {
  CET: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], // Include Biology here
  JEE: ['Physics', 'Chemistry', 'Mathematics'],           // No Biology
  NEET: ['Physics', 'Chemistry', 'Biology']              // Include Biology
};

const NotesDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const notices = [
    { text: "Class 12 Pre-Boards from 30 Oct.", isNew: true },
    { text: "Physics Lab sessions start next week", isNew: true },
    { text: "Chemistry doubt clearing session on Friday", isNew: false },
    { text: "Mathematics Mock Test - 25th September", isNew: false },
    { text: "Biology Chapter revision classes", isNew: false },
    { text: "Annual Science Exhibition preparations", isNew: false },
    { text: "Parent-Teacher meeting scheduled for October 5th", isNew: true },
    { text: "Holiday homework submission deadline", isNew: false }
  ];

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setSelectedSubject(null);
    setActiveSection('exam');
    setIsSidebarOpen(false);
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    const examData = chaptersData[selectedExam][subject];
    setChapters(examData);
    setActiveSection('chapters');
    setIsSidebarOpen(false);
  };

  const openNotesModal = (chapter) => {
    setModalContent(chapter);
    setModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <TopBar setIsSidebarOpen={setIsSidebarOpen} />
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <div className="overflow-y-auto w-full p-8">
        {activeSection === 'dashboard' && (
          <>
         
              <DashboardContent notices={notices} handleExamClick={handleExamClick} />
              {/* <QuizSection /> */}
          
          </>
        )}
        

        {activeSection === 'exam' && selectedExam && (
          <ExamSelection
            selectedExam={selectedExam}
            examSubjects={examSubjects}
            setActiveSection={setActiveSection}
            handleSubjectClick={handleSubjectClick}
          />
        )}

        {activeSection === 'chapters' && selectedSubject && (
          <ChaptersPage
            selectedExam={selectedExam}
            selectedSubject={selectedSubject}
            chapters={chapters}
            setActiveSection={setActiveSection}
            openNotesModal={openNotesModal}
          />
        )}
         {activeSection === 'settings' && <SettingsPage />}
      </div>
      {modalOpen && <NotesModal modalContent={modalContent} setModalOpen={setModalOpen} />}
    </div>
    
  );
};

export default NotesDashboard;
