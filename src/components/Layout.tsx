import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  FileText, 
  History, 
  Users, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  HeartPulse,
  Sun,
  Moon,
  LayoutDashboard,
  Globe,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useEmergency } from '../hooks/useEmergency';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { isEmergency, setIsEmergency } = useEmergency();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: t('Symptom Checker', 'लक्षण जांच'), path: '/', icon: Activity },
    { name: t('Dashboard', 'डैशबोर्ड'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('My Appointments', 'मेरे अपॉइंटमेंट'), path: '/appointments', icon: Calendar },
    { name: t('Medical Records', 'मेडिकल रिकॉर्ड'), path: '/records', icon: FileText },
    { name: t('History', 'इतिहास'), path: '/history', icon: History },
    { name: t('Experts', 'विशेषज्ञ'), path: '/experts', icon: Users },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={cn(
      "flex h-screen bg-background overflow-hidden font-sans transition-colors duration-500",
      isEmergency && "bg-rose-950/20"
    )}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 sm:w-72 glass-sidebar transform transition-all duration-300 ease-out lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        isEmergency && "border-r-2 border-rose-500/50"
      )}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors z-10"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn(
                "w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 hover:rotate-0 transition-all duration-300",
                isEmergency ? "bg-rose-600 shadow-rose-500/40" : "bg-gradient-to-br from-brand-primary to-brand-secondary shadow-brand-primary/20"
              )}>
                <HeartPulse size={20} className="sm:w-[28px]" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-lg sm:text-xl font-display font-black text-foreground leading-none">MedAssist</span>
                <span className={cn(
                  "text-[10px] sm:text-xs font-bold tracking-widest uppercase mt-0.5 sm:mt-1",
                  isEmergency ? "text-rose-500" : "text-brand-primary"
                )}>
                  {isEmergency ? 'EMERGENCY' : 'Health AI'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 sm:px-4 py-2 space-y-1 sm:space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? (isEmergency ? "bg-rose-600 text-white shadow-xl shadow-rose-500/30 scale-[1.02]" : "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/30 scale-[1.02]")
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                    )}
                    <item.icon size={18} className={cn(
                      "transition-transform duration-300 group-hover:scale-110 shrink-0 sm:w-[22px]",
                      isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="relative z-10 hidden sm:inline">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Toggles & User Profile */}
          <div className="p-3 sm:p-4 lg:p-6 mt-auto space-y-3 sm:space-y-4">
            {/* Emergency Toggle */}
            <button
              onClick={() => setIsEmergency(!isEmergency)}
              className={cn(
                "flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl text-xs font-black transition-all duration-300 border",
                isEmergency 
                  ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse" 
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20"
              )}
            >
              <AlertCircle size={18} />
              {isEmergency ? 'EMERGENCY MODE ON' : 'EMERGENCY MODE OFF'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl text-[10px] font-black bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300 border border-border/50"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'DARK' : 'LIGHT'}
              </button>

              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl text-[10px] font-black bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300 border border-border/50"
              >
                <Globe size={16} />
                {language === 'en' ? 'HINDI' : 'ENGLISH'}
              </button>
            </div>

            <div className="bg-muted/40 rounded-3xl p-4 border border-border/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-card shadow-sm flex items-center justify-center overflow-hidden border border-border/50">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-xs font-black text-white bg-foreground hover:bg-rose-600 transition-all duration-300 shadow-lg"
              >
                <LogOut size={16} />
                {t('SIGN OUT', 'लॉग आउट')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Top Header (Mobile Only) */}
        <header className="lg:hidden h-20 bg-card/80 backdrop-blur-md border-b border-border/60 flex items-center px-6 shrink-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 text-muted-foreground hover:bg-muted rounded-2xl transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <HeartPulse size={24} className="text-brand-primary" />
            <span className="font-display font-black text-foreground">MedAssist</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
