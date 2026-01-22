import React from 'react';
import { Link } from 'react-router-dom';
import { Home, UserPlus, BookOpen } from 'lucide-react';

const TailwindHeader = () => {
  return (
    <header className="w-full bg-blue-600 shadow-lg border-b-4 border-blue-700 px-4 sm:px-6 lg:px-8 py-4">
      <div className="w-full flex justify-between items-center gap-4">
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white p-1.5 sm:p-2 rounded-lg">
            <BookOpen size={24} className="text-blue-600 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-lg">
            BISUGEN(Notes App)
          </h1>
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link 
            to="/home" 
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg text-sm sm:text-base"
          >
            <Home size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link 
            to="/register" 
            className="flex items-center gap-1.5 bg-white text-blue-600 font-bold py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl text-sm sm:text-base"
          >
            <UserPlus size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Register</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default TailwindHeader;