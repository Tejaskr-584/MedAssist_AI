import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';

export interface ChatHistory {
  id: string;
  title: string;
  createdAt: any;
  lastAnalysis: any;
}

export function useHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatHistory[];
      setHistory(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching history:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { history, isLoading };
}
