import React from 'react';
import { FeedbackResponse } from '../types';
import { Icons } from './Icons';

interface ResultCardProps {
  result: FeedbackResponse;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  return (
    <div className="max-w-3xl mx-auto mt-8 animate-fade-in-up">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border-t-8 border-purple-600">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">활동 분석 결과</h2>
            <div className="bg-purple-100 text-purple-800 px-4 py-1 rounded-full font-bold text-lg">
              {result.score}점
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">한줄 요약</h3>
            <p className="text-lg text-gray-800 italic">"{result.summary}"</p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icons.Check className="w-5 h-5 text-purple-600" />
              OREO 구조 분석
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <OreoItem label="Opinion (의견)" active={result.oreoAnalysis.opinion} />
              <OreoItem label="Reason (이유)" active={result.oreoAnalysis.reason} />
              <OreoItem label="Example (예시)" active={result.oreoAnalysis.example} />
              <OreoItem label="Opinion (강조)" active={result.oreoAnalysis.opinionRestated} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Icons.Star className="w-4 h-4" /> 선생님의 칭찬
              </h3>
              <p className="text-blue-900 text-sm leading-relaxed whitespace-pre-wrap">
                {result.encouragement}
              </p>
            </div>
            <div className="bg-orange-50 p-5 rounded-lg border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                <Icons.Alert className="w-4 h-4" /> 개선할 점
              </h3>
              <p className="text-orange-900 text-sm leading-relaxed whitespace-pre-wrap">
                {result.constructiveFeedback}
              </p>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={onReset}
              className="text-purple-600 font-medium hover:text-purple-800 underline underline-offset-4"
            >
              다른 응답 제출하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OreoItem: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
    active 
      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
      : 'border-gray-200 bg-white text-gray-400 grayscale'
  }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-bold ${
      active ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
    }`}>
      {label.charAt(0)}
    </div>
    <span className="text-xs font-medium">{label.split(' ')[1]}</span>
  </div>
);