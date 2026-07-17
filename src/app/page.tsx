'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Volume2, RefreshCw, Plus, BookOpen, Loader2, ChevronLeft, Folder, Trash2, Search, Mic, PenLine, Languages, Save, Brain, Shuffle, ArrowRight, ArrowLeft, Copy, Star, WifiOff, Camera, X } from 'lucide-react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Sentence {
  id?: string;
  topic?: string;
  vietnamese: string;
  english: string;
  chinese: string;
  pinyin: string;
  createdAt?: string;
}

export default function Home() {
  const [tab, setTab] = useState<'learn' | 'add' | 'review' | 'scan'>('learn');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [vietnamese, setVietnamese] = useState('');
  const [topic, setTopic] = useState('Chung');
  const [preview, setPreview] = useState<Sentence | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Scan states
  const [scanText, setScanText] = useState('');
  const [scanPreview, setScanPreview] = useState<Sentence | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Review Mode states
  const [reviewSentences, setReviewSentences] = useState<Sentence[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedFavs = localStorage.getItem('favorites_cache');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (tab === 'learn' || sentences.length === 0) {
      fetchSentences();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'review') {
      let filtered = [...sentences];
      if (selectedTopic === '⭐ Đã yêu thích') {
        filtered = sentences.filter(s => s.id && favorites.includes(s.id));
      } else if (selectedTopic) {
        filtered = sentences.filter(s => (s.topic || 'Chung') === selectedTopic);
      }
      setReviewSentences(filtered);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [tab, selectedTopic, sentences, favorites]);

  const fetchSentences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sentences');
      const data = await res.json();
      if (res.ok) {
        setSentences(data);
        localStorage.setItem('sentences_cache', JSON.stringify(data));
      } else {
        toast.error('Lỗi tải dữ liệu: ' + data.error);
      }
    } catch (err) {
      const cached = localStorage.getItem('sentences_cache');
      if (cached) {
        try {
          setSentences(JSON.parse(cached));
          toast.info('Đang hiển thị dữ liệu ngoại tuyến', { duration: 4000 });
        } catch (e) {}
      } else {
        toast.error('Không thể kết nối đến máy chủ và không có dữ liệu ngoại tuyến');
      }
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      // Huỷ các giọng đọc đang bị kẹt trong hàng đợi
      window.speechSynthesis.cancel();

      // Dùng setTimeout 50ms để fix lỗi Chrome đôi khi huỷ luôn cả câu lệnh speak tiếp theo
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;

        // Lưu reference vào window để tránh bị Garbage Collector xoá ngang
        (window as any)._currentUtterance = utterance;

        window.speechSynthesis.speak(utterance);
      }, 50);
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ phát âm');
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Đang nghe...', { duration: 2000 });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVietnamese(prev => (prev + ' ' + transcript).trim());
    };

    recognition.onerror = (event: any) => {
      toast.error('Lỗi nhận diện giọng nói: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      toast.error('Vui lòng chọn vùng ảnh để cắt');
      return;
    }

    setIsOcrLoading(true);
    setCropImageSrc(null); // Close crop modal
    toast.info('Đang nén và trích xuất ảnh...', { duration: 3000 });

    try {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      // Reduce resolution to max 1200px
      const MAX_WIDTH = 1200;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;
      let finalWidth = cropWidth;
      let finalHeight = cropHeight;
      if (finalWidth > MAX_WIDTH) {
        finalHeight *= MAX_WIDTH / finalWidth;
        finalWidth = MAX_WIDTH;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;

      ctx.drawImage(
        imgRef.current,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, finalWidth, finalHeight
      );

      const base64String = canvas.toDataURL('image/jpeg', 0.8);

      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64String }),
      });
      
      const ocrData = await ocrRes.json();
      if (ocrRes.ok && ocrData.text) {
        const recognized = ocrData.text.trim();
        if (recognized) {
          setScanText(recognized);
          toast.success('Đã đọc được văn bản, đang dịch...');
          
          setIsTranslating(true);
          const transRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: recognized }),
          });
          const transData = await transRes.json();
          if (transRes.ok) {
            setScanPreview(transData);
          } else {
            toast.error('Lỗi dịch: ' + transData.error);
          }
          setIsTranslating(false);
        } else {
          toast.error('Không tìm thấy chữ trong ảnh');
        }
      } else {
        toast.error('Lỗi nhận diện ảnh: ' + (ocrData.error || 'Không tìm thấy chữ'));
      }
    } catch (err: any) {
      toast.error('Lỗi gửi ảnh: ' + err.message);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!vietnamese.trim()) {
      toast.error('Vui lòng nhập câu tiếng Việt');
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: vietnamese }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data);
        toast.success('Dịch thành công');
      } else {
        toast.error('Lỗi dịch: ' + data.error);
      }
    } catch (err) {
      toast.error('Không thể kết nối api dịch thuật');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preview, topic }),
      });

      if (res.ok) {
        toast.success('Đã lưu câu mới!');
        setVietnamese('');
        setPreview(null);
        setTab('learn');
      } else {
        const data = await res.json();
        toast.error('Lỗi lưu: ' + data.error);
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn xoá câu này không?')) return;

    try {
      const res = await fetch('/api/sentences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Đã xoá câu');
        setSentences(sentences.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        toast.error('Lỗi khi xoá: ' + data.error);
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm', { duration: 2000 });
  };

  const toggleFavorite = (id: string | undefined) => {
    if (!id) return;
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const newFavs = isFav ? prev.filter(fId => fId !== id) : [...prev, id];
      localStorage.setItem('favorites_cache', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const availableTopics = Array.from(new Set(sentences.map(s => s.topic || 'Chung')));
  if (favorites.length > 0) {
    availableTopics.unshift('⭐ Đã yêu thích');
  }

  const displayedSentences = searchQuery.trim()
    ? sentences.filter(s => {
      const q = searchQuery.toLowerCase();
      return (
        (s.vietnamese || '').toLowerCase().includes(q) ||
        (s.english || '').toLowerCase().includes(q) ||
        (s.chinese || '').toLowerCase().includes(q) ||
        (s.pinyin || '').toLowerCase().includes(q)
      );
    })
    : selectedTopic
      ? selectedTopic === '⭐ Đã yêu thích'
        ? sentences.filter(s => s.id && favorites.includes(s.id))
        : sentences.filter(s => (s.topic || 'Chung') === selectedTopic)
      : [];

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-zinc-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {!isOnline && (
        <div className="bg-red-500 text-white text-center text-[13px] sm:text-sm py-1.5 font-medium shadow-sm flex items-center justify-center gap-1.5 px-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          Bạn hiện không có kết nối mạng. Đang dùng dữ liệu ngoại tuyến.
        </div>
      )}
      <main className="flex-1 max-w-2xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-4 pb-20 pt-4 sm:pt-6">
        
        {/* Hanzii Style Tabs */}
        <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setTab('learn')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-200 text-[14px] sm:text-[15px] ${tab === 'learn' ? 'bg-[#F0F4FF] dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <BookOpen className="w-[18px] h-[18px]" />
            <span className="hidden sm:inline">Học Từ Vựng</span>
            <span className="sm:hidden">Học</span>
          </button>
          <button
            onClick={() => setTab('review')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-200 text-[14px] sm:text-[15px] ${tab === 'review' ? 'bg-[#F0F4FF] dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Brain className="w-[18px] h-[18px]" />
            <span className="hidden sm:inline">Ôn Tập</span>
            <span className="sm:hidden">Ôn Tập</span>
          </button>
          <button
            onClick={() => setTab('scan')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-200 text-[14px] sm:text-[15px] ${tab === 'scan' ? 'bg-[#F0F4FF] dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Camera className="w-[18px] h-[18px]" />
            <span className="hidden sm:inline">Quét Ảnh</span>
            <span className="sm:hidden">Quét</span>
          </button>
          <button
            onClick={() => setTab('add')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-200 text-[14px] sm:text-[15px] ${tab === 'add' ? 'bg-[#F0F4FF] dark:bg-zinc-800 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Plus className="w-[18px] h-[18px]" />
            <span className="hidden sm:inline">Thêm Câu Mới</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>

        {tab === 'learn' && (
          <div className="space-y-4 mt-2">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                placeholder="Nhập từ khoá tiếng Việt, Trung, Pinyin..."
                className="pl-11 h-12 rounded-xl bg-white dark:bg-zinc-900 border-none shadow-sm text-[15px] focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center px-1 mt-4">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                {selectedTopic ? selectedTopic : 'Danh mục chủ đề'}
              </h1>
              <div className="flex items-center gap-2">
                {selectedTopic && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-100" onClick={() => setSelectedTopic(null)}>
                    <ChevronLeft className="w-5 h-5 text-zinc-600" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-100" onClick={fetchSentences} disabled={loading}>
                  <RefreshCw className={`w-[18px] h-[18px] text-zinc-600 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                </Button>
              </div>
            </div>

            {loading && sentences.length === 0 && (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {!loading && sentences.length === 0 && (
              <div className="text-center p-10 text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
                <Folder className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                <p className="text-[15px]">Chưa có câu nào. Hãy thêm mới nhé!</p>
              </div>
            )}

            {!loading && sentences.length > 0 && !selectedTopic && !searchQuery.trim() && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                {availableTopics.map(topicName => (
                  <Card
                    key={topicName}
                    className="cursor-pointer bg-white dark:bg-zinc-900 border-none shadow-sm hover:shadow-md hover:bg-blue-50/30 dark:hover:bg-zinc-800/80 transition-all duration-200 rounded-2xl"
                    onClick={() => setSelectedTopic(topicName)}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F0F4FF] dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-[16px] text-zinc-800 dark:text-zinc-100 mb-1">{topicName}</div>
                        <div className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full inline-block">
                          {sentences.filter(s => (s.topic || 'Chung') === topicName).length} câu
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!loading && (selectedTopic || searchQuery.trim())) ? (
              <div className="flex flex-col gap-3 mt-2">
                {displayedSentences.length > 0 ? (
                  displayedSentences.map((item, index) => (
                    <Card key={item.id || index} className="overflow-hidden border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                      <CardContent className="p-4 sm:p-5 flex flex-col gap-1.5">
                        {/* Chinese + Icons */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-[18px] sm:text-[20px] text-zinc-800 dark:text-zinc-100 font-medium leading-snug">
                            {item.chinese}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 -mt-1 -mr-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors" onClick={() => handleCopy(item.chinese)} title="Sao chép">
                              <Copy className="w-[18px] h-[18px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full transition-colors ${favorites.includes(item.id || '') ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`} onClick={() => toggleFavorite(item.id)} title="Yêu thích">
                              <Star className={`w-[18px] h-[18px] ${favorites.includes(item.id || '') ? 'fill-current' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" onClick={() => speak(item.chinese, 'zh-TW')}>
                              <Volume2 className="w-[18px] h-[18px]" />
                            </Button>
                          </div>
                        </div>

                        {/* Pinyin */}
                        <div className="text-[14px] sm:text-[15px] text-zinc-500 dark:text-zinc-400">
                          [{item.pinyin}]
                        </div>

                        {/* Translations */}
                        <div className="flex justify-between items-end gap-4 mt-2">
                          <div className="space-y-1">
                            <div className="text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-200">
                              {item.vietnamese}
                            </div>
                            {item.english && (
                              <div className="text-[13.5px] sm:text-[14px] text-zinc-400 dark:text-zinc-500 italic">
                                {item.english}
                              </div>
                            )}
                          </div>

                          {/* Bottom Icons */}
                          <div className="flex items-center gap-1.5 shrink-0 -mb-1 -mr-2">
                            {item.english && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full transition-colors" onClick={() => speak(item.english, 'en-US')} title="Phát âm tiếng Anh">
                                <Volume2 className="w-[17px] h-[17px]" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors" onClick={() => handleDelete(item.id)} title="Xoá câu">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center p-10 text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm mt-2">
                    <Search className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                    Không tìm thấy câu nào phù hợp.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {tab === 'add' && (
          <div className="space-y-4 mt-2">
            {/* Topic Selection */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
              <CardContent className="p-4 sm:p-5">
                <Label htmlFor="topic" className="text-[14.5px] font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Chủ đề lưu từ vựng <span className="text-zinc-400 font-normal">(vd: Mua sắm, Sân bay)</span>
                </Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-11 rounded-xl bg-[#F0F2F5] dark:bg-zinc-950 border-none shadow-inner text-[15px] focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                {availableTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {availableTopics.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(t)}
                        className={`px-3 py-1.5 text-[13px] rounded-lg transition-all duration-200 font-medium ${topic === t ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translator UI */}
            <div className="flex flex-col sm:flex-row gap-3 relative">
              
              {/* Input Pane */}
              <Card className="flex-1 border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900 flex flex-col min-h-[250px]">
                <div className="flex items-center gap-2 p-2 border-b border-zinc-50 dark:border-zinc-800/50">
                   <div className="px-4 py-1.5 bg-[#F0F2F5] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-[13.5px] rounded-lg">Việt</div>
                </div>
                <div className="p-4 flex-1">
                  <textarea 
                    value={vietnamese}
                    onChange={(e) => {
                      setVietnamese(e.target.value);
                      if (!e.target.value.trim()) {
                        setPreview(null);
                      }
                    }}
                    placeholder="Nhập văn bản..."
                    className="w-full h-full min-h-[120px] resize-none bg-transparent border-none focus:outline-none text-[16px] text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                    maxLength={800}
                  />
                </div>
                <div className="p-3 flex justify-between items-center text-zinc-400 text-[13px]">
                   <Button 
                     variant="ghost" 
                     size="icon"
                     onClick={handleVoiceInput}
                     className={`h-9 w-9 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 animate-pulse' : 'text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800'}`}
                     title="Dịch bằng giọng nói"
                   >
                     <Mic className="w-[18px] h-[18px]" />
                   </Button>
                   <div className="flex items-center gap-3">
                     <span className="font-medium text-zinc-400">{vietnamese.length}/800</span>
                     <Button 
                       onClick={handleTranslate} 
                       disabled={isTranslating || !vietnamese.trim()}
                       className="bg-[#2A3655] hover:bg-[#1E2740] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-[14px] px-5 h-10 text-[14.5px] font-medium shadow-sm transition-all"
                     >
                       {isTranslating ? <Loader2 className="w-[18px] h-[18px] mr-1.5 animate-spin" /> : <Languages className="w-[18px] h-[18px] mr-1.5" />}
                       Dịch
                     </Button>
                   </div>
                </div>
              </Card>

              {/* Output Pane */}
              <Card className="flex-1 border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900 flex flex-col min-h-[250px]">
                <div className="flex items-center gap-2 p-2 border-b border-zinc-50 dark:border-zinc-800/50">
                   <div className="px-4 py-1.5 bg-transparent text-zinc-500 dark:text-zinc-400 font-medium text-[13.5px] rounded-lg">Trung (Phồn thể) & Anh</div>
                </div>
                <div className="p-4 flex-1">
                  {preview ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[22px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">{preview.chinese}</div>
                        <div className="text-[14px] text-zinc-500 dark:text-zinc-400">[{preview.pinyin}]</div>
                      </div>
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                        <div className="text-[15px] text-zinc-700 dark:text-zinc-300 font-medium">{preview.vietnamese}</div>
                        <div className="text-[15px] text-zinc-700 dark:text-zinc-300">{preview.english}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400 text-[14.5px] pb-10 text-center px-4">
                      Bản dịch sẽ hiển thị ở đây...
                    </div>
                  )}
                </div>
                <div className="p-3 flex justify-end items-center gap-2">
                  {preview && (
                    <Button 
                      variant="ghost" 
                      onClick={() => handleCopy(preview.chinese)} 
                      className="h-10 text-[14.5px] font-medium text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    >
                      <Copy className="w-[18px] h-[18px] sm:mr-1.5" />
                      <span className="hidden sm:inline">Sao chép</span>
                    </Button>
                  )}
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !preview}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-10 text-[14.5px] font-medium shadow-sm transition-all"
                  >
                    {isSaving ? <Loader2 className="w-[18px] h-[18px] mr-1.5 animate-spin" /> : <Save className="w-[18px] h-[18px] mr-1.5" />}
                    Lưu Sổ Tay
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        )}

        {tab === 'review' && (
          <div className="space-y-4 mt-2">
            <div className="flex justify-between items-center px-1">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                {selectedTopic ? `Ôn tập: ${selectedTopic}` : 'Ôn tập tất cả'}
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-100" onClick={() => {
                  const shuffled = [...reviewSentences].sort(() => 0.5 - Math.random());
                  setReviewSentences(shuffled);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }} title="Xáo trộn">
                  <Shuffle className="w-5 h-5 text-zinc-600" />
                </Button>
                {selectedTopic && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white dark:bg-zinc-900 shadow-sm hover:bg-zinc-100" onClick={() => setSelectedTopic(null)}>
                    <ChevronLeft className="w-5 h-5 text-zinc-600" />
                  </Button>
                )}
              </div>
            </div>

            {reviewSentences.length === 0 ? (
              <div className="text-center p-10 text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
                <Brain className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                <p className="text-[15px]">Không có thẻ nào để ôn tập trong danh mục này.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-center text-sm font-medium text-zinc-500">
                  Thẻ {currentCardIndex + 1} / {reviewSentences.length}
                </div>
                
                {/* Flashcard */}
                <Card 
                  className={`border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900 min-h-[300px] flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 relative ${isFlipped ? 'bg-[#F0F4FF] dark:bg-blue-950/20' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-0.5">
                     <button
                       onClick={(e) => { e.stopPropagation(); handleCopy(reviewSentences[currentCardIndex].chinese); }}
                       className="p-2 rounded-full text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                     >
                       <Copy className="w-[18px] h-[18px]" />
                     </button>
                     <button
                       onClick={(e) => { e.stopPropagation(); toggleFavorite(reviewSentences[currentCardIndex].id); }}
                       className={`p-2 rounded-full transition-colors ${favorites.includes(reviewSentences[currentCardIndex].id || '') ? 'text-yellow-500' : 'text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-zinc-800'}`}
                     >
                       <Star className={`w-[18px] h-[18px] ${favorites.includes(reviewSentences[currentCardIndex].id || '') ? 'fill-current' : ''}`} />
                     </button>
                  </div>
                  <CardContent className="p-6 w-full flex flex-col justify-center items-center min-h-[300px]">
                    {!isFlipped ? (
                      <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="text-[12px] font-bold text-zinc-400 tracking-wider mb-2">TIẾNG VIỆT</div>
                        <div className="text-2xl font-medium text-zinc-800 dark:text-zinc-100">
                          {reviewSentences[currentCardIndex].vietnamese}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in zoom-in duration-300 w-full">
                        <div className="text-[12px] font-bold text-blue-600 dark:text-blue-400 tracking-wider mb-2">TIẾNG TRUNG</div>
                        <div className="text-3xl font-medium text-zinc-800 dark:text-zinc-100 relative group flex items-center justify-center gap-3">
                          {reviewSentences[currentCardIndex].chinese}
                          <button 
                            onClick={(e) => { e.stopPropagation(); speak(reviewSentences[currentCardIndex].chinese, 'zh-TW'); }}
                            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="text-[16px] text-zinc-500 dark:text-zinc-400">
                          [{reviewSentences[currentCardIndex].pinyin}]
                        </div>
                        <div className="pt-4 mt-4 border-t border-blue-100 dark:border-zinc-800 w-full max-w-[80%] mx-auto">
                           <div className="text-[15px] text-zinc-700 dark:text-zinc-300">
                             {reviewSentences[currentCardIndex].english}
                           </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <div className="absolute bottom-4 right-4 text-[12px] text-zinc-400">
                    Chạm để lật thẻ
                  </div>
                </Card>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl bg-white dark:bg-zinc-900 border-none shadow-sm text-zinc-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setCurrentCardIndex(prev => prev > 0 ? prev - 1 : reviewSentences.length - 1);
                      setIsFlipped(false);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Trước
                  </Button>
                  
                  <Button 
                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={() => {
                      setCurrentCardIndex(prev => (prev + 1) % reviewSentences.length);
                      setIsFlipped(false);
                    }}
                  >
                    Tiếp theo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

              </div>
            )}
          </div>
        )}
        {tab === 'scan' && (
          <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100 px-1">Máy Quét Menu</h1>
            
            {cropImageSrc && (
              <div className="fixed inset-0 z-50 flex flex-col bg-black">
                <div className="p-4 flex items-center justify-between bg-zinc-900 text-white">
                  <button onClick={() => setCropImageSrc(null)} className="p-2 rounded-full bg-zinc-800">
                    <X className="w-5 h-5" />
                  </button>
                  <span className="font-medium">Cắt chữ cần quét</span>
                  <button onClick={handleCropConfirm} className="px-4 py-2 bg-blue-600 rounded-full font-medium text-sm text-white">
                    Quét
                  </button>
                </div>
                <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-h-full"
                  >
                    <img 
                      ref={imgRef}
                      src={cropImageSrc} 
                      className="max-w-full max-h-[80vh] object-contain"
                      alt="Crop target" 
                    />
                  </ReactCrop>
                </div>
              </div>
            )}

            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="p-8 flex flex-col items-center justify-center min-h-[250px] relative bg-zinc-50 dark:bg-zinc-950/50">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Chụp ảnh menu"
                />
                
                {isOcrLoading ? (
                  <div className="text-center space-y-4">
                    <div className="relative inline-flex items-center justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    </div>
                    <p className="text-zinc-500 text-[15px]">Đang trích xuất dữ liệu ảnh...</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">Chạm để Chụp / Chọn Ảnh</p>
                      <p className="text-zinc-500 text-[13.5px] mt-1">Hệ thống sẽ tự đọc chữ và dịch sang Tiếng Việt</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {scanPreview && !isOcrLoading && (
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-zinc-50 dark:border-zinc-800/50 bg-[#F0F2F5]/50 dark:bg-zinc-800/30">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Kết quả dịch</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-[22px] font-medium text-zinc-800 dark:text-zinc-100 mb-1">{scanPreview.chinese}</div>
                    <div className="text-[14px] text-zinc-500 dark:text-zinc-400">[{scanPreview.pinyin}]</div>
                  </div>
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                    <div className="text-[15px] font-medium text-blue-600 dark:text-blue-400">{scanPreview.vietnamese}</div>
                    <div className="text-[15px] text-zinc-700 dark:text-zinc-300">{scanPreview.english}</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
