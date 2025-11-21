import React from 'react';
import { Icons } from './Icons';

export const FormHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-purple-600 rounded text-white flex items-center justify-center font-bold text-lg">
          <Icons.Title className="w-6 h-6" />
        </div>
        <span className="text-lg text-gray-800 font-medium">나필사 동아리 활동</span>
      </div>
      
      <div className="flex items-center gap-4 text-gray-600">
        <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Customize Theme">
          <Icons.Theme className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Preview">
          <Icons.Preview className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Undo">
          <Icons.Undo className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Redo">
          <Icons.Redo className="w-5 h-5" />
        </button>
        <button className="bg-purple-800 text-white px-6 py-2 rounded font-medium hover:bg-purple-900 transition-colors">
          보내기
        </button>
      </div>
    </header>
  );
};
