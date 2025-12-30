import React, { useState, useEffect, useRef } from 'react';
import { Subject } from '../types';

interface SubjectSelectorProps {
  activeSubject: Subject;
  onSelect: (subject: Subject) => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({ activeSubject, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const subjects = Object.values(Subject);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors border-r border-slate-200 dark:border-slate-700 h-full sm:rounded-none sm:rounded-l-2xl sm:border-0"
      >
        <span className="material-symbols-outlined text-primary text-[20px]">functions</span>
        <span className="capitalize">{activeSubject}</span>
        <span className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => {
                onSelect(sub);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left
                ${activeSubject === sub
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {sub === Subject.MATH ? 'calculate' :
                  sub === Subject.PHYSICS ? 'science' :
                    sub === Subject.CHEMISTRY ? 'biotech' :
                      sub === Subject.BIOLOGY ? 'eco' :
                        sub === Subject.HISTORY ? 'history_edu' :
                          sub === Subject.LITERATURE ? 'book_2' :
                            sub === Subject.CODING ? 'code' : 'school'}
              </span>
              <span className="capitalize">{sub}</span>
              {activeSubject === sub && (
                <span className="material-symbols-outlined text-[16px] ml-auto">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};