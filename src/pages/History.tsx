import { useState, useEffect } from 'react';
import { History as HistoryIcon, MessageSquare, Calendar, ChevronRight, Search, Trash2, AlertTriangle, Info, CheckCircle, Loader2, Eye, Bot, User, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { cn } from '../utils/cn';
import { SymptomAnalysis } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  lastAnalysis?: SymptomAnalysis;
  createdAt: any;
}

export function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(sessionsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this chat session?')) return;
    try {
      await deleteDoc(doc(db, 'chats', id));
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-primary" size={48} />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Loading History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-foreground tracking-tight">Consultation History</h1>
        <p className="text-muted-foreground font-medium">Review your past symptom analyses and AI recommendations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sessions List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-brand-primary rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input 
                type="text" 
                placeholder="Search history..." 
                className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center p-12 bg-card/40 border border-dashed border-border rounded-[2.5rem] space-y-4">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/20 mx-auto">
                  <HistoryIcon size={32} />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No history found</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    "p-5 bg-card/40 border rounded-[2rem] cursor-pointer transition-all duration-300 group relative overflow-hidden",
                    selectedSession?.id === session.id 
                      ? "border-brand-primary ring-4 ring-brand-primary/10 shadow-xl translate-x-2" 
                      : "border-border/50 hover:border-brand-primary/40 hover:shadow-lg"
                  )}
                >
                  {selectedSession?.id === session.id && (
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-brand-primary" />
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                        selectedSession?.id === session.id ? "bg-brand-primary text-white shadow-brand-primary/20" : "bg-muted text-muted-foreground group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                      )}>
                        <MessageSquare size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-foreground truncate tracking-tight text-sm">{session.title}</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
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

        {/* Session Detail */}
        <div className="lg:col-span-8">
          {selectedSession ? (
            <div className="bg-card/40 border border-border/50 rounded-[2.5rem] shadow-2xl shadow-brand-primary/5 overflow-hidden flex flex-col h-full min-h-[600px] animate-in slide-in-from-right-8 duration-500 transition-colors">
              <div className="p-8 md:p-10 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 rotate-3">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">Consultation Details</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {selectedSession.createdAt?.toDate ? selectedSession.createdAt.toDate().toLocaleDateString('en-US', { dateStyle: 'full' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12 bg-gradient-to-b from-card/20 to-card/40">
                {/* Analysis Summary */}
                {selectedSession.lastAnalysis && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">AI Analysis Summary</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-card/40 p-6 rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-brand-primary">
                          <Activity size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Conditions</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSession.lastAnalysis.possibleConditions.map((c, i) => (
                            <span key={i} className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold border border-brand-primary/20">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-card/40 p-6 rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-rose-600">
                          <AlertCircle size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Severity</span>
                        </div>
                        <span className={cn(
                          "inline-block px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
                          selectedSession.lastAnalysis.severity === 'Severe' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                          selectedSession.lastAnalysis.severity === 'Moderate' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        )}>
                          {selectedSession.lastAnalysis.severity}
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Conversation Log */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted text-muted-foreground rounded-xl flex items-center justify-center">
                      <HistoryIcon size={16} />
                    </div>
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Conversation Log</h3>
                  </div>
                  <div className="space-y-6">
                    {selectedSession.messages.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex gap-4",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                          msg.role === 'user' ? "bg-foreground text-background" : "bg-gradient-to-br from-brand-primary to-brand-secondary text-white"
                        )}>
                          {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={cn(
                          "max-w-[80%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm border",
                          msg.role === 'user' 
                            ? "bg-card border-border text-foreground rounded-tr-none" 
                            : "bg-brand-primary/10 border-brand-primary/20 text-foreground rounded-tl-none"
                        )}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
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
                <h3 className="text-2xl font-black text-foreground tracking-tight">Select a consultation</h3>
                <p className="text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
                  Choose a past session from the list to review the conversation and AI analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
