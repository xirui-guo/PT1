import React, { useState, useRef, useEffect } from 'react';
import { 
  FileAudio, FileVideo, FileText, Play, Pause, 
  RotateCcw, RotateCw, Camera, Sparkles, Copy,
  Upload, X, Loader2, Layout, Type, Calendar as CalendarIcon,
  BarChart3, Home, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';

const API_BASE_URL = "http://localhost:8000";

const generateHeatmapData = () => {
  return Array.from({ length: 50 }, () => ({
    level: Math.floor(Math.random() * 5),
  }));
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // --- 用户动态数据状态 ---
  const [userData, setUserData] = useState({
    name: "Kristina",
    avatar: "https://tse2.mm.bing.net/th/id/OIP.CfglGno9D-h16Lxp0Es47gHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
    reviewCount: 0,
    isLoaded: false
  });

  // --- 编辑器相关状态 ---
  const [mode, setMode] = useState(null);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const videoRef = useRef(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- 模拟从 FastAPI 获取数据 ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 实际开发时这里替换为: const response = await fetch(`${API_BASE_URL}/user/stats`);
        // const data = await response.json();
        
        // 模拟延迟效果
        setTimeout(() => {
          setUserData({
            name: "Kristina", // 后端应返回登录用户的名字
            avatar: "https://tse2.mm.bing.net/th/id/OIP.CfglGno9D-h16Lxp0Es47gHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
            reviewCount: 3, // 根据遗忘曲线算法计算出的今日需复习数量
            isLoaded: true
          });
        }, 800);
      } catch (error) {
        console.error("无法获取用户统计数据", error);
      }
    };

    fetchUserData();
  }, []);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsProcessing(true);
    setTranscript("");
    
    if (uploadedFile.type.startsWith('video/')) setMode('video');
    else if (uploadedFile.type.startsWith('audio/')) setMode('audio');
    else setMode('doc');

    const formData = new FormData();
    formData.append('file', uploadedFile);
    try {
      const response = await fetch(`${API_BASE_URL}/process-file`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.status === 'success') setTranscript(data.text);
      else setTranscript("解析失败：" + (data.detail || "未知错误"));
    } catch (error) {
      setTranscript("无法连接到后端服务器，请检查 Python 后端是否运行。");
    } finally { setIsProcessing(false); }
  };

  const handleTextCopy = () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) setNotes(prev => prev + (prev ? "\n\n" : "") + "> " + selectedText);
  };

  const handleScreenshot = () => {
    if (mode === 'video' && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setNotes(prev => prev + `\n\n[视频截图 - ${new Date().toLocaleTimeString()}]\n`);
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = "w-full rounded-lg mt-2 border border-slate-200 shadow-sm";
      if (editorRef.current) editorRef.current.appendChild(img);
    }
  };

  const goToEditor = () => {
    setCurrentPage('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const Heatmap = ({ title, data, colorBase }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
      <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">{title}</h3>
      <div className="grid grid-flow-col grid-rows-7 gap-1.5">
        {data.map((item, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${colorBase[item.level]} transition-all hover:scale-125 cursor-help`} />
        ))}
      </div>
    </div>
  );

  const Dashboard = () => {
    const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    const viewData = generateHeatmapData();
    const uploadData = generateHeatmapData();

    return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <section className="flex items-center gap-8 p-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-500 border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center">
              <img 
                src={userData.avatar} 
                alt="User Avatar" 
                className={`w-full h-full object-cover transition-opacity duration-500 ${userData.isLoaded ? 'opacity-100' : 'opacity-0'}`} 
              />
              {!userData.isLoaded && <div className="absolute inset-0 bg-slate-100 animate-pulse" />}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-[#F8FAFC] shadow-lg animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2">
              Hello {userData.name},
            </h2>
            <p className="text-slate-400 text-lg font-medium flex items-center gap-2">
              <Sparkles className="text-orange-400" size={20} /> 
              {userData.reviewCount > 0 
                ? `今天有 ${userData.reviewCount} 份笔记需要根据遗忘曲线复习` 
                : "今天的复习任务已全部完成！"}
            </p>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-6">
          <Heatmap title="站点访问热度" data={viewData} colorBase={['bg-slate-50', 'bg-purple-100', 'bg-purple-300', 'bg-purple-500', 'bg-purple-700']} />
          <Heatmap title="文件上传频率" data={uploadData} colorBase={['bg-slate-50', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-700']} />
        </div>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200"><CalendarIcon size={24}/></div>
              <h3 className="font-black text-slate-800 text-2xl tracking-tight">知识复习日历</h3>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
               <select className="bg-transparent text-sm font-bold text-slate-600 outline-none px-3" value={currentDate.getMonth()} onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), e.target.value))}>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
               </select>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-black text-slate-300 uppercase tracking-widest">{d}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className={`aspect-square rounded-3xl border-2 p-4 flex items-center justify-center text-lg font-black bg-slate-50/50 border-transparent text-slate-500 hover:border-indigo-300 transition-all cursor-pointer`}>
                {i + 1}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 text-xl mb-8 flex items-center gap-2"><BarChart3 className="text-blue-500" /> 存储库资源分布</h3>
            <div className="flex items-end gap-12 h-56 px-6">
              {[{ label: '音频', count: 42, color: 'bg-blue-400', h: '60%' }, { label: '视频', count: 28, color: 'bg-purple-400', h: '40%' }, { label: '文档', count: 85, color: 'bg-indigo-500', h: '90%' }].map(item => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className={`w-full rounded-2xl ${item.color}`} style={{ height: item.h }}></div>
                  <div className="text-sm font-bold text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <Sparkles className="absolute top-10 right-10 text-white/20 w-20 h-20" />
            <div className="text-3xl font-black mb-8 leading-tight">本周你已完成<br/><span className="text-orange-400">12</span> 小时深度学习</div>
            <button onClick={goToEditor} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-sm hover:scale-105 transition-transform">开始新的学习会话</button>
          </div>
        </div>
      </div>
    );
  };

  const Editor = () => (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 h-[calc(100vh-200px)]">
        <section className="flex flex-col h-full space-y-4">
          {!file ? (
            <div onClick={() => fileInputRef.current.click()} className="flex-1 border-4 border-dashed border-slate-200 rounded-[3rem] bg-white hover:border-indigo-300 transition-all flex flex-col items-center justify-center p-10 cursor-pointer group">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform"><Upload size={32} /></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">上传多模态资料</h3>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              {isProcessing ? (
                <div className="flex-1 bg-white rounded-[2.5rem] flex flex-col items-center justify-center"><Loader2 size={48} className="text-indigo-600 animate-spin mb-4" /><p className="font-bold">AI 处理中...</p></div>
              ) : (
                <>
                  <div className="rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl aspect-video">
                    {mode === 'video' ? <video ref={videoRef} className="w-full h-full" src={URL.createObjectURL(file)} controls /> : <div className="flex items-center justify-center h-full text-white font-black"><FileText size={48} /></div>}
                  </div>
                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h4 className="font-black text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-purple-500" /> AI 转录内容</h4>
                      <button onClick={handleTextCopy} className="text-[10px] bg-slate-100 hover:bg-indigo-100 px-4 py-2 rounded-xl font-black">引用选中</button>
                    </div>
                    <div className="flex-1 overflow-y-auto leading-relaxed text-slate-600">{transcript || "内容正在生成..."}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
          <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl text-white"><Type size={18} /></div><h2 className="font-black text-slate-800">深度学习笔记</h2></div>
            {file && <button onClick={() => setFile(null)} className="p-2 text-slate-300 hover:text-red-500"><X size={20} /></button>}
          </div>
          <div className="flex-1 p-10">
            <textarea className="w-full h-full resize-none border-none focus:ring-0 text-xl font-medium text-slate-800 p-0 placeholder:text-slate-200" placeholder="记录你的思考..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans">
      <nav className="max-w-7xl mx-auto mb-16 flex justify-between items-center bg-white/70 backdrop-blur-xl p-3 rounded-[2rem] border border-white shadow-sm sticky top-6 z-50">
        <button onClick={() => setCurrentPage('dashboard')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm transition-all ${currentPage === 'dashboard' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}><Home size={18}/> 首页</button>
        <button onClick={goToEditor} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-xl"><Plus size={18}/> 上传文件</button>
      </nav>
      {currentPage === 'dashboard' ? <Dashboard /> : <Editor />}
      <footer className="max-w-7xl mx-auto mt-20 text-center border-t pt-8"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">AI Learning Lab • Created for Kristina</p></footer>
    </div>
  );
};

export default App;
