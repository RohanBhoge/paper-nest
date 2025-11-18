import React from 'react';
import { BookOpen, Menu } from 'lucide-react';

const TopBar = ({ setIsSidebarOpen }) => (
  <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm border-b border-slate-200 fixed w-full z-40">
    <div className="flex items-center gap-2">
      <BookOpen className="text-blue-600" size={22} />
      <span className="text-lg font-bold text-blue-600">BISUGEN</span>
    </div>
    <button
      onClick={() => setIsSidebarOpen(true)}
      className="cursor-pointer p-2 text-slate-600 hover:text-slate-900"
    >
      <Menu size={24} />
    </button>
  </div>
);

export default TopBar;
