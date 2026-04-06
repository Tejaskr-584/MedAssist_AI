import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Eye, Loader2, Plus, Search, FileCheck, AlertCircle, Calendar, Bot, User, FileUp, Sparkles, Brain, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { analyzeMedicalRecord } from '../services/gemini';
import { cn } from '../utils/cn';
import ReactMarkdown from 'react-markdown';

interface MedicalRecord {
  id: string;
  title: string;
  content: string;
  analysis?: string;
  createdAt: any;
}

export function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ title: '', content: '' });
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'records'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalRecord[];
      setRecords(recordsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'records');
    });

    return unsubscribe;
  }, [user]);

  const handleAddRecord = async () => {
    if (!newRecord.title || !newRecord.content || !user) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'records'), {
        userId: user.uid,
        title: newRecord.title,
        content: newRecord.content,
        createdAt: serverTimestamp()
      });
      setNewRecord({ title: '', content: '' });
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'records');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDoc(doc(db, 'records', id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `records/${id}`);
    }
  };

  const handleAnalyze = async (record: MedicalRecord) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeMedicalRecord(record.content);
      setSelectedRecord({ ...record, analysis });
    } catch (error) {
      console.error('Error analyzing record:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground font-medium">Securely store and analyze your medical history with AI.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:opacity-90 transition-all shadow-2xl shadow-brand-primary/20 active:scale-95"
        >
          <Plus size={20} />
          ADD NEW RECORD
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Records List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-brand-primary rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input 
                type="text" 
                placeholder="Search your records..." 
                className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="text-center p-12 bg-card/40 border border-dashed border-border rounded-[2.5rem] space-y-4">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/20 mx-auto">
                  <FileText size={32} />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No records yet</p>
              </div>
            ) : (
              records.map((record) => (
                <div 
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={cn(
                    "p-5 bg-card/40 border rounded-[2rem] cursor-pointer transition-all duration-300 group relative overflow-hidden",
                    selectedRecord?.id === record.id 
                      ? "border-brand-primary ring-4 ring-brand-primary/10 shadow-xl translate-x-2" 
                      : "border-border/50 hover:border-brand-primary/40 hover:shadow-lg"
                  )}
                >
                  {selectedRecord?.id === record.id && (
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-brand-primary" />
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                        selectedRecord?.id === record.id ? "bg-brand-primary text-white shadow-brand-primary/20" : "bg-muted text-muted-foreground group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                      )}>
                        <FileCheck size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-foreground truncate tracking-tight">{record.title}</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecord(record.id);
                      }}
                      className="p-2 text-muted-foreground/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Record Detail & Analysis */}
        <div className="lg:col-span-8">
          {selectedRecord ? (
            <div className="bg-card/40 border border-border/50 rounded-[2.5rem] shadow-2xl shadow-brand-primary/5 overflow-hidden flex flex-col h-full min-h-[600px] animate-in slide-in-from-right-8 duration-500 transition-colors">
              <div className="p-8 md:p-10 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 rotate-3">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">{selectedRecord.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={14} className="text-muted-foreground" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {selectedRecord.createdAt?.toDate ? selectedRecord.createdAt.toDate().toLocaleDateString('en-US', { dateStyle: 'full' }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleAnalyze(selectedRecord)}
                  disabled={isAnalyzing}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-4 rounded-2xl font-black text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-brand-primary/20 active:scale-95"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Bot size={20} />}
                  {isAnalyzing ? 'ANALYZING...' : 'GENERATE AI SUMMARY'}
                </button>
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12 bg-gradient-to-b from-card/20 to-card/40">
                {/* Content */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted text-muted-foreground rounded-xl flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Record Content</h3>
                  </div>
                  <div className="bg-card/40 rounded-[2rem] p-8 text-foreground text-sm md:text-base leading-relaxed whitespace-pre-wrap border border-border/50 shadow-sm font-medium">
                    {selectedRecord.content}
                  </div>
                </section>

                {/* Analysis */}
                {selectedRecord.analysis && (
                  <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">AI Insights & Summary</h3>
                    </div>
                    <div className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-brand-primary/20 border border-white/5">
                      <div className="prose prose-invert prose-sm md:prose-base max-w-none font-medium leading-relaxed">
                        <ReactMarkdown>{selectedRecord.analysis}</ReactMarkdown>
                      </div>
                    </div>
                  </section>
                )}

                {!selectedRecord.analysis && !isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-card/40 rounded-[2.5rem] border border-dashed border-border shadow-sm">
                    <div className="relative">
                      <div className="absolute inset-0 bg-brand-primary blur-2xl opacity-10 animate-pulse" />
                      <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center text-brand-primary shadow-xl relative z-10 border border-border">
                        <Bot size={40} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black text-foreground tracking-tight">Ready for AI Analysis</p>
                      <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        Let our medical AI summarize this record into patient-friendly language.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] bg-card/40 border border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-muted blur-3xl opacity-20" />
                <div className="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center text-muted-foreground/20 relative z-10">
                  <Eye size={64} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Select a record to view</h3>
                <p className="text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
                  Choose a medical document from your library to see details and AI-powered insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-foreground/20 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
            <div className="p-8 md:p-10 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                  <Plus size={24} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Add New Record</h2>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 md:p-10 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Record Title</label>
                <input 
                  type="text" 
                  value={newRecord.title}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Annual Physical Report 2024"
                  className="w-full bg-muted border border-border rounded-2xl py-5 px-6 text-base font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Record Content / Notes</label>
                <textarea 
                  rows={10}
                  value={newRecord.content}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Paste the text from your medical report or enter your detailed notes here..."
                  className="w-full bg-muted border border-border rounded-[2rem] py-5 px-6 text-base font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-8 md:p-10 bg-muted flex gap-4 border-t border-border/50">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-5 bg-card border border-border text-foreground font-black text-xs rounded-2xl hover:bg-muted transition-all active:scale-95"
              >
                CANCEL
              </button>
              <button 
                onClick={handleAddRecord}
                disabled={isUploading || !newRecord.title || !newRecord.content}
                className="flex-1 px-6 py-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black text-xs rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 active:scale-95"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {isUploading ? 'SAVING...' : 'SAVE MEDICAL RECORD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }: { size?: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}
