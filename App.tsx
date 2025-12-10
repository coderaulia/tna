import React, { useState } from 'react';
import { AppView } from './types';
import Assessment from './components/Assessment';
import ImageGen from './components/ImageGen';
import ChatBot from './components/ChatBot';
import { LayoutDashboard, MessageSquareText, Layers, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ASSESSMENT);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case AppView.ASSESSMENT:
        return <Assessment />;
      case AppView.IMAGE_GEN:
        return <ImageGen />;
      default:
        return <Assessment />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar Navigation - Hidden on Print */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col z-10 no-print">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-indigo-600">
            <Layers className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SkillArchitect</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView(AppView.ASSESSMENT)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              currentView === AppView.ASSESSMENT
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Skill Assessment
          </button>
          
          <button
            onClick={() => setCurrentView(AppView.IMAGE_GEN)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              currentView === AppView.IMAGE_GEN
                ? 'bg-fuchsia-50 text-fuchsia-700 shadow-sm ring-1 ring-fuchsia-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Image Studio
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium border ${
              isChatOpen
                ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            <MessageSquareText className="w-5 h-5" />
            {isChatOpen ? 'Close Assistant' : 'AI Assistant'}
          </button>
        </div>
      </aside>

      {/* Main Content Area - Full width on print */}
      <main className="flex-1 h-screen overflow-auto relative print:h-auto print:overflow-visible">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 md:hidden no-print">
             <div className="font-bold text-lg text-slate-800">SkillArchitect</div>
        </header>

        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-24 print:p-0 print:max-w-none">
          {renderView()}
        </div>
      </main>

      {/* Floating Chat Bot - Hidden on Print */}
      <div className="no-print">
        <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </div>
  );
};

export default App;