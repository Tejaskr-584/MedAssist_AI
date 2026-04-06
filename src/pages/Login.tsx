import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HeartPulse, Chrome, ShieldCheck } from 'lucide-react';

export function Login() {
  const { user, loading, login, error } = useAuth();
  const navigate = useNavigate();

  // ✅ Handle redirect login properly - only navigate when user is confirmed authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log("[LOGIN] User authenticated, redirecting...", {
        uid: user.uid,
        email: user.email
      });
      // Use replace to prevent back button issues
      navigate("/", { replace: true });
    } else if (!loading && !user) {
      console.log("[LOGIN] Not authenticated, staying on login page");
    } else if (loading) {
      console.log("[LOGIN] Still loading auth state...");
    }
  }, [user, loading, navigate]);

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-500">
      
      {/* Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-xl relative z-10">
        <div className="bg-card/40 backdrop-blur-3xl rounded-3xl shadow-2xl border p-10 text-center">

          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white mx-auto mb-8">
            <HeartPulse size={40} />
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-black text-foreground mb-4">
            Your AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              Health Partner
            </span>
          </h1>

          <p className="text-muted-foreground mb-10">
            Experience the future of personal healthcare with intelligent symptom analysis.
          </p>

          {/* Login Button */}
          <button
            onClick={() => {
              console.log("[LOGIN] Google login button clicked");
              login();
            }}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-bold py-4 rounded-xl hover:bg-brand-primary hover:text-white transition-all"
          >
            <Chrome size={20} />
            CONTINUE WITH GOOGLE
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} />
            Secure • Private • HIPAA Compliant
          </div>

        </div>
      </div>
    </div>
  );
}