import React, { useState } from 'react';
import { Icons } from './Icons';

interface CustomDatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onChange, onClose }) => {
  // Parse the initial date string (YYYY-MM-DD) or default to today
  const initialDateObj = selectedDate ? new Date(selectedDate) : new Date();
  
  // View state for navigation (Year, Month)
  const [viewDate, setViewDate] = useState(initialDateObj);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1; // 1-based
    // Format as YYYY-MM-DD
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    onClose();
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const weeks = [];
  let days = [];

  // Pad empty days at start
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }

  // Fill days
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = 
      selectedDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    days.push(
      <button
        key={d}
        onClick={(e) => { e.stopPropagation(); handleDateClick(d); }}
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
          ${isSelected 
            ? 'bg-purple-600 text-white font-bold' 
            : 'hover:bg-purple-100 text-gray-700'
          }`}
      >
        {d}
      </button>
    );
  }

  // Chunk into weeks
  // Pad the end of the array to complete the grid if necessary, but flex wrap handles it visually usually.
  // Simple mapping is enough for CSS grid.

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72 animate-fade-in-up select-none" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <Icons.ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-gray-800 text-lg">
          {year}년 {monthNames[month]}
        </span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <Icons.ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2 text-center">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
          <span key={day} className={`text-xs font-medium ${idx === 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 place-items-center">
        {days}
      </div>
    </div>
  );
};