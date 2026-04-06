import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[AUTH] Setting up auth state listener...");
    
    // 🔥 Simple and clean: Just listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("[AUTH] 🔄 Auth state changed:", {
        authenticated: !!authUser,
        uid: authUser?.uid || 'none',
        email: authUser?.email || 'none',
        displayName: authUser?.displayName || 'none'
      });
      
      setUser(authUser);
      setLoading(false); // Auth state is now known
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setError(null);
      console.log('[AUTH] 🚀 Opening Google login popup...');
      
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('[AUTH] ✅ Popup login success:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      // User will be automatically set by onAuthStateChanged
    } catch (error: any) {
      console.error('[AUTH] ❌ Popup error:', error.code, error.message);
      
      // Don't show error for user cancellations
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        setError(error.message || 'Failed to login with Google');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}