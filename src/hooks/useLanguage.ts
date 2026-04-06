import { useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('medassist_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('medassist_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (en: string, hi: string) => {
    return language === 'en' ? en : hi;
  };

  return { language, setLanguage, toggleLanguage, t };
}
