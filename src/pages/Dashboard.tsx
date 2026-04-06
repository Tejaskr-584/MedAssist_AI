import { useHistory } from '../hooks/useHistory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Activity, History as HistoryIcon, TrendingUp, AlertCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

export function Dashboard() {
  const { history, isLoading } = useHistory();

  // Process data for charts
  const symptomFrequency = history.reduce((acc: any, chat) => {
    const conditions = chat.lastAnalysis?.possibleConditions || [];
    conditions.forEach((condition: string) => {
      acc[condition] = (acc[condition] || 0) + 1;
    });
    return acc;
  }, {});

  const barData = Object.entries(symptomFrequency)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const timelineData = history
    .map(chat => ({
      date: format(chat.createdAt?.toDate() || new Date(), 'MMM dd'),
      severity: chat.lastAnalysis?.severity === 'Severe' ? 3 : chat.lastAnalysis?.severity === 'Moderate' ? 2 : 1,
      fullDate: format(chat.createdAt?.toDate() || new Date(), 'PPpp')
    }))
    .reverse();

  const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Loading Health Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">Health Dashboard</h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium">Track your symptoms, trends, and medical history.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} />
            AI Insights Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stats Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Symptom Frequency Chart */}
            <div className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground tracking-tight">Symptom Frequency</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Top reported conditions</p>
                </div>
                <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem' }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Trend Chart */}
            <div className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground tracking-tight">Severity Trend</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Health progression</p>
                </div>
                <div className="w-10 h-10 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis hide domain={[0, 4]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="severity" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent History List */}
          <div className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground tracking-tight">Recent Consultations</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Detailed history</p>
              </div>
              <HistoryIcon size={24} className="text-muted-foreground/40" />
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="py-10 text-center space-y-4">
                  <AlertCircle size={40} className="mx-auto text-muted-foreground/20" />
                  <p className="text-sm font-bold text-muted-foreground">No consultation history found.</p>
                </div>
              ) : (
                history.slice(0, 5).map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-5 bg-muted/30 rounded-[1.5rem] border border-border/50 hover:border-brand-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                        chat.lastAnalysis?.severity === 'Severe' ? "bg-rose-500 shadow-rose-500/20" :
                        chat.lastAnalysis?.severity === 'Moderate' ? "bg-amber-500 shadow-amber-500/20" :
                        "bg-emerald-500 shadow-emerald-500/20"
                      )}>
                        <Activity size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-foreground truncate max-w-[200px] sm:max-w-md">
                          {chat.title || 'Health Consultation'}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {format(chat.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {format(chat.createdAt?.toDate() || new Date(), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      chat.lastAnalysis?.severity === 'Severe' ? "bg-rose-500/10 text-rose-600" :
                      chat.lastAnalysis?.severity === 'Moderate' ? "bg-amber-500/10 text-amber-600" :
                      "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {chat.lastAnalysis?.severity || 'Normal'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingUp size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tight leading-tight">AI Health Summary</h4>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  Based on your recent consultations, you've reported symptoms related to <span className="font-black text-white">{barData[0]?.name || 'various conditions'}</span>. 
                  {history.length > 5 ? " Your health trend shows a stable progression." : " Start more consultations to get detailed AI insights."}
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-brand-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/90 transition-colors shadow-xl"
              >
                Start New Consultation
              </button>
            </div>
          </div>

          <div className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Health Tips</h3>
            <div className="space-y-4">
              {[
                { title: "Stay Hydrated", desc: "Drink at least 8 glasses of water daily for optimal health.", icon: Activity },
                { title: "Regular Sleep", desc: "Ensure 7-9 hours of quality sleep to boost your immune system.", icon: Clock },
                { title: "Daily Movement", desc: "A 30-minute walk can significantly improve cardiovascular health.", icon: TrendingUp }
              ].map((tip, i) => (
                <div key={i} className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-border/30">
                  <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                    <tip.icon size={18} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-foreground">{tip.title}</h5>
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
