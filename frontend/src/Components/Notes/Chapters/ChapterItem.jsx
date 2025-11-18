import React from 'react';
import { Eye, Download } from 'lucide-react';

const ChapterItem = ({ chapter, openNotesModal }) => {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-lg flex justify-between items-center hover:shadow-md transition-all duration-300">
      <span className="text-slate-800 font-medium">{chapter}</span>
      <div className="flex gap-2">
        <button
          onClick={() => openNotesModal(chapter)}
          className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all duration-200"
        >
          <Eye size={12} />
          Notes
        </button>
        <button
          className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-all duration-200"
        >
          <Download size={12} />
          Download
        </button>
      </div>
    </div>
  );
};

export default ChapterItem;
