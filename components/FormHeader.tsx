import React from 'react';
import { Icons } from './Icons';

export const FormHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm min-h-[60px]">
      <div className="flex items-center gap-4">
        {/* Title removed as requested */}
      </div>
      
      <div className="flex items-center gap-4 text-gray-600">
        {/* Right side buttons removed as requested */}
      </div>
    </header>
  );
};