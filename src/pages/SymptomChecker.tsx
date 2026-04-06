import { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, AlertTriangle, CheckCircle, Info, Stethoscope, Loader2, Activity, HeartPulse, ShieldCheck, Sparkles, ChevronRight, MapPin, Star, Calendar, Clock, Trash2, Plus, MessageSquare, Navigation, Download, AlertCircle, Phone, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { useLanguage } from '../hooks/useLanguage';
import { useEmergency } from '../hooks/useEmergency';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { analyzeSymptoms, SymptomAnalysis, isHealthQuery } from '../services/gemini';
import { db } from '../firebase/config';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { sanitizeForFirestore } from '../utils/firestore';
import { cn } from '../utils/cn';
import { Typewriter } from '../components/Typewriter';
import { EmergencyModal } from '../components/EmergencyModal';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: SymptomAnalysis;
  isFollowUp?: boolean;
  isTyping?: boolean;
}

export function SymptomChecker() {
  const { user } = useAuth();
  const { location, setLocation, useCurrentLocation, isLoading: isLocating } = useLocation();
  const { language, t } = useLanguage();
  const { isEmergency, setIsEmergency } = useEmergency();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyModalMessage, setEmergencyModalMessage] = useState('');
  const [tempLocation, setTempLocation] = useState(location);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening } = useVoiceInput(
    (text) => setInput(prev => prev + (prev ? ' ' : '') + text),
    language
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Client-side validation
    if (!isHealthQuery(textToSend)) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t(
          'This is MedAssist AI, a medical assistant. Please ask health-related questions only.',
          'यह मेडअसिस्ट एआई है, एक चिकित्सा सहायक। कृपया केवल स्वास्थ्य संबंधी प्रश्न ही पूछें।'
        ),
      };
      setMessages(prev => [...prev, botMessage]);
      return;
    }

    setIsLoading(true);

    try {
      const chatHistory = messages.concat(userMessage).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content
      }));

      const analysis = await analyzeSymptoms(chatHistory, { language, isEmergency });
      
      let botContent = '';
      if (analysis.intent === 'non_medical') {
        botContent = analysis.emergencyWarning || t('Please ask health-related questions only.', 'कृपया केवल स्वास्थ्य संबंधी प्रश्न ही पूछें।');
      } else if (analysis.intent === 'medical_info') {
        botContent = analysis.generalExplanation || '';
      } else if (analysis.followUpQuestions && analysis.followUpQuestions.length > 0) {
        botContent = analysis.followUpQuestions.join('\n\n');
      } else {
        botContent = analysis.isHealthRelated 
          ? t('Based on your symptoms, here is my analysis:', 'आपके लक्षणों के आधार पर, यहाँ मेरा विश्लेषण है:')
          : analysis.emergencyWarning || t('Please ask health-related questions only.', 'कृपया केवल स्वास्थ्य संबंधी प्रश्न ही पूछें।');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botContent,
        analysis: (analysis.isHealthRelated && analysis.intent === 'symptom_analysis' && (!analysis.followUpQuestions || analysis.followUpQuestions.length === 0)) ? analysis : undefined,
        isFollowUp: analysis.followUpQuestions && analysis.followUpQuestions.length > 0,
        isTyping: true
      };

      setMessages(prev => [...prev, botMessage]);

      // Check for emergency triggers
      const emergencyKeywords = ["emergency", "severe", "urgent", "immediate attention", "आपातकालीन", "गंभीर", "तत्काल"];
      const hasEmergencyKeyword = emergencyKeywords.some(keyword => 
        botContent.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasEmergencyKeyword || analysis.severity === 'Severe') {
        setEmergencyModalMessage(analysis.emergencyWarning || botContent);
        setIsEmergencyModalOpen(true);
      }

      // Save to Firestore - Fixed logic to ensure all messages are saved in the same session
      if (user) {
        const updatedMessages = [...messages, userMessage, botMessage];
        
        try {
          const chatData = sanitizeForFirestore({
            userId: user.uid,
            messages: updatedMessages,
            lastAnalysis: analysis || null,
            location,
            severity: analysis.severity,
            language,
            isEmergency,
            updatedAt: serverTimestamp(),
            ...(messages.length === 0 ? {
              createdAt: serverTimestamp(),
              title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '')
            } : {})
          });

          await setDoc(doc(db, 'chats', sessionId), chatData, { merge: true });
        } catch (error) {
          console.error("Error saving chat:", error);
          handleFirestoreError(error, OperationType.WRITE, 'chats');
        }
      }
    } catch (error) {
      console.error('Error in symptom analysis:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t(
          'I apologize, but I encountered an error while analyzing your symptoms. Please try again.',
          'क्षमा करें, लेकिन आपके लक्षणों का विश्लेषण करते समय मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुनः प्रयास करें।'
        )
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = (analysis: SymptomAnalysis, userSymptoms: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('MedAssist AI Health Report', 20, 25);
    
    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 50);
    doc.text(`Patient: ${user?.displayName || 'User'}`, 20, 60);
    doc.text(`Detected Severity: ${analysis.severity}`, 20, 70);
    
    doc.setFontSize(14);
    doc.text('Reported Symptoms:', 20, 85);
    doc.setFontSize(11);
    const splitSymptoms = doc.splitTextToSize(userSymptoms, 170);
    doc.text(splitSymptoms, 20, 95);
    
    // Analysis Table
    (doc as any).autoTable({
      startY: 110,
      head: [['Category', 'Details']],
      body: [
        ['Possible Conditions', analysis.possibleConditions.join(', ')],
        ['Severity Level', analysis.severity],
        ['Recommended Specialist', analysis.recommendedDoctor],
        ['Suggested Actions', analysis.suggestedActions.join('\n')]
      ],
      theme: 'grid',
      headStyles: { fillStyle: [99, 102, 241] }
    });
    
    if (analysis.emergencyWarning) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(14);
      doc.text('EMERGENCY WARNING:', 20, finalY);
      doc.setFontSize(11);
      const splitWarning = doc.splitTextToSize(analysis.emergencyWarning, 170);
      doc.text(splitWarning, 20, finalY + 10);
    }
    
    doc.save(`MedAssist_Report_${Date.now()}.pdf`);
  };

  const handleUpdateLocation = () => {
    setLocation(tempLocation);
    setIsLocationModalOpen(false);
  };

  const resetChat = () => {
    setMessages([]);
    setIsEmergency(false);
    setSessionId(Date.now().toString());
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card/40 rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden relative transition-all duration-500",
      isEmergency && "border-rose-500/50 shadow-rose-500/10"
    )}>
      {/* Emergency Modal */}
      <EmergencyModal 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setIsEmergencyModalOpen(false)} 
        message={emergencyModalMessage}
      />

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={cn(
            "w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center text-white shadow-lg",
            isEmergency ? "bg-rose-600 shadow-rose-500/20" : "bg-gradient-to-br from-brand-primary to-brand-secondary shadow-brand-primary/20"
          )}>
            <Bot size={20} className="sm:w-[24px]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground leading-tight">MedAssist AI</h2>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isEmergency ? "bg-rose-500" : "bg-emerald-500"
              )} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isEmergency ? "text-rose-600" : "text-emerald-600"
              )}>
                {isEmergency ? t('Emergency Assistant', 'आपातकालीन सहायक') : t('Active Assistant', 'सक्रिय सहायक')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border/50 rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted/80 transition-colors"
          >
            <Plus size={14} />
            {t('New Chat', 'नई चैट')}
          </button>
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-[10px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/20 transition-colors"
          >
            <MapPin size={14} />
            {location}
          </button>
          <div className={cn(
            "hidden sm:flex items-center gap-2 px-4 py-2 border rounded-2xl text-[10px] font-black uppercase tracking-widest",
            isEmergency ? "bg-rose-500/10 border-rose-500/20 text-rose-600" : "bg-muted/50 border-border/50 text-muted-foreground"
          )}>
            {isEmergency ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}
            {isEmergency ? t('URGENT MODE', 'तत्काल मोड') : t('SECURE & PRIVATE', 'सुरक्षित और निजी')}
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6 border border-border">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight">{t('Set Your Location', 'अपना स्थान निर्धारित करें')}</h3>
              <p className="text-muted-foreground font-medium">{t('We use this to recommend doctors near you.', 'हम इसका उपयोग आपके पास के डॉक्टरों की सिफारिश करने के लिए करते हैं।')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  placeholder={t('Enter city or pincode...', 'शहर या पिनकोड दर्ज करें...')}
                  className="w-full bg-muted border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
              
              <button 
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="w-full py-4 bg-muted border border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-muted/80 transition-all"
              >
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                {t('Use Current Location', 'वर्तमान स्थान का उपयोग करें')}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button 
                onClick={handleUpdateLocation}
                className="flex-1 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all"
              >
                {t('Save Location', 'स्थान सहेजें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 sm:space-y-8 md:space-y-10 scroll-smooth bg-gradient-to-b from-background to-background/50"
      >
        {isEmergency && (
          <div className="bg-rose-600/10 border border-rose-500/30 rounded-[2rem] p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 text-rose-600">
              <AlertCircle size={32} />
              <h3 className="text-xl font-black tracking-tight uppercase">{t('Emergency Instructions', 'आपातकालीन निर्देश')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-sm font-bold text-foreground">{t('Immediate Steps:', 'तत्काल कदम:')}</p>
                <ul className="space-y-2 text-xs font-medium text-muted-foreground list-disc pl-4">
                  <li>{t('Call emergency services (102/108) immediately.', 'तुरंत आपातकालीन सेवाओं (102/108) को कॉल करें।')}</li>
                  <li>{t('Stay calm and try to regulate your breathing.', 'शांत रहें और अपनी सांस को नियंत्रित करने का प्रयास करें।')}</li>
                  <li>{t('Do not attempt to drive yourself to the hospital.', 'स्वयं अस्पताल जाने का प्रयास न करें।')}</li>
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-foreground">{t('Nearest Hospitals:', 'निकटतम अस्पताल:')}</p>
                <div className="space-y-2">
                  {[
                    { name: t('City General Hospital', 'सिटी जनरल अस्पताल'), dist: '1.2 km' },
                    { name: t('LifeCare Emergency Center', 'लाइफकेयर इमरजेंसी सेंटर'), dist: '2.5 km' }
                  ].map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-rose-500/10">
                      <span className="text-xs font-bold text-foreground">{h.name}</span>
                      <span className="text-[10px] font-black text-rose-500">{h.dist}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20">
              <Phone size={18} />
              {t('CALL EMERGENCY SERVICES', 'आपातकालीन सेवाओं को कॉल करें')}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary blur-3xl opacity-20 animate-pulse" />
              <div className="w-24 h-24 bg-card border border-border text-brand-primary rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
                <HeartPulse size={48} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-foreground tracking-tight">{t('How can I help you today?', 'मैं आज आपकी कैसे मदद कर सकता हूँ?')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-medium leading-relaxed">
                {t("I'm your AI health assistant. Describe your symptoms, and I'll provide structured insights and guidance.", "मैं आपका एआई स्वास्थ्य सहायक हूँ। अपने लक्षणों का वर्णन करें, और मैं संरचित अंतर्दृष्टि और मार्गदर्शन प्रदान करूँगा।")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                t("I have a persistent headache...", "मुझे लगातार सिरदर्द हो रहा है..."),
                t("My lower back hurts since morning", "सुबह से मेरी कमर के निचले हिस्से में दर्द हो रहा है"),
                t("I'm feeling nauseous and dizzy", "मुझे मतली और चक्कर आ रहे हैं"),
                t("Sharp pain in my chest when breathing", "सांस लेते समय मेरे सीने में तेज दर्द")
              ].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-5 py-4 bg-card/40 border border-border/50 rounded-2xl text-xs font-bold text-muted-foreground hover:border-brand-primary hover:text-brand-primary hover:shadow-lg transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={cn(
              "flex gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
              msg.role === 'user' ? "bg-card text-muted-foreground border border-border" : "bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-brand-primary/20"
            )}>
              {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={24} />}
            </div>

            <div className={cn(
              "max-w-[85%] md:max-w-[75%] space-y-6",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "p-5 md:p-7 rounded-[2rem] text-sm md:text-base leading-relaxed font-medium",
                msg.role === 'user' 
                  ? "chat-bubble-user rounded-tr-none" 
                  : "chat-bubble-bot rounded-tl-none"
              )}>
                {msg.role === 'assistant' && msg.isTyping ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest animate-pulse">
                      <Sparkles size={12} />
                      {t('AI is typing...', 'एआई टाइप कर रहा है...')}
                    </div>
                    <Typewriter 
                      text={msg.content} 
                      speed={30} 
                      onTick={() => {
                        if (scrollRef.current) {
                          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                        }
                      }}
                      onComplete={() => {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyping: false } : m));
                      }} 
                    />
                  </div>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
                
                {msg.isFollowUp && !msg.isTyping && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[t('Yes', 'हाँ'), t('No', 'नहीं'), t('Not sure', 'पक्का नहीं')].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => handleSend(`${msg.content} - ${opt}`)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.analysis && !msg.isTyping && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700 delay-300">
                  {/* Severity & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                      msg.analysis.severity === 'Mild' && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                      msg.analysis.severity === 'Moderate' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                      msg.analysis.severity === 'Severe' && "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    )}>
                      {msg.analysis.severity === 'Severe' ? <AlertTriangle size={16} /> : <Info size={16} />}
                      {t('Severity', 'गंभीरता')}: {msg.analysis.severity}
                    </div>

                    <button 
                      onClick={() => downloadReport(msg.analysis!, messages.find(m => m.id === (parseInt(msg.id) - 1).toString())?.content || '')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-muted border border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground hover:border-brand-primary transition-all"
                    >
                      <Download size={16} />
                      {t('Download Report', 'रिपोर्ट डाउनलोड करें')}
                    </button>
                  </div>

                  {msg.analysis.emergencyWarning && (
                    <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-3xl p-6 flex gap-4 shadow-2xl shadow-rose-500/20">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="text-sm">
                        <p className="font-black text-base mb-1 uppercase tracking-tight">{t('Emergency Alert', 'आपातकालीन चेतावनी')}</p>
                        <p className="font-medium opacity-90 leading-relaxed">{msg.analysis.emergencyWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* Analysis Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Conditions */}
                    <div className="bg-card/40 border border-border/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
                          <Activity size={16} />
                        </div>
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('Possible Conditions', 'संभावित स्थितियाँ')}</h4>
                      </div>
                      <ul className="space-y-3">
                        {msg.analysis.possibleConditions.map((c, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground">
                            <div className="w-1.5 h-1.5 bg-brand-primary/60 rounded-full shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="bg-card/40 border border-border/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                          <CheckCircle size={16} />
                        </div>
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('Suggested Actions', 'सुझाए गए कार्य')}</h4>
                      </div>
                      <ul className="space-y-3">
                        {msg.analysis.suggestedActions.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-bold text-foreground">
                            <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle size={12} />
                            </div>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Doctor Recommendation */}
                  <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-brand-primary/10 border border-white/5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                        < Stethoscope size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">{t('Recommended Specialist', 'अनुशंसित विशेषज्ञ')}</p>
                        <p className="text-lg font-black tracking-tight">{msg.analysis.recommendedDoctor}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = `/experts?specialty=${msg.analysis?.recommendedDoctor}&location=${location}`}
                      className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 text-xs font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                    >
                      {t('FIND EXPERTS NEAR YOU', 'अपने पास विशेषज्ञ खोजें')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 md:gap-6 animate-pulse">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white shrink-0">
              <Bot size={24} />
            </div>
            <div className="bg-card/60 border border-border/50 p-5 md:p-7 rounded-[2rem] rounded-tl-none flex items-center gap-3 text-muted-foreground text-sm font-bold shadow-sm">
              <div className="flex gap-1 mr-2">
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
              </div>
              {t('AI is thinking...', 'एआई सोच रहा है...')}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-card/60 border-t border-border/50 space-y-4 sm:space-y-6">
        {/* Controls */}
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border/50 rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <Sparkles size={14} className="text-brand-primary" />
              {t('Smart Doctor Mode Active', 'स्मार्ट डॉक्टर मोड सक्रिय')}
            </div>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto group">
          <div className={cn(
            "absolute -inset-1 rounded-[2rem] blur opacity-10 group-focus-within:opacity-25 transition duration-500",
            isEmergency ? "bg-rose-500" : "bg-gradient-to-r from-brand-primary to-brand-secondary"
          )} />
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? t("Listening...", "सुन रहा हूँ...") : t("Describe how you're feeling...", "बताएं कि आप कैसा महसूस कर रहे हैं...")}
              className={cn(
                "w-full bg-card border border-border rounded-xl sm:rounded-[1.5rem] py-3 sm:py-4 lg:py-5 pl-4 sm:pl-6 pr-24 sm:pr-32 text-xs sm:text-sm md:text-base font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-xl",
                isListening && "ring-4 ring-brand-primary/20 border-brand-primary animate-pulse"
              )}
            />
            <div className="absolute right-2 sm:right-3 flex items-center gap-1 sm:gap-2">
              <button
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  "p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl transition-all flex items-center justify-center shadow-lg active:scale-90",
                  isListening 
                    ? "bg-rose-500 text-white animate-bounce" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                title={isListening ? t("Stop Listening", "सुनना बंद करें") : t("Voice Input", "आवाज इनपुट")}
              >
                {isListening ? <MicOff size={16} className="sm:w-[18px] lg:w-[20px]" /> : <Mic size={16} className="sm:w-[18px] lg:w-[20px]" />}
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2.5 sm:p-3 lg:p-4 text-white rounded-lg sm:rounded-xl lg:rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg active:scale-90",
                  isEmergency ? "bg-rose-600 shadow-rose-500/20" : "bg-gradient-to-r from-brand-primary to-brand-secondary shadow-brand-primary/20"
                )}
              >
                <Send size={16} className="sm:w-[18px] lg:w-[20px]" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <ShieldCheck size={10} className="sm:w-[12px] text-muted-foreground/40" />
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            {t('AI Guidance • Not Medical Advice • Secure Data', 'एआई मार्गदर्शन • चिकित्सा सलाह नहीं • सुरक्षित डेटा')}
          </p>
        </div>
      </div>
    </div>
  );
}
