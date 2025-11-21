import React from 'react';
import { Icons } from './Icons';

interface FormHeaderProps {
  onSettingsClick?: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm min-h-[60px]">
      <div className="flex items-center gap-4">
        {/* Title removed as requested */}
      </div>
      
      <div className="flex items-center gap-4 text-gray-600">
        {onSettingsClick && (
          <button 
            onClick={onSettingsClick}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            aria-label="설정"
          >
            <Icons.Settings className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};