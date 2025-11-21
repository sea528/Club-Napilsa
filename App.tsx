import React, { useState, useRef, useEffect } from 'react';
import { FormHeader } from './components/FormHeader';
import { FloatingSidebar } from './components/FloatingSidebar';
import { ResultCard } from './components/ResultCard';
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
  
  const [formData, setFormData] = useState<FormData>({
    studentInfo: '',
    impressivePhrase: '',
    content: ''
  });
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Google Sheet Configuration
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem('googleSheetUrl') || '');

  // Refs for focus management styling
  const studentInfoRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // The specific spreadsheet URL provided by the user
  const TARGET_SHEET_URL = "https://docs.google.com/spreadsheets/d/1guErvTfNrf3UyKFmSAOrUoqdlSemUxY51sC3w9nN3FI/edit?gid=0#gid=0";

  useEffect(() => {
    localStorage.setItem('googleSheetUrl', sheetUrl);
  }, [sheetUrl]);

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
    if (!sheetUrl) {
        // We don't block submission if sheet is not connected, but we log it.
        // In a real app, we might want to alert the user or queue it.
        console.warn("Google Sheet URL is not configured.");
        return;
    }
    
    try {
      // Using no-cors for Google Apps Script Web App compatibility from browser
      // Content-Type text/plain prevents CORS preflight issues
      await fetch(sheetUrl, {
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
      // Silent fail for user, but log for debug. The AI feedback is the primary UI feedback.
    }
  };

  const handleSubmit = async () => {
    if (!formData.studentInfo || !formData.content) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    if (!sheetUrl) {
        const confirmSubmit = window.confirm("Google Spreadsheet가 연결되지 않았습니다.\nAI 피드백만 받고 내용을 저장하지 않으시겠습니까?");
        if (!confirmSubmit) {
            setActiveTab('settings');
            return;
        }
    }

    setFormState(FormState.SUBMITTING);
    
    try {
      // Submit to Google Sheet immediately (fire and forget)
      if (sheetUrl) {
        await submitToGoogleSheet();
      }

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

  if (formState === FormState.REVIEWING && result) {
    return (
      <div className="min-h-screen bg-purple-50 pb-12">
        <FormHeader />
        <ResultCard result={result} onReset={handleReset} />
      </div>
    );
  }

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto mt-8 px-4 animate-fade-in-up">
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center gap-2">
          <Icons.Title className="w-6 h-6 text-purple-600" />
          Google Spreadsheet 연결 설정
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
            <p className="text-sm text-blue-800 mt-2">
              위 시트에 데이터가 자동으로 입력되게 하려면 아래 과정을 한 번만 진행해주세요.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. 앱스 스크립트 코드 복사
            </label>
            <div className="bg-gray-800 text-gray-200 p-4 rounded text-sm font-mono overflow-x-auto relative group">
              <pre>{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(), 
    data.formTitle, 
    data.studentInfo, 
    data.impressivePhrase, 
    data.content
  ]);
  return ContentService.createTextOutput("Success");
}`}</pre>
              <button 
                onClick={() => navigator.clipboard.writeText(`function doPost(e) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];\n  var data = JSON.parse(e.postData.contents);\n  sheet.appendRow([\n    new Date(), \n    data.formTitle, \n    data.studentInfo, \n    data.impressivePhrase, \n    data.content\n  ]);\n  return ContentService.createTextOutput("Success");\n}`)}
                className="absolute top-2 right-2 bg-white text-gray-800 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                복사하기
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-3 bg-gray-50 p-4 rounded border border-gray-200">
            <p className="font-bold text-gray-900">배포 순서 (정확히 따라해주세요!)</p>
            <ol className="list-decimal pl-5 space-y-2">
                <li>위 링크의 스프레드시트를 열고, <strong>확장 프로그램 &gt; Apps Script</strong> 클릭</li>
                <li>기존 코드를 지우고 위 코드를 붙여넣기 후 <strong>저장(Disk 아이콘)</strong></li>
                <li>우측 상단 <strong>배포 &gt; 새 배포</strong> 클릭</li>
                <li>톱니바퀴 아이콘 옆 <strong>유형 선택</strong>에서 <strong>웹 앱</strong> 선택</li>
                <li>
                    <strong className="text-purple-700">설정 (가장 중요!)</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-700">
                        <li><strong>다음 사용자 권한으로 실행</strong>: <span className="bg-yellow-100 px-1 rounded font-bold">나 (Me)</span></li>
                        <li><strong>액세스 권한이 있는 사용자</strong>: <span className="bg-yellow-100 px-1 rounded font-bold">모든 사용자 (Anyone)</span></li>
                    </ul>
                </li>
                <li><strong>배포</strong> 클릭</li>
                <li>
                    <strong>권한 승인 필요</strong> 창이 뜨면:
                    <ul className="list-disc pl-4 mt-1 text-xs text-gray-500">
                        <li><strong>권한 검토</strong> 클릭 -> 계정 선택</li>
                        <li><span className="text-red-500">"확인되지 않은 앱"</span> 화면에서 좌측 하단 <strong>고급(Advanced)</strong> 클릭</li>
                        <li>맨 아래 <strong>...으로 이동(안전하지 않음)</strong> 클릭</li>
                        <li><strong>허용</strong> 클릭</li>
                    </ul>
                </li>
                <li>생성된 <strong>웹 앱 URL</strong>을 복사하여 아래 칸에 붙여넣기</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              웹 앱 URL (Web App URL)
            </label>
            <input 
              type="text" 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full p-3 border border-gray-300 rounded focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              * 주소가 'exec'로 끝나는지 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-purple-50 pb-20 font-sans">
      <FormHeader />

      <div className="max-w-3xl mx-auto mt-4 px-4 relative">
        {/* Tabs */}
        <div className="flex justify-center border-b border-gray-300 mb-6 bg-transparent">
          <button 
            onClick={() => setActiveTab('questions')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'questions' ? 'border-purple-800 text-purple-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            질문
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-purple-800 text-purple-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            설정
            {!sheetUrl && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block mb-1"></span>}
          </button>
        </div>

        {activeTab === 'questions' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Title Card */}
            <div className="bg-white rounded-lg border border-gray-300 shadow-sm border-t-[10px] border-t-purple-700 relative">
               <div className="absolute -top-[10px] left-0 w-full h-[10px] bg-purple-700 rounded-t-lg"></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 group border-b border-transparent focus-within:border-purple-700 hover:border-gray-200 transition-colors pb-1">
                    <div className="relative flex items-center group/date">
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <span className="text-3xl font-normal text-gray-900 cursor-pointer border-b-2 border-dashed border-gray-300 group-hover/date:border-purple-400 transition-colors whitespace-nowrap flex items-center gap-2">
                            {formatDateDisplay(date)}
                            <Icons.Calendar className="w-5 h-5 text-gray-400 group-hover/date:text-purple-500" />
                        </span>
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