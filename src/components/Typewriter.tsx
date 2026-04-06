import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onTick?: () => void;
}

export function Typewriter({ text, speed = 30, onComplete, onTick }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const words = text.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < words.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        if (onTick) onTick();
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, words, speed, onComplete, onTick]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
}
