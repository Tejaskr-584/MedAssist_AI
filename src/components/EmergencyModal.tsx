import React, { useEffect } from 'react';
import { X, Phone, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useLanguage } from '../hooks/useLanguage';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function EmergencyModal({ isOpen, onClose, message }: EmergencyModalProps) {
  const { t } = useLanguage();

  const handleCallEmergency = () => {
    window.location.href = "tel:112";
  };

  const handleFindHospital = () => {
    window.open("https://www.google.com/maps/search/hospitals+near+me", "_blank");
  };

  // Play alert sound when opened
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio context failed:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      playAlert();
      // Vibrate if supported
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-rose-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl shadow-rose-500/40 border border-rose-400/30 text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 space-y-8">
          <div className="w-24 h-24 bg-white/20 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl animate-pulse">
            <AlertCircle size={48} />
          </div>

          <div className="space-y-4">
            <h3 className="text-4xl font-black text-white tracking-tight uppercase italic">
              {t('🚨 Emergency Alert', '🚨 आपातकालीन अलर्ट')}
            </h3>
            <p className="text-rose-50 font-bold text-lg leading-relaxed">
              {message || t(
                'Severe symptoms detected. Please seek immediate medical attention.',
                'गंभीर लक्षण पाए गए। कृपया तुरंत चिकित्सा सहायता लें।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <button 
              onClick={handleCallEmergency}
              className="w-full py-5 bg-white text-rose-600 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-rose-50 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Phone size={20} fill="currentColor" />
              {t('Call Emergency (112)', 'आपातकालीन कॉल (112)')}
            </button>
            
            <button 
              onClick={handleFindHospital}
              className="w-full py-5 bg-rose-500 text-white border border-rose-400/30 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-rose-400 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <MapPin size={20} />
              {t('Find Nearby Hospital', 'नजदीकी अस्पताल खोजें')}
            </button>

            <button 
              onClick={onClose}
              className="w-full py-4 text-rose-100 font-black text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors"
            >
              {t('Close', 'बंद करें')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
