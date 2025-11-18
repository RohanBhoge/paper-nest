import React from 'react';
import { X } from 'lucide-react';

const NotesModal = ({ modalContent, setModalOpen }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 lg:mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-slate-900">{modalContent}</h2>
        <button onClick={() => setModalOpen(false)} className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors duration-200">
          <X size={24} />
        </button>
      </div>
      <div className="text-slate-700 space-y-4 text-sm lg:text-base">
        <p>This chapter covers the fundamental concepts of <span className="font-medium text-teal-600">{modalContent.toLowerCase()}</span>. Here you'll learn about key principles and applications.</p>
        <div>
          <p className="font-medium text-slate-900 mb-2">Important topics include:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-slate-600">
            <li>Basic definitions and terminology</li>
            <li>Core principles and laws</li>
            <li>Mathematical formulations</li>
            <li>Real-world applications</li>
            <li>Problem-solving techniques</li>
          </ul>
        </div>
        <p className="text-xs lg:text-sm text-slate-500">Practice problems and understand the concepts thoroughly.</p>
      </div>
    </div>
  </div>
);

export default NotesModal;
