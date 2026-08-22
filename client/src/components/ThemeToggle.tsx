import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-inner'
          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-sm'
      } ${className}`}
      aria-label="Toggle visual color theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 transform transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 transform transition-transform duration-300 rotate-0 scale-100 text-slate-700" />
        )}
      </div>
      <span className="sr-only">Toggle Theme</span>
    </button>
  );
};

export default ThemeToggle;
