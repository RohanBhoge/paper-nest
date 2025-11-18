import React from 'react';
import { Home, Settings, BookOpen, X,History } from 'lucide-react';

const NavItem = ({ icon: Icon, label, section, active, setActiveSection, setIsSidebarOpen }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
      active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
    }`}
    onClick={() => {
      setActiveSection(section);
      setIsSidebarOpen(false);
    }}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </div>
);

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, activeSection, setActiveSection }) => {
  return (
    <div
      className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-sm border-r border-slate-200 p-6 z-50 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-blue-600">
          <BookOpen size={24} />
          <span className="text-xl font-bold">BISUGEN</span>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden cursor-pointer text-slate-500 hover:text-slate-800">
          <X size={24} />
        </button>
      </div>

      <nav className="space-y-1">
        <NavItem icon={Home} label="Dashboard" section="dashboard" active={activeSection === 'dashboard'} setActiveSection={setActiveSection} setIsSidebarOpen={setIsSidebarOpen}/>
        <NavItem icon={BookOpen} label="Paper Checking" section="omr" active={activeSection === 'omr'} setActiveSection={setActiveSection} setIsSidebarOpen={setIsSidebarOpen}/>
        <NavItem icon={History} label="Paper History" section="paperHistory" active={activeSection === 'paperHistory'} setActiveSection={setActiveSection} setIsSidebarOpen={setIsSidebarOpen} />
        <NavItem icon={Settings} label="Settings" section="settings" active={activeSection === 'settings'} setActiveSection={setActiveSection} setIsSidebarOpen={setIsSidebarOpen}/>

      </nav>
    </div>
  );
};

export default Sidebar;
