import React, { useState, useRef, useEffect } from 'react';
import { FormHeader } from './components/FormHeader';
import { FloatingSidebar } from './components/FloatingSidebar';
import { ResultCard } from './components/ResultCard';
import { CustomDatePicker } from './components/CustomDatePicker';
import { analyzeReflection } from './services/geminiService';
import { FormData, FormState, FeedbackResponse } from './types';
import { Icons } from './components/Icons';

type Tab = 'questions' | 'settings';

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>(FormState.EDITING);
  const [activeTab, setActiveTab] = useState<Tab>('questions');
  
  // Split Title State
  const [date, setDate] = useState("2025-09-09");
  const [titleSuffix, setTitleSuffix] = useState("나필사");
  const [formDescription, setFormDescription] = useState("설문지 설명");
  
  // Date Picker Visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    studentInfo: '',
    impressivePhrase: '',
    content: ''
  });
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Google Sheet Configuration
  // Default to the provided URL
  const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbxQZoFZJR_DuVRfC4pRL185x9onuEG-ywCtwxC6HQEiEsHraX-dCug6HnQEqqsDs3fW/exec";
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem('googleSheetUrl') || DEFAULT_SHEET_URL);
  
  // Share URL State
  const [shareUrl, setShareUrl] = useState<string>('');

  // Refs for focus management styling
  const studentInfoRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // The specific spreadsheet URL provided by the user
  const TARGET_SHEET_URL = "https://docs.google.com/spreadsheets/d/1guErvTfNrf3UyKFmSAOrUoqdlSemUxY51sC3w9nN3FI/edit?gid=0#gid=0";

  useEffect(() => {
    localStorage.setItem('googleSheetUrl', sheetUrl);
  }, [sheetUrl]);

  // Initialize share URL on mount
  useEffect(() => {
    // If in a development environment or preview, suggest the production URL
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('container') || window.location.hostname.includes('quick-change')) {
        setShareUrl('https://club-napilsa.vercel.app');
    } else {
        setShareUrl(window.location.href);
    }
  }, []);

  // Click outside handler for Date Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to format date for display (YYYY-MM-DD -> M월 D일)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}월 ${parseInt(day)}일`;
  };

  const formTitle = `${formatDateDisplay(date)} ${titleSuffix}`;

  const submitToGoogleSheet = async () => {
    const targetUrl = sheetUrl || DEFAULT_SHEET_URL;
    
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain', 
        },
        body: JSON.stringify({
          formTitle,
          studentInfo: formData.studentInfo,
          impressivePhrase: formData.impressivePhrase,
          content: formData.content,
          timestamp: new Date().toLocaleString('ko-KR')
        })
      });
      console.log('Data submitted to Google Sheet');
    } catch (error) {
      console.error('Error submitting to Google Sheet:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.studentInfo || !formData.content) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    // Always submit to sheet if configured (which it is by default now)
    
    setFormState(FormState.SUBMITTING);
    
    try {
      await submitToGoogleSheet();

      const feedback = await analyzeReflection(formData);
      setResult(feedback);
      setFormState(FormState.REVIEWING);
    } catch (error) {
      console.error(error);
      setFormState(FormState.ERROR);
      setTimeout(() => setFormState(FormState.EDITING), 3000);
    }
  };

  const handleReset = () => {
    setFormData({ studentInfo: '', impressivePhrase: '', content: '' });
    setResult(null);
    setFormState(FormState.EDITING);
    setActiveTab('questions');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("링크가 복사되었습니다.");
  };

  // Helper to ensure URL has protocol for QR code
  const getQrCodeUrl = (url: string) => {
      let finalUrl = url.trim();
      if (!finalUrl) return '';
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl;
      }
      return `https://quickchart.io/qr?text=${encodeURIComponent(finalUrl)}&size=180&margin=1`;
  };

  const toggleSettings = () => {
    setActiveTab(prev => prev === 'questions' ? 'settings' : 'questions');
  };

  if (formState === FormState.REVIEWING && result) {
    return (
      <div className="min-h-screen bg-purple-50 pb-12">
        <FormHeader onSettingsClick={toggleSettings} />
        <ResultCard result={result} onReset={handleReset} />
      </div>
    );
  }

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto mt-8 px-4 animate-fade-in-up pb-20">
      {/* Student Access Section - QR Code */}
      <div className="bg-white rounded-lg border-l-8 border-l-green-500 border-gray-300 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Icons.QrCode className="w-6 h-6 text-green-600" />
          학생 초대 (스마트폰 접속)
        </h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm leading-relaxed">
                아래 QR코드를 칠판이나 화면에 띄워주세요. 학생들이 카메라로 스캔하면 바로 접속할 수 있습니다.
            </p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm shrink-0 mx-auto md:mx-0">
                {shareUrl ? (
                    <img 
                        src={getQrCodeUrl(shareUrl)} 
                        alt="접속 QR코드" 
                        className="w-40 h-40"
                    />
                ) : (
                    <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">URL 입력 필요</div>
                )}
            </div>
            <div className="flex-1 w-full">
                <h3 className="font-bold text-lg text-gray-800 mb-2">학생들에게 공유할 링크</h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">현재 접속 URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={shareUrl}
                      onChange={(e) => setShareUrl(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none font-mono"
                      placeholder="https://club-napilsa.vercel.app"
                    />
                    <button 
                        onClick={copyLink}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded flex items-center gap-2 transition-colors font-medium whitespace-nowrap"
                    >
                        <Icons.Copy className="w-4 h-4" />
                        복사
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * 입력한 주소에 맞춰 왼쪽 QR코드가 자동으로 생성됩니다.
                  </p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center gap-2">
          <Icons.Title className="w-6 h-6 text-purple-600" />
          Google Spreadsheet 연결 설정 (선생님용)
        </h2>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">연동 대상 시트</h3>
            <a 
              href={TARGET_SHEET_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all flex items-center gap-1"
            >
              {TARGET_SHEET_URL}
              <Icons.Import className="w-4 h-4" />
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Apps Script 웹 앱 URL
            </label>
            <input 
              type="text" 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full p-3 border border-gray-300 rounded focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              * 자동으로 설정된 URL입니다. 변경이 필요한 경우에만 수정하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-purple-50 pb-20 font-sans">
      <FormHeader onSettingsClick={toggleSettings} />

      <div className="max-w-3xl mx-auto mt-4 px-4 relative">
        
        {activeTab === 'questions' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Title Card */}
            <div className="bg-white rounded-lg border border-gray-300 shadow-sm border-t-[10px] border-t-purple-700 relative z-20">
               <div className="absolute -top-[10px] left-0 w-full h-[10px] bg-purple-700 rounded-t-lg"></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 group border-b border-transparent focus-within:border-purple-700 hover:border-gray-200 transition-colors pb-1">
                    
                    {/* Custom Date Picker Trigger & Popover */}
                    <div className="relative" ref={datePickerRef}>
                      <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="text-3xl font-normal text-gray-900 cursor-pointer border-b-2 border-dashed border-gray-300 group-hover/date:border-purple-400 transition-colors whitespace-nowrap flex items-center gap-2 hover:text-purple-700 focus:outline-none"
                      >
                          {formatDateDisplay(date)}
                          <Icons.Calendar className="w-5 h-5 text-gray-400 group-hover/date:text-purple-500" />
                      </button>
                      
                      {showDatePicker && (
                        <div className="absolute top-full left-0 mt-2 z-50">
                          <CustomDatePicker 
                            selectedDate={date} 
                            onChange={setDate} 
                            onClose={() => setShowDatePicker(false)} 
                          />
                        </div>
                      )}
                    </div>

                    <input
                        type="text"
                        value={titleSuffix}
                        onChange={(e) => setTitleSuffix(e.target.value)}
                        className="text-3xl font-normal text-gray-900 w-full outline-none bg-transparent"
                        placeholder="활동 이름"
                    />
                </div>
                <input
                  type="text" 
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-gray-600 text-sm w-full border-b border-transparent focus:border-purple-700 hover:border-gray-200 outline-none transition-colors bg-transparent"
                />
              </div>
            </div>

            {/* Student Info Card */}
            <div 
              ref={studentInfoRef}
              onClick={() => setActiveField('studentInfo')}
              className={`bg-white rounded-lg border shadow-sm p-6 relative transition-all duration-200 group ${
                activeField === 'studentInfo' 
                  ? 'border-l-8 border-l-blue-500 border-gray-300 ml-0' 
                  : 'border-gray-300 hover:shadow-md'
              }`}
            >
               {activeField === 'studentInfo' && <FloatingSidebar />}
              
              <label className="block text-base text-gray-900 mb-6">
                학년-반 이름/ 1-1 홍길동 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="studentInfo"
                value={formData.studentInfo}
                onChange={handleInputChange}
                placeholder="내 답변"
                className="w-full border-b border-gray-200 focus:border-purple-700 outline-none py-2 text-gray-700 transition-colors bg-transparent placeholder-gray-400"
              />
               {activeField === 'studentInfo' && (
                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end items-center gap-4">
                  <Icons.Import className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 text-sm">필수</span>
                  <div className="w-10 h-5 bg-purple-100 rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-purple-600 rounded-full absolute right-0 shadow-sm"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Impressive Phrase Card (New) */}
            <div 
              ref={phraseRef}
              onClick={() => setActiveField('impressivePhrase')}
              className={`bg-white rounded-lg border shadow-sm p-6 relative transition-all duration-200 group ${
                activeField === 'impressivePhrase' 
                  ? 'border-l-8 border-l-blue-500 border-gray-300 ml-0' 
                  : 'border-gray-300 hover:shadow-md'
              }`}
            >
               {activeField === 'impressivePhrase' && <FloatingSidebar />}
              
              <label className="block text-base text-gray-900 mb-6">
                가장 감명깊은 문구
              </label>
              <input
                type="text"
                name="impressivePhrase"
                value={formData.impressivePhrase}
                onChange={handleInputChange}
                placeholder="내 답변"
                className="w-full border-b border-gray-200 focus:border-purple-700 outline-none py-2 text-gray-700 transition-colors bg-transparent placeholder-gray-400"
              />
               {activeField === 'impressivePhrase' && (
                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end items-center gap-4">
                  <Icons.Import className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">|</span>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0 shadow-sm border border-gray-300"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Reflection Card */}
            <div 
              ref={contentRef}
              onClick={() => setActiveField('content')}
              className={`bg-white rounded-lg border shadow-sm p-6 relative transition-all duration-200 group ${
                activeField === 'content' 
                  ? 'border-l-8 border-l-blue-500 border-gray-300' 
                  : 'border-gray-300 hover:shadow-md'
              }`}
            >
              {activeField === 'content' && <FloatingSidebar />}
              
              <label className="block text-base text-gray-900 mb-2">
                필사한 오늘 내용과 느낀점 등을 잘 적어주세요 OREO원칙에 맞게 적어주세요 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-6">장문형 텍스트</p>
              
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="내 답변"
                rows={6}
                className="w-full border-b border-gray-200 focus:border-purple-700 outline-none py-2 text-gray-700 transition-colors resize-none bg-transparent placeholder-gray-400"
              />

               {activeField === 'content' && (
                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end items-center gap-4">
                  <Icons.Import className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 text-sm">필수</span>
                  <div className="w-10 h-5 bg-purple-100 rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-purple-600 rounded-full absolute right-0 shadow-sm"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-8 px-2">
              <button 
                onClick={handleSubmit}
                disabled={formState === FormState.SUBMITTING}
                className="bg-purple-800 text-white px-6 py-2.5 rounded shadow hover:bg-purple-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formState === FormState.SUBMITTING ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    제출 중...
                  </>
                ) : (
                  '제출'
                )}
              </button>
              
              <button 
                onClick={() => setFormData({ studentInfo: '', impressivePhrase: '', content: '' })}
                className="text-purple-800 font-medium px-4 py-2 rounded hover:bg-purple-50 transition-colors"
              >
                양식 지우기
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && renderSettings()}

      </div>
      
      {formState === FormState.ERROR && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <Icons.Alert className="w-5 h-5" />
          오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
};

export default App;