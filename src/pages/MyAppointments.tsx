import { useAppointments } from '../hooks/useAppointments';
import { Calendar, Clock, User, Stethoscope, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useLanguage } from '../hooks/useLanguage';

export function MyAppointments() {
  const { appointments, loading, error } = useAppointments();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest animate-pulse">
            {t('Loading appointments...', 'अपॉइंटमेंट लोड हो रहे हैं...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/20 text-rose-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-rose-600 tracking-tight">{t('Error Loading Data', 'डेटा लोड करने में त्रुटि')}</h3>
            <p className="text-sm font-medium text-rose-600/80 leading-relaxed">
              {t('We encountered an issue while fetching your appointments. Please try again later.', 'आपके अपॉइंटमेंट प्राप्त करते समय हमें एक समस्या हुई। कृपया बाद में पुनः प्रयास करें।')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tight">{t('My Appointments', 'मेरे अपॉइंटमेंट')}</h1>
          <p className="text-muted-foreground font-medium">{t('Manage and track your upcoming medical consultations.', 'अपने आगामी चिकित्सा परामर्शों को प्रबंधित और ट्रैक करें।')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-[10px] font-black text-brand-primary uppercase tracking-widest shadow-sm">
            {appointments.length} {t('Appointments', 'अपॉइंटमेंट')}
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="py-20 text-center space-y-8 bg-card/40 border border-dashed border-border rounded-[3rem] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center text-muted-foreground/40 mx-auto shadow-inner">
            <Calendar size={48} />
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-black text-foreground tracking-tight">{t('No appointments found', 'कोई अपॉइंटमेंट नहीं मिला')}</p>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t("You haven't booked any consultations yet. Find an expert to schedule your first session.", "आपने अभी तक कोई परामर्श बुक नहीं किया है। अपना पहला सत्र निर्धारित करने के लिए एक विशेषज्ञ खोजें।")}
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/experts'}
            className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-xl shadow-brand-primary/20 transition-all active:scale-95"
          >
            {t('FIND AN EXPERT', 'एक विशेषज्ञ खोजें')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id}
              className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1"
            >
              {/* Status Badge */}
              <div className="absolute top-0 right-0 p-6">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full shadow-sm",
                  appointment.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-600" :
                  appointment.status === 'cancelled' ? "bg-rose-500/10 text-rose-600" :
                  "bg-blue-500/10 text-blue-600"
                )}>
                  {appointment.status === 'confirmed' ? <CheckCircle size={12} /> :
                   appointment.status === 'cancelled' ? <XCircle size={12} /> :
                   <Loader2 size={12} className="animate-spin" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {t(appointment.status.toUpperCase(), appointment.status.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner border border-brand-primary/10">
                    <User size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-brand-primary transition-colors">
                      {appointment.doctorName}
                    </h3>
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Stethoscope size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">{appointment.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('Date', 'दिनांक')}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{appointment.date}</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('Time', 'समय')}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{appointment.time}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {t('Booked on', 'बुक किया गया')} {new Date(appointment.createdAt?.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {appointment.status === 'confirmed' && (
                    <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">
                      {t('Cancel', 'रद्द करें')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
