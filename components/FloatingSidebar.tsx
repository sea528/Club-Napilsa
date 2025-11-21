import React from 'react';
import { Icons } from './Icons';

export const FloatingSidebar: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col gap-4 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-gray-500 absolute -right-16 top-0">
      <button className="hover:text-purple-600 transition-colors"><Icons.Add className="w-5 h-5" /></button>
      <button className="hover:text-purple-600 transition-colors"><Icons.Import className="w-5 h-5" /></button>
      <button className="hover:text-purple-600 transition-colors"><Icons.Title className="w-5 h-5" /></button>
      <button className="hover:text-purple-600 transition-colors"><Icons.Image className="w-5 h-5" /></button>
      <button className="hover:text-purple-600 transition-colors"><Icons.Video className="w-5 h-5" /></button>
      <button className="hover:text-purple-600 transition-colors"><Icons.Section className="w-5 h-5" /></button>
    </div>
  );
};
